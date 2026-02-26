"use client";

import * as React from "react";
import { FormList } from "@/components/forms/FormList";
import { useRouter } from "next/navigation";

export default function GenericEntityListPage({ params }: { params: Promise<{ locale: string, roleId: string, entity: string }> }) {
    const { locale, roleId, entity } = React.use(params);
    const router = useRouter();

    return (
        <div className="ui-form-list">
            <FormList
                roleId={roleId}
                entityId={entity}
                columns={[
                    { key: "id", label: "ID" },
                    { key: "name", label: "Name" },
                    { key: "createdAt", label: "Data Creazione" }
                ]}
                onRowClick={(item) => router.push(`/${locale}/partner/${roleId}/${entity}/${item.id}`)}
            />
        </div>
    );
}
