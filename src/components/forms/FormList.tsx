"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { extractZodKeys } from "@/core/extractZodKeys";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FormListColumn<T = any> {
    key: string;
    label?: string; // Chiave I18n o testo libero
    render?: (item: T) => React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FormListProps<T = any, S extends z.ZodSchema<any> = z.ZodSchema<any>> {
    data: T[];
    columns: FormListColumn<T>[];
    schema?: S; // Opzionale per list list statici senza RBAC
    // Paginazione
    totalItems: number;
    currentPage: number;
    pageSize?: number;
    onPageChange?: (newPage: number) => void;
    // Azioni riga
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormList<T = any, S extends z.ZodSchema<any> = z.ZodSchema<any>>({
    data,
    columns,
    schema,
    totalItems,
    currentPage,
    pageSize = 20,
    onPageChange,
    onRowClick,
    isLoading = false
}: FormListProps<T, S>) {
    const t = useTranslations("Common");
    const totalPages = Math.ceil(totalItems / pageSize);

    // Dynamic RBAC Filter: If a schema is provided, we only render columns that are explicitly allowed in the schema shape.
    const allowedKeys = schema ? extractZodKeys(schema) : null;
    const visibleColumns = columns.filter((col) => !allowedKeys || allowedKeys.includes(col.key));

    return (
        <div className="ui-list-container">
            <div className="ui-list-wrapper">
                <table className="ui-table">
                    <thead className="ui-table-thead">
                        <tr className="ui-table-tr">
                            {visibleColumns.map((col) => (
                                <th key={col.key} className="ui-table-th">
                                    {col.label || col.key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="ui-table-tbody">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="ui-table-tr">
                                    {visibleColumns.map((col) => (
                                        <td key={col.key} className="ui-table-td">
                                            <div className="ui-table-skeleton"></div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length > 0 ? (
                            data.map((item, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    className={`ui-table-tr ${onRowClick ? "cursor-pointer" : ""}`}
                                >
                                    {visibleColumns.map((col) => (
                                        <td key={col.key} className="ui-table-td">
                                            {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as string || "-"}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={visibleColumns.length} className="ui-table-empty">
                                    {t("noResults", { fallback: "Nessun risultato trovato." })}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Simple Pagination */}
            {totalPages > 1 && (
                <div className="ui-pagination-container">
                    <div className="ui-pagination-text">
                        Pagina {currentPage} di {totalPages}
                    </div>
                    <div className="ui-pagination-actions">
                        <button
                            className="ui-btn ui-btn-outline h-8 px-3"
                            onClick={() => onPageChange && onPageChange(currentPage - 1)}
                            disabled={currentPage <= 1 || isLoading}
                        >
                            Precedente
                        </button>
                        <button
                            className="ui-btn ui-btn-outline h-8 px-3"
                            onClick={() => onPageChange && onPageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages || isLoading}
                        >
                            Successiva
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
