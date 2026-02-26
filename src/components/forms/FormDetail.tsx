"use client";

import * as React from "react";
import { useForm, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

import { UIFieldMeta } from "@/core/schemas";
import { extractZodKeys } from "@/core/extractZodKeys";
import { functions } from "@/core/firebase";
import { httpsCallable } from "firebase/functions";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useWarnIfUnsavedChanges } from "@/hooks/useWarnIfUnsavedChanges";
import { InputLookup } from "./InputLookup";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FormDetailProps<T extends z.ZodSchema<any>> {
    orgId?: string;
    roleId: string;
    entityId: string;
    uid: string;
    schema: T;
    fields: UIFieldMeta[];
    onSuccess?: (id: string, data: z.infer<T>) => void;
    submitLabel?: string;
    onCancel?: () => void;
    cancelLabel?: string;
    readOnlyMode?: boolean; // Se true, l'intero form è congelato
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormDetail<T extends z.ZodSchema<any>>({
    orgId,
    roleId,
    entityId,
    uid,
    schema,
    fields,
    onSuccess,
    submitLabel = "Save Changes",
    onCancel,
    cancelLabel = "Cancel",
    readOnlyMode = false
}: FormDetailProps<T>) {
    const t = useTranslations("Common");

    const [isLoading, setIsLoading] = React.useState(true);
    const [fetchError, setFetchError] = React.useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [globalError, setGlobalError] = React.useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty },
    } = useForm<z.infer<T>>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(schema as any),
    });

    React.useEffect(() => {
        const loadEntity = async () => {
            setIsLoading(true);
            setFetchError(null);
            try {
                const firestoreGateway = httpsCallable(functions, "firestoreGateway");
                const response = await firestoreGateway({
                    orgId,
                    roleId,
                    entityId,
                    actionId: "read",
                    payload: { id: uid }
                });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const resultData = response.data as any;
                reset(resultData.data);
            } catch (err: unknown) {
                console.error("Failed to load entity:", err);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setFetchError((err as any).message || "Failed to load data");
            } finally {
                setIsLoading(false);
            }
        };

        loadEntity();
    }, [orgId, roleId, entityId, uid, reset]);

    useWarnIfUnsavedChanges(isDirty && !isSubmitting && !readOnlyMode && !isLoading);

    const processSubmit = async (data: z.infer<T>) => {
        setIsSubmitting(true);
        setGlobalError(null);
        try {
            const firestoreGateway = httpsCallable(functions, "firestoreGateway");
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const response = await firestoreGateway({
                orgId,
                roleId,
                entityId,
                actionId: "update",
                payload: { id: uid, ...data }
            });

            if (onSuccess) {
                onSuccess(uid, data);
            }
        } catch (err: unknown) {
            console.error(err);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((err as any).message) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setGlobalError((err as any).message);
            } else {
                setGlobalError("An unexpected error occurred.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="ui-form-loading p-12 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="ui-error-banner mb-4 p-4 bg-red-50 text-red-600 rounded-md">
                Error loading {entityId}: {fetchError}
            </div>
        );
    }

    return (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <form onSubmit={handleSubmit(processSubmit as any)} className="ui-form">
            {globalError && (
                <div className="ui-error-banner">
                    {globalError}
                </div>
            )}

            <div className="ui-form-grid">
                {fields
                    .filter((fieldMeta) => extractZodKeys(schema).includes(fieldMeta.name))
                    .map((fieldMeta) => {
                        const error = errors[fieldMeta.name];
                        const colSpanClass = fieldMeta.colSpan ? `md:col-span-${fieldMeta.colSpan}` : "md:col-span-12";

                        const disabledOrReadonly = readOnlyMode || fieldMeta.disabled || fieldMeta.readOnly || isSubmitting;

                        return (
                            <div key={fieldMeta.name} className={`ui-form-field ${colSpanClass} ${fieldMeta.className || ""}`}>
                                <label htmlFor={fieldMeta.name} className="ui-input-label">
                                    {fieldMeta.label || fieldMeta.name}
                                    {!readOnlyMode && fieldMeta.required && <span className="ui-required-mark">*</span>}
                                </label>

                                {/* Base text inputs. Expand this switch for more complex types like Localized, Select, etc. */}
                                {fieldMeta.type === "textarea" ? (
                                    <textarea
                                        id={fieldMeta.name}
                                        {...register(fieldMeta.name as Path<z.infer<T>>)}
                                        placeholder={fieldMeta.placeholder}
                                        disabled={disabledOrReadonly}
                                        readOnly={fieldMeta.readOnly}
                                        className="ui-textarea"
                                    />
                                ) : fieldMeta.type === "lookup" && fieldMeta.lookupTarget ? (
                                    <InputLookup
                                        value={null}
                                        onChange={(val) => { console.log(val) }}
                                        target={fieldMeta.lookupTarget}
                                        placeholder={fieldMeta.placeholder}
                                        disabled={disabledOrReadonly}
                                        readOnly={fieldMeta.readOnly}
                                    />
                                ) : (
                                    <Input
                                        id={fieldMeta.name}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        {...register(fieldMeta.name as any)}
                                        placeholder={fieldMeta.placeholder}
                                        disabled={disabledOrReadonly}
                                        readOnly={fieldMeta.readOnly}
                                    />
                                )}

                                {error && !readOnlyMode && (
                                    <span className="ui-error-message">
                                        {(error.message as string) || "Invalid value"}
                                    </span>
                                )}
                            </div>
                        );
                    })}
            </div>

            {!readOnlyMode && (
                <div className="ui-form-actions">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                            {t(cancelLabel, { fallback: cancelLabel })}
                        </Button>
                    )}
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : t(submitLabel, { fallback: submitLabel })}
                    </Button>
                </div>
            )}
        </form>
    );
}
