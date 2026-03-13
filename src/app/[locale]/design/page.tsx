import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/core/auth-edge";
import { DesignOnboarding } from "@/components/layout/design/DesignOnboarding";

export default async function DesignPage() {
    const cookieStore = await cookies();
    const tokens = await getTokens(cookieStore, authConfig);
    const isAuthenticated = !!tokens;

    return <DesignOnboarding isAuthenticated={isAuthenticated} />;
}
