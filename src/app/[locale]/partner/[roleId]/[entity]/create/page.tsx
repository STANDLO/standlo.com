"use client";

import * as React from "react";
import { FormCreate } from "@/components/forms/FormCreate";
import { z } from "zod";
import { useRouter } from "next/navigation";

// Temporary fallback schema until Registry pattern is linked
const FallbackSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

export default function GenericEntityCreatePage({ params }: { params: Promise<{ locale: string, roleId: string, entity: string }> }) {
    const { locale, roleId, entity } = React.use(params);
    const router = useRouter();

    return (
        <div className="ui-form-create">
            <FormCreate
                roleId={roleId}
                entityId={entity}
                schema={FallbackSchema}
                fields={[{ name: "name", label: "Name", type: "text", required: true }]}
                onSuccess={(id, data) => {
                    console.log(`[${roleId}] Created ${entity} with ID ${id}:`, data);
                    router.push(`/${locale}/partner/${roleId}/${entity}`);
                }}
                submitLabel="Save"
                onCancel={() => router.push(`/${locale}/partner/${roleId}/${entity}`)}
            />
        </div>
    );
}
