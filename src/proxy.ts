import { NextRequest, NextResponse } from "next/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { authMiddleware } from "next-firebase-auth-edge/lib/next/middleware";
import { authConfig } from "@core/auth";

const intlMiddleware = createMiddleware(routing);

// I file public che non richiedono login (es. /auth/read, landing, etc.)
const PUBLIC_PATHS = ['/auth/read/default', '/auth/write/default', '/auth/action/default', '/privacy', '/terms', '/design/read/'];

export async function proxy(request: NextRequest) {
    console.log(`\n[PROXY_TRACE] Incoming request: ${request.nextUrl.pathname}`);
    
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
                    url.pathname = `/${locale}/auth/verify-email/default`;
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
                    url.pathname = `/${locale}/onboarding/start/default`;
                    return NextResponse.redirect(url);
                }
                // Se è già in /onboarding o sta facendo logout, lo lasciamo passare
                headers.set('X-Tenant-Role', role);
                return intlMiddleware(request);
            }

            // 2. GESTIONE STATO ATTIVO (Utenti In Revisione)
            const isInactive = decodedToken.active === false;
            if (isInactive) {
                if (!pathname.includes('/pending') && !pathname.includes('/auth/logout')) {
                    url.pathname = `/${locale}/pending/view/default`;
                    return NextResponse.redirect(url);
                }
                headers.set('X-Tenant-Role', role);
                return intlMiddleware(request);
            }

            // 3. GESTIONE UTENTI COMPLETATI (Ruoli Definitivi)
            // Se un utente completato prova ad accedere a rotte pubbliche o root o all'onboarding o verify-email o pending
            if (pathname === '/' || pathname.includes('/auth/read') || pathname.includes('/auth/write') || pathname.includes('/onboarding') || pathname.includes('/auth/verify-email') || pathname.includes('/pending')) {
                url.pathname = `/${locale}/home/read/default`;
                return NextResponse.redirect(url);
            }

            // 4. PREVENIRE ACCESSO ALLA ROOT DEL LOCALE (es. /it o /en) SENZA UN MODULO ATTIVO
            const isRootLocale = /^\/(?:it|en|es|us|de|fr)\/?$/.test(pathname);
            console.log(`[PROXY_TRACE] ValidToken -> isRootLocale: ${isRootLocale}, pathname: ${pathname}`);
            if (isRootLocale) {
                 url.pathname = `/${locale}/home/read/default`;
                 console.log(`[PROXY_TRACE] ValidToken -> Redirecting root to: ${url.pathname}`);
                 return NextResponse.redirect(url);
            }

            // 5. AUTO-COMPLETAMENTO ROTTE MOZZATE (es. /it/home -> /it/home/read/default)
            // L'architettura esige [module]/[action]/[id] strettamente.
            const shortcutMatch = pathname.match(/^\/(?:it|en|es|us|de|fr)\/([^\/]+)(?:\/([^\/]+))?\/?$/);
            if (shortcutMatch) {
                const mod = shortcutMatch[1];
                const act = shortcutMatch[2];
                const reserved = ['api', '_next', 'onboarding', 'pending', 'partner', 'images'];
                
                if (!reserved.includes(mod)) {
                    url.pathname = `/${locale}/${mod}/${act || 'read'}/default`;
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
            const localeMatch = pathname.match(/^\/(it|en|es|us|de|fr)/);
            const locale = localeMatch ? localeMatch[1] : 'it'; // Default IT

            const isPublic = PUBLIC_PATHS.some(p => pathname.includes(p));
            const isRootLocale = /^\/(?:it|en|es|us|de|fr)\/?$/.test(pathname);
            
            console.log(`[PROXY_TRACE] InvalidToken -> isPublic: ${isPublic}, isRootLocale: ${isRootLocale}, pathname: ${pathname}`);

            // Se l'utente non è autenticato e va in rotta root/locale (es /it)
            if (pathname === '/' || isRootLocale) {
                url.pathname = `/${locale}/auth/read/default`;
                console.log(`[PROXY_TRACE] InvalidToken -> Redirecting root to login: ${url.pathname}`);
                return NextResponse.redirect(url);
            }

            // 5. AUTO-COMPLETAMENTO ROTTE MOZZATE ANCHE PER GUEST
            // Altrimenti un ospite che va su /it/auth/read becchera' 404 perche' manca l'ID
            const shortcutMatch = pathname.match(/^\/(?:it|en|es|us|de|fr)\/([^\/]+)(?:\/([^\/]+))?\/?$/);
            if (shortcutMatch) {
                const mod = shortcutMatch[1];
                const act = shortcutMatch[2];
                const reserved = ['api', '_next', 'images'];
                
                if (!reserved.includes(mod)) {
                    url.pathname = `/${locale}/${mod}/${act || 'read'}/default`;
                    return NextResponse.redirect(url);
                }
            }

            // Ricalcoliamo isPublic casomai il path fosse stato auto-completato virtualmente
            // Se pathname era /it/auth/read diventerà /it/auth/read/default (ma la stringa url.pathname è aggiornata)
            const finalPathname = url.pathname;
            const finalIsPublic = PUBLIC_PATHS.some(p => finalPathname.includes(p));

            // Se non è autenticato e cerca di andare in area privata
            if (!finalIsPublic && !finalPathname.startsWith('/_next') && !finalPathname.startsWith('/api/')) {
                url.pathname = `/${locale}/auth/read/default`;
                console.log(`[PROXY_TRACE] InvalidToken -> Redirecting private access to login: ${url.pathname}`);
                return NextResponse.redirect(url);
            }

            // Exclude API routes from next-intl middleware
            if (finalPathname.startsWith('/api/')) {
                return NextResponse.next();
            }

            // Se è su area pubblica, procede tranquillo (mostrando la view non loggata)
            // request.nextUrl ha ancora il vecchio path originario, quindi dobbiamo passarci l'oggetto `request` con la URL modificata
            if (url.pathname !== pathname) {
                return NextResponse.redirect(url);
            }

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
