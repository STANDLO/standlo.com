"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

export interface FormListColumn<T = Record<string, unknown>> {
    key: string;
    label?: string; // Chiave I18n o testo libero
    render?: (item: T) => React.ReactNode;
}

export interface FormListProps<T = Record<string, unknown>> {
    data: T[];
    columns: FormListColumn<T>[];
    // Paginazione
    totalItems: number;
    currentPage: number;
    pageSize?: number;
    onPageChange?: (newPage: number) => void;
    // Azioni riga
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
}

export function FormList<T = Record<string, unknown>>({
    data,
    columns,
    totalItems,
    currentPage,
    pageSize = 20,
    onPageChange,
    onRowClick,
    isLoading = false
}: FormListProps<T>) {
    const t = useTranslations("Common");
    const totalPages = Math.ceil(totalItems / pageSize);

    return (
        <div className="ui-list-container">
            <div className="ui-list-wrapper">
                <table className="ui-table">
                    <thead className="ui-table-thead">
                        <tr className="ui-table-tr">
                            {columns.map((col) => (
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
                                    {columns.map((col) => (
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
                                    {columns.map((col) => (
                                        <td key={col.key} className="ui-table-td">
                                            {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as string || "-"}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="ui-table-empty">
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
