"use client";

import * as React from "react";
import { FormDetail } from "@/components/forms/FormDetail";
import { z } from "zod";
import { useRouter } from "next/navigation";

// Temporary fallback schema until Registry pattern is linked
const FallbackSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

export default function GenericEntityDetailPage({ params }: { params: Promise<{ locale: string, roleId: string, entity: string, uid: string }> }) {
    const { locale, roleId, entity, uid } = React.use(params);
    const router = useRouter();

    // TODO: Centralized read logic by uid
    const dummyRecord = { name: `Sample ${entity} ${uid}` };

    return (
        <div className="ui-form-detail">
            <FormDetail
                schema={FallbackSchema}
                fields={[{ name: "name", label: "Name", type: "text", required: true }]}
                defaultValues={dummyRecord}
                onSubmit={async (data) => {
                    console.log(`[${roleId}] Updating ${entity}:`, data);
                    alert(`Update Feature is dynamically bound for ${uid}`);
                    router.push(`/${locale}/partner/${roleId}/${entity}`);
                }}
                submitLabel="Save Changes"
                onCancel={() => router.push(`/${locale}/partner/${roleId}/${entity}`)}
            />
        </div>
    );
}
