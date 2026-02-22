"use client";

import * as React from "react";
import { useForm, DefaultValues, FieldValues, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UIFieldMeta } from "@/core/meta";
import { Input } from "./Input";
import { InputLocalized } from "./InputLocalized";
import { Textarea } from "./Textarea";
import { TextareaLocalized } from "./TextareaLocalized";
import { InputLookup } from "./InputLookup";
import { Button } from "./Button";

interface FormCreateProps<T extends FieldValues> {
    schema: z.ZodType<T>;
    fields: UIFieldMeta[];
    defaultValues?: DefaultValues<T>;
    onSubmit: (data: T) => Promise<void>;
    submitLabel?: string;
    loadingLabel?: string;
}

/**
 * Utility per estrarre le chiavi validate da qualsiasi variante di ZodObject (Agnostico alla v3/v4).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getZodObjectKeys(schema: any): string[] {
    let currentSchema = schema;

    // Srotola eventuali refinement/effects
    while (currentSchema?._def?.typeName === "ZodEffects") {
        currentSchema = currentSchema._def.schema;
    }

    if (currentSchema?.shape) {
        return Object.keys(currentSchema.shape);
    }

    return [];
}

export function FormCreate<T extends FieldValues>({
    schema,
    fields,
    defaultValues,
    onSubmit,
    submitLabel = "Salva",
    loadingLabel = "Salvataggio in corso..."
}: FormCreateProps<T>) {

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<T>({
        // Bypass RHF type constraint issue as schema wrapper type varies
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(schema as any) as any,
        defaultValues,
    });

    const allowedKeys = React.useMemo(() => getZodObjectKeys(schema), [schema]);
    const visibleFields = React.useMemo(() => fields.filter(f => allowedKeys.includes(f.key)), [fields, allowedKeys]);

    // Hook per impedire transizioni accidentali se isDirty
    React.useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Triggera il modal nativo del browser
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const execSubmit: SubmitHandler<T> = async (data) => {
        await onSubmit(data);
    };

    const renderField = (field: UIFieldMeta) => {
        const fieldName = field.key as import("react-hook-form").Path<T>;

        return (
            <React.Fragment key={field.key}>
                {(() => {
                    const errorObj = errors[fieldName] as Record<string, unknown> | undefined;
                    let errorMessage: string | undefined;

                    if (errorObj && typeof errorObj === 'object' && 'message' in errorObj) {
                        errorMessage = errorObj.message as string;
                    } else if (errorObj && typeof errorObj === 'object' && 'it' in errorObj) {
                        const itError = errorObj.it as Record<string, unknown>;
                        if (itError?.message) errorMessage = itError.message as string;
                    }

                    switch (field.type) {
                        case "text":
                        case "email":
                        case "password":
                        case "number":
                            return (
                                <Input
                                    type={field.type}
                                    label={field.label}
                                    placeholder={field.placeholder}
                                    disabled={field.disabled || isSubmitting}
                                    error={errorMessage}
                                    containerClassName={field.gridSpan}
                                    {...register(fieldName, {
                                        valueAsNumber: field.type === "number"
                                    })}
                                />
                            );
                        case "textarea":
                            return (
                                <Textarea
                                    label={field.label}
                                    placeholder={field.placeholder}
                                    disabled={field.disabled || isSubmitting}
                                    error={errorMessage}
                                    containerClassName={field.gridSpan}
                                    {...register(fieldName)}
                                />
                            );
                        case "localized":
                        case "textarea-localized":
                        case "lookup":
                            return (
                                <Controller
                                    control={control}
                                    name={fieldName}
                                    render={({ field: controllerField }) => {
                                        if (field.type === "localized") {
                                            return (
                                                <InputLocalized
                                                    label={field.label}
                                                    disabled={field.disabled || isSubmitting}
                                                    error={errorMessage}
                                                    className={field.gridSpan}
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                    value={controllerField.value as any}
                                                    onChange={controllerField.onChange}
                                                />
                                            );
                                        } else if (field.type === "textarea-localized") {
                                            return (
                                                <TextareaLocalized
                                                    label={field.label}
                                                    disabled={field.disabled || isSubmitting}
                                                    error={errorMessage}
                                                    className={field.gridSpan}
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                    value={controllerField.value as any}
                                                    onChange={controllerField.onChange}
                                                />
                                            );
                                        } else {
                                            // lookup
                                            return (
                                                <InputLookup
                                                    label={field.label}
                                                    disabled={field.disabled || isSubmitting}
                                                    error={errorMessage}
                                                    containerClassName={field.gridSpan}
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                    value={controllerField.value as any}
                                                    onChange={controllerField.onChange}
                                                    onSearch={field.onLookupSearch}
                                                    displayValue={field.lookupDisplayValue}
                                                    placeholder={field.placeholder}
                                                />
                                            );
                                        }
                                    }}
                                />
                            );
                        default:
                            return null;
                    }
                })()}
            </React.Fragment>
        );
    };

    return (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <form onSubmit={handleSubmit(execSubmit as any)} className="w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleFields.map((field) => renderField(field))}
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto"
                >
                    {isSubmitting ? loadingLabel : submitLabel}
                </Button>
            </div>
        </form>
    );
}
