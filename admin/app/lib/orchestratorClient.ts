import { auth } from "@/core/firebase";

export interface OrchestratorRequest {
    entityId: string;
    actionId: "list" | "read" | "get_assembly_details" | "get_bundle_details" | "get_stand_details" | "create_entity" | "update_entity" | "delete_entity" | "onboard_organization" | "activate_user" | "get_admin_kpis" | string;
    payload?: Record<string, unknown>;
    roleId?: string;
    orgId?: string;
}

export interface OrchestratorResponse<T = unknown> {
    status: "success" | "error";
    data?: T;
    message?: string;
    details?: unknown;
}

export class OrchestratorClient {
    /**
     * Executes a call to the Orchestrator gateway.
     */
    static async call<T = unknown>(request: OrchestratorRequest): Promise<OrchestratorResponse<T>> {
        if (typeof auth.authStateReady === "function") {
            await auth.authStateReady();
        }

        const currentUser = auth.currentUser;

        let idToken = "";
        if (currentUser) {
            try {
                idToken = await currentUser.getIdToken();
            } catch (e) {
                console.warn("Could not fetch ID token (network error or emulator issue):", e);
            }
        }

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (idToken) {
            headers["Authorization"] = `Bearer ${idToken}`;
        }

        // Apply default superadmin role if not provided for PDM operations
        const bodyPayload = {
            ...request,
            roleId: request.roleId || "admin",
            orgId: request.orgId || "standlo", // Hardcoded standard org for now
        };

        const response = await fetch("/admin/api/gateway?target=orchestrator", {
            method: "POST",
            headers,
            body: JSON.stringify(bodyPayload)
        });

        if (!response.ok) {
            let errorMsg = "Orchestrator request failed";
            try {
                const errData = await response.json();
                errorMsg = errData.message || errData.error?.message || errorMsg;
            } catch {
                errorMsg = await response.text();
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();

        // Unpack standard Cloud Functions response { result: { status, data } }
        if (data.result) {
            return data.result as OrchestratorResponse<T>;
        }

        return data as OrchestratorResponse<T>;
    }

    static async list<T = unknown>(entityId: string, payload?: Record<string, unknown>): Promise<T[]> {
        const res = await this.call<T[]>({ entityId, actionId: "list", payload });
        if (res.status === "error") throw new Error(res.message);
        return res.data || [];
    }

    static async read<T = unknown>(entityId: string, docId: string): Promise<T | null> {
        const res = await this.call<T>({ entityId, actionId: "read", payload: { id: docId } });
        if (res.status === "error") throw new Error(res.message);
        return res.data || null;
    }

    static async getDetails<T = unknown>(entityId: string, docId: string): Promise<T | null> {
        const actionId = `get_${entityId}_details`;
        const res = await this.call<T>({ entityId, actionId, payload: { id: docId } });
        if (res.status === "error") throw new Error(res.message);
        return res.data || null;
    }

    static async create<T = unknown>(entityId: string, payload: Record<string, unknown>): Promise<T | null> {
        const payloadWithMeta = { type: entityId, ...payload };
        const res = await this.call<T>({ entityId, actionId: "create_entity", payload: payloadWithMeta });
        if (res.status === "error") throw new Error(res.message);
        return res.data || null;
    }

    static async update<T = void>(entityId: string, payload: Record<string, unknown>): Promise<T | null> {
        const payloadWithMeta = { type: entityId, ...payload };
        const res = await this.call<T>({ entityId, actionId: "update_entity", payload: payloadWithMeta });
        if (res.status === "error") throw new Error(res.message);
        return res.data || null;
    }

    static async delete<T = void>(entityId: string, docId: string): Promise<T | null> {
        const res = await this.call<T>({ entityId, actionId: "delete_entity", payload: { id: docId } });
        if (res.status === "error") throw new Error(res.message);
        return res.data || null;
    }
}
