import { NextRequest, NextResponse } from "next/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { authMiddleware } from "next-firebase-auth-edge/lib/next/middleware";
import { authConfig } from "./core/auth-edge";

const intlMiddleware = createMiddleware(routing);

// I file public che non richiedono login (es. /auth/login, landing, etc.)
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/action'];

export async function proxy(request: NextRequest) {
    // 1. JWT Parsing & Role Redirection
    // In assenza di ServiceAccount, Next-Firebase-Auth-Edge verificherà 
    // l'ID Token in Edge usando le JWKS pubbliche di Google API.
    return authMiddleware(request, {
        loginPath: "/api/auth/login",
        logoutPath: "/api/auth/logout",
        ...authConfig,
        handleValidToken: async ({ decodedToken }, headers) => {
            // Estrazione lingua e URL
            const url = request.nextUrl.clone();
            const pathname = url.pathname;
            const localeMatch = pathname.match(/^\/(it|en|es|us|de|fr)/);
            const locale = localeMatch ? localeMatch[1] : 'it'; // Default IT

            const role = (decodedToken.role as string) || 'pending'; // Fallback a pending se non definito
            const isOnboardingCompleted = decodedToken.onboarding === true;
            const isEmailVerified = decodedToken.email_verified === true;

            // 0. GESTIONE VERIFICA EMAIL
            if (!isEmailVerified) {
                if (!pathname.includes('/auth/verify-email') && !pathname.includes('/auth/logout') && !pathname.includes('/auth/action')) {
                    url.pathname = `/${locale}/auth/verify-email`;
                    return NextResponse.redirect(url);
                }
                // Se è già in verify-email o sta facendo logout, lo lasciamo passare
                headers.set('X-Tenant-Role', role);
                return intlMiddleware(request);
            }

            // 1. GESTIONE ONBOARDING
            // Se l'utente non ha ancora completato il profilo
            if (!isOnboardingCompleted || role === 'pending') {
                // Se sta cercando di accedere in qualsiasi rotta privata diversa da onboarding, forzalo a onboarding
                if (!pathname.includes('/onboarding') && !pathname.includes('/auth/logout')) {
                    url.pathname = `/${locale}/onboarding`;
                    return NextResponse.redirect(url);
                }
                // Se è già in /onboarding o sta facendo logout, lo lasciamo passare
                headers.set('X-Tenant-Role', role);
                return intlMiddleware(request);
            }

            // 2. GESTIONE UTENTI COMPLETATI (Ruoli Definitivi)
            // Se un utente completato prova ad accedere a rotte pubbliche o root o all'onboarding o verify-email
            if (pathname === '/' || pathname.includes('/auth/login') || pathname.includes('/auth/register') || pathname.includes('/onboarding') || pathname.includes('/auth/verify-email')) {
                url.pathname = `/${locale}/${role}`;
                return NextResponse.redirect(url);
            }

            // 3. VALIDAZIONE PERMESSI DI AREA (es. /en/admin ma è customer)
            const areaMatch = pathname.match(/^\/(?:it|en|es|us|de|fr)\/([^\/]+)/);
            if (areaMatch) {
                const requestedArea = areaMatch[1];
                if (requestedArea !== 'auth' && requestedArea !== 'debug' && requestedArea !== role) {
                    // Unauthorized: Ritorna alla sua area di competenza
                    url.pathname = `/${locale}/${role}`;
                    return NextResponse.redirect(url);
                }
            }

            // Iniezione tenant/role headers for Server Components
            headers.set('X-Tenant-Role', role);
            if (decodedToken.organizationId) {
                headers.set('X-Tenant-Org', decodedToken.organizationId as string);
            }

            // Exclude API routes from next-intl middleware
            if (pathname.startsWith('/api/')) {
                const res = NextResponse.next({ request: { headers } });
                return res;
            }

            // Procede regolarmente col rendering Next-Intl
            return intlMiddleware(request);
        },
        handleInvalidToken: async () => {
            const url = request.nextUrl.clone();
            const pathname = url.pathname;
            const localeMatch = pathname.match(/^\/(it|en|es)/);
            const locale = localeMatch ? localeMatch[1] : 'it'; // Default IT

            const isPublic = PUBLIC_PATHS.some(p => pathname.includes(p));

            // Se non è autenticato e cerca di andare in area privata
            if (!isPublic && pathname !== '/' && !pathname.startsWith('/_next') && !pathname.startsWith('/api/')) {
                url.pathname = `/${locale}/auth/login`;
                return NextResponse.redirect(url);
            }

            // Exclude API routes from next-intl middleware
            if (pathname.startsWith('/api/')) {
                return NextResponse.next();
            }

            // Se è su area pubblica, procede tranquillo (mostrando la view non loggata)
            return intlMiddleware(request);
        },
        handleError: async (error) => {
            console.error('Middleware proxy error:', error);
            // Fallback safe: lascia gestire a next-intl per non causare blank screens
            return intlMiddleware(request);
        }
    });
}

// Intercetta tutto tranne i file statici, immagini (.svg, .png) ecc.
export const config = {
    matcher: ['/', '/(it|en|es)/:path*', '/api/auth/login', '/api/auth/logout', '/((?!_next/|images/|api/|.*\\..*).*)'],
};
