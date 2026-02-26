"use client";

import * as React from "react";
import { useForm, DefaultValues, Path } from "react-hook-form";
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
export interface FormCreateProps<T extends z.ZodSchema<any>> {
    orgId?: string;
    roleId: string;
    entityId: string;
    schema: T;
    fields: UIFieldMeta[];
    defaultValues?: DefaultValues<z.infer<T>>;
    onSuccess?: (id: string, data: z.infer<T>) => void;
    submitLabel?: string;
    onCancel?: () => void;
    cancelLabel?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormCreate<T extends z.ZodSchema<any>>({
    orgId,
    roleId,
    entityId,
    schema,
    fields,
    defaultValues,
    onSuccess,
    submitLabel = "Save",
    onCancel,
    cancelLabel = "Cancel"
}: FormCreateProps<T>) {
    const t = useTranslations("Common");

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [globalError, setGlobalError] = React.useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<z.infer<T>>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(schema as any),
        defaultValues,
    });

    useWarnIfUnsavedChanges(isDirty && !isSubmitting);

    const processSubmit = async (data: z.infer<T>) => {
        setIsSubmitting(true);
        setGlobalError(null);
        try {
            const firestoreGateway = httpsCallable(functions, "firestoreGateway");
            const response = await firestoreGateway({
                orgId,
                roleId,
                entityId,
                actionId: "create",
                payload: data
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const resultData = response.data as any;
            if (onSuccess) {
                onSuccess(resultData.id, data);
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

                        return (
                            <div key={fieldMeta.name} className={`ui-form-field ${colSpanClass} ${fieldMeta.className || ""}`}>
                                <label htmlFor={fieldMeta.name} className="ui-input-label">
                                    {fieldMeta.label || fieldMeta.name}
                                    {fieldMeta.required && <span className="ui-required-mark">*</span>}
                                </label>

                                {/* Base text inputs. Expand this switch for more complex types like Localized, Select, etc. */}
                                {fieldMeta.type === "textarea" ? (
                                    <textarea
                                        {...register(fieldMeta.name as Path<z.infer<T>>)}
                                        placeholder={fieldMeta.placeholder}
                                        disabled={fieldMeta.disabled || isSubmitting}
                                        readOnly={fieldMeta.readOnly}
                                        className="ui-textarea"
                                    />
                                ) : fieldMeta.type === "lookup" && fieldMeta.lookupTarget ? (
                                    <InputLookup
                                        value={null} // TODO: collegare a RHF useController
                                        onChange={(val) => {
                                            console.log("Lookup selected:", val);
                                        }}
                                        target={fieldMeta.lookupTarget}
                                        placeholder={fieldMeta.placeholder}
                                        disabled={fieldMeta.disabled || isSubmitting}
                                        readOnly={fieldMeta.readOnly}
                                    />
                                ) : (
                                    <Input
                                        id={fieldMeta.name}
                                        {...register(fieldMeta.name as Path<z.infer<T>>)}
                                        placeholder={fieldMeta.placeholder}
                                        disabled={fieldMeta.disabled || isSubmitting}
                                        readOnly={fieldMeta.readOnly}
                                    />
                                )}

                                {error && (
                                    <span className="ui-error-message">
                                        {(error.message as string) || "Invalid value"}
                                    </span>
                                )}
                            </div>
                        );
                    })}
            </div>

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
        </form>
    );
}
