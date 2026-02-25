"use client";

import * as React from "react";
import { useForm, DefaultValues, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";

import { UIFieldMeta } from "@/core/schemas";
import { extractZodKeys } from "@/core/extractZodKeys";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useWarnIfUnsavedChanges } from "@/hooks/useWarnIfUnsavedChanges";
import { InputLookup } from "./InputLookup";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FormDetailProps<T extends z.ZodSchema<any>> {
    schema: T;
    fields: UIFieldMeta[];
    defaultValues: DefaultValues<z.infer<T>>; // Obbligatorio in Detail
    onSubmit: (data: z.infer<T>) => Promise<void>;
    submitLabel?: string;
    onCancel?: () => void;
    cancelLabel?: string;
    readOnlyMode?: boolean; // Se true, l'intero form è congelato
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FormDetail<T extends z.ZodSchema<any>>({
    schema,
    fields,
    defaultValues,
    onSubmit,
    submitLabel = "Save Changes",
    onCancel,
    cancelLabel = "Cancel",
    readOnlyMode = false
}: FormDetailProps<T>) {
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

    useWarnIfUnsavedChanges(isDirty && !isSubmitting && !readOnlyMode);

    const processSubmit = async (data: z.infer<T>) => {
        setIsSubmitting(true);
        setGlobalError(null);
        try {
            await onSubmit(data);
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                setGlobalError(err.message);
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
