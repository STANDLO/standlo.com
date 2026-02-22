"use client";

import * as React from "react";
import { UIFieldMeta } from "@/core/meta";
import { Loader2 } from "lucide-react";
import { Button } from "./Button";

interface FormListProps<T> {
    fields: UIFieldMeta[];
    data: T[];
    totalCount?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onRowClick?: (row: T) => void;
    isLoading?: boolean;
    emptyText?: string;
    // Current Active Locale for LocalizedString display
    locale?: "it" | "en" | "es" | "fr" | "de" | "pt" | "ru" | "zh";
}

export function FormList<T extends Record<string, unknown>>({
    fields,
    data,
    totalCount = 0,
    page = 1,
    pageSize = 10,
    onPageChange,
    onRowClick,
    isLoading = false,
    emptyText = "Nessun record trovato",
    locale = "it"
}: FormListProps<T>) {

    // Only render columns that have a label and are not meant to be fully hidden in lists
    const tableColumns = fields.filter(f => f.label !== undefined);

    const renderCellContent = (value: unknown, field: UIFieldMeta) => {
        if (value === null || value === undefined) return "-";

        switch (field.type) {
            case "localized":
            case "textarea-localized":
                if (typeof value === "object" && value !== null) {
                    const locStr = value as Record<string, string | undefined>;
                    return locStr[locale] || locStr["it"] || "-";
                }
                return "-";
            case "number":
                return value.toString();
            // Implement further rendering logic for custom types if needed
            default:
                if (typeof value === 'object') {
                    return JSON.stringify(value);
                }
                return String(value);
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="w-full space-y-4">
            <div className="rounded-md border border-border overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                        <tr>
                            {tableColumns.map(col => (
                                <th key={col.key} className="px-6 py-3 font-medium">
                                    {col.label || col.key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && data.length === 0 ? (
                            <tr>
                                <td colSpan={tableColumns.length} className="px-6 py-12 text-center text-muted-foreground">
                                    <div className="flex justify-center items-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={tableColumns.length} className="px-6 py-12 text-center text-muted-foreground">
                                    {emptyText}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, i) => (
                                <tr
                                    key={`row-${i}`}
                                    className={`bg-card border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                                    onClick={() => onRowClick && onRowClick(row)}
                                >
                                    {tableColumns.map(col => (
                                        <td key={col.key} className="px-6 py-4 truncate max-w-xs">
                                            {renderCellContent(row[col.key], col)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <span className="text-sm text-muted-foreground">
                        Pagina {page} di {totalPages} ({totalCount} record)
                    </span>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || isLoading}
                            onClick={() => onPageChange && onPageChange(page - 1)}
                        >
                            Precedente
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages || isLoading}
                            onClick={() => onPageChange && onPageChange(page + 1)}
                        >
                            Successiva
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
