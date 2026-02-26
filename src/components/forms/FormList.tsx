"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { extractZodKeys } from "@/core/extractZodKeys";
import { functions } from "@/core/firebase";
import { httpsCallable } from "firebase/functions";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface FormListColumn<T = Record<string, unknown>> {
    key: string;
    label?: string; // Chiave I18n o testo libero
    render?: (item: T) => React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FormListProps<S extends z.ZodSchema<any> = z.ZodSchema<any>> {
    orgId?: string;
    roleId: string;
    entityId: string;
    columns: FormListColumn<Record<string, unknown>>[];
    schema?: S;
    onRowClick?: (item: Record<string, unknown>) => void;
    filters?: Record<string, unknown>[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormList<S extends z.ZodSchema<any> = z.ZodSchema<any>>({
    orgId,
    roleId,
    entityId,
    columns,
    schema,
    onRowClick,
    filters = []
}: FormListProps<S>) {
    const t = useTranslations("Common");
    const [data, setData] = React.useState<Record<string, unknown>[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Pagination state
    const [cursor, setCursor] = React.useState<string | null>(null);
    const [hasMore, setHasMore] = React.useState(false);

    const loadData = React.useCallback(async (reset = false) => {
        setIsLoading(true);
        setError(null);
        try {
            const firestoreGateway = httpsCallable(functions, "firestoreGateway");
            const response = await firestoreGateway({
                orgId,
                roleId,
                entityId,
                actionId: "list",
                filters,
                limit: 20,
                cursor: reset ? null : cursor
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const resultData = (response.data as any).data as Record<string, unknown>[];
            if (reset) {
                setData(resultData);
            } else {
                setData(prev => [...prev, ...resultData]);
            }

            // if we got exactly 20, maybe there's more
            setHasMore(resultData.length === 20);
            if (resultData.length > 0) {
                setCursor(resultData[resultData.length - 1].id as string);
            } else if (reset) {
                setCursor(null);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("[FormList] Failed to load list data:", err);
            setError(err.message || "Failed to load");
        } finally {
            setIsLoading(false);
        }
    }, [orgId, roleId, entityId, cursor, filters]);

    React.useEffect(() => {
        loadData(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId, roleId, entityId, JSON.stringify(filters)]);

    const allowedKeys = schema ? extractZodKeys(schema) : null;
    const visibleColumns = columns.filter((col) => !allowedKeys || allowedKeys.includes(col.key));

    return (
        <div className="ui-list-container">
            {error && (
                <div className="ui-error-banner mb-4 p-4 bg-red-50 text-red-600 rounded-md">
                    {error}
                </div>
            )}
            <div className="ui-list-wrapper overflow-x-auto">
                <table className="ui-table w-full text-left border-collapse">
                    <thead className="ui-table-thead border-b">
                        <tr className="ui-table-tr">
                            {visibleColumns.map((col) => (
                                <th key={col.key} className="ui-table-th p-3 font-semibold">
                                    {col.label || col.key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="ui-table-tbody">
                        {isLoading && data.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="ui-table-tr animate-pulse">
                                    {visibleColumns.map((col) => (
                                        <td key={col.key} className="ui-table-td p-3">
                                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length > 0 ? (
                            data.map((item, rowIndex) => (
                                <tr
                                    key={(item.id as string) || rowIndex}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    className={`ui-table-tr border-b hover:bg-gray-50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                                >
                                    {visibleColumns.map((col) => (
                                        <td key={col.key} className="ui-table-td p-3">
                                            {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as string || "-"}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={visibleColumns.length} className="ui-table-empty p-6 text-center text-gray-500">
                                    {t("noResults", { fallback: "Nessun risultato trovato." })}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {hasMore && (
                <div className="ui-pagination-container mt-6 flex justify-center">
                    <Button
                        variant="outline"
                        onClick={() => loadData()}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                        {t("loadMore", { fallback: "Carica Altri" })}
                    </Button>
                </div>
            )}
        </div>
    );
}
