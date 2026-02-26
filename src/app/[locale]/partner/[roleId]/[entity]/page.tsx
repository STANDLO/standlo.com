"use client";

import * as React from "react";
import { FormList } from "@/components/forms/FormList";
import { useRouter } from "next/navigation";

export default function GenericEntityListPage({ params }: { params: Promise<{ locale: string, roleId: string, entity: string }> }) {
    const { locale, roleId, entity } = React.use(params);
    const router = useRouter();

    // TODO: Dynamic data fetch resolution based on entity schema
    const dummyData = [
        { id: "1", name: `Sample ${entity} 1`, status: "Active" },
        { id: "2", name: `Sample ${entity} 2`, status: "Pending" }
    ];

    return (
        <div className="ui-form-list">
            <FormList
                data={dummyData}
                columns={[
                    { key: "id", label: "ID" },
                    { key: "name", label: "Name" },
                    { key: "status", label: "Status" }
                ]}
                totalItems={2}
                currentPage={1}
                onRowClick={(item) => router.push(`/${locale}/partner/${roleId}/${entity}/${item.id}`)}
            />
        </div>
    );
}
