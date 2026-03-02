import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/core/auth-edge";
import { redirect } from "next/navigation";

export default async function PartnerRootRedirect({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const tokens = await getTokens(cookieStore, authConfig);

    if (!tokens) {
        redirect(`/${locale}/auth/login`);
    }

    const claims = (tokens.decodedToken || {}) as Record<string, unknown>;
    const role = (claims.role as string) || "pending";

    // Reindirizzamento allo spazio di lavoro corretto in base al claim "role"
    redirect(`/${locale}/partner/${role}`);
}
