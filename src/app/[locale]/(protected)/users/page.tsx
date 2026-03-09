import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/core/auth-edge";
import { redirect } from "next/navigation";
import OrganizationUsersCreate from "@/components/forms/OrganizationUsersCreate";

export default async function UsersManagementPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const cookieStore = await cookies();
    const tokens = await getTokens(cookieStore, authConfig);

    if (!tokens) {
        redirect(`/${locale}/auth/login`);
    }

    const claims = (tokens.decodedToken || {}) as Record<string, unknown>;
    const orgId = claims.orgId as string;
    const userType = claims.type as string;

    if (!orgId || userType !== "ADMIN") {
        redirect(`/${locale}/`);
    }

    return <OrganizationUsersCreate currentOrgId={orgId} />;
}
