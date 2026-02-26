import { Dashboard } from "@/components/forms/Dashboard";

export default async function GenericRolePage({ params }: { params: Promise<{ roleId: string }> }) {
    const { roleId } = await params;

    // In futuro qui renderizzeremo la Dashboard specifica o ricadrà su DevMode
    return <Dashboard roleId={roleId} />;
}
