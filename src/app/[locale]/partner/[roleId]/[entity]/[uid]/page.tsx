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

    // Removed manual dummy variable since data will be fetched inside FormDetail

    return (
        <div className="ui-form-detail">
            <FormDetail
                roleId={roleId}
                entityId={entity}
                uid={uid}
                schema={FallbackSchema}
                fields={[{ name: "name", label: "Name", type: "text", required: true }]}
                onSuccess={() => {

                    router.push(`/${locale}/partner/${roleId}/${entity}`);
                }}
                submitLabel="Save Changes"
                onCancel={() => router.push(`/${locale}/partner/${roleId}/${entity}`)}
            />
        </div>
    );
}
