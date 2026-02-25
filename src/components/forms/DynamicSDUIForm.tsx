"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Gallery } from "@/components/ui/Gallery";
import { InputPlace, PlaceResult } from "@/components/ui/InputPlace";
import { auth } from "@/core/firebase";
import { useTranslations } from "next-intl";

// Defines the SDUI field structure passed by WebInterface
export interface SDUIField {
    name: string;
    editable: boolean;
    type?: string;
    label?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
}

export interface SDUIFormProps {
    fields: SDUIField[];
    onSubmit: (data: Record<string, unknown>) => Promise<void>;
    submitLabel?: string;
    loading?: boolean;
}

export function DynamicSDUIForm({ fields, onSubmit, submitLabel = "Salva", loading }: SDUIFormProps) {
    const tRoles = useTranslations("Roles");
    const [formData, setFormData] = React.useState<Record<string, unknown>>({});
    const [addressDetails, setAddressDetails] = React.useState<Partial<PlaceResult>>({});

    const handleFieldChange = (name: string, value: unknown) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        // Merge address details if present
        await onSubmit({ ...formData, ...addressDetails });
    };

    return (
        <form onSubmit={submitForm} className="layout-auth-form">
            {fields.filter(f => f.editable).map(field => {

                // --- GALLERY ---
                if (field.type === "gallery") {
                    return (
                        <div key={field.name} className="layout-auth-field">
                            <Gallery
                                path={auth.currentUser ? `public/uploads/${auth.currentUser.uid}` : `public/temp`}
                                value={formData[field.name] ? [formData[field.name] as string] : []}
                                onChange={(urls) => handleFieldChange(field.name, urls[0])}
                                maxFiles={1}
                                accept="image/png, image/jpeg"
                                label={field.label || field.name}
                            />
                        </div>
                    );
                }

                // --- PLACE AUTOCOMPLETE ---
                if (field.type === "place") {
                    return (
                        <div key={field.name} className="layout-auth-field">
                            <InputPlace
                                id={field.name}
                                label={(field.label || field.name) + (field.required ? " *" : "")}
                                value={(formData[field.name] as string) || ""}
                                onChangeText={(val) => handleFieldChange(field.name, val)}
                                onPlaceSelect={(place) => {
                                    handleFieldChange(field.name, place.fullAddress);
                                    setAddressDetails(place);
                                }}
                                required={field.required}
                                disabled={loading}
                            />
                        </div>
                    );
                }

                // --- SELECT ---
                if (field.type === "select" && field.options) {
                    // Translate options if it's the roleId field (or gracefully fallback for other selects in future)
                    const translatedOptions = field.options.map(opt => ({
                        value: opt.value,
                        label: field.name === 'roleId' && tRoles.has(opt.value) ? tRoles(opt.value) : opt.label
                    }));

                    return (
                        <div key={field.name} className="layout-auth-field">
                            <Select
                                id={field.name}
                                label={(field.label || field.name) + (field.required ? " *" : "")}
                                value={(formData[field.name] as string) || ""}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                disabled={loading}
                                options={translatedOptions}
                            />
                        </div>
                    );
                }

                // --- DEFAULT TEXT INPUT ---
                return (
                    <div key={field.name} className="layout-auth-field">
                        <Input
                            id={field.name}
                            type={field.type === "email" ? "email" : "text"}
                            label={(field.label || field.name) + (field.required ? " *" : "")}
                            value={(formData[field.name] as string) || ""}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            required={field.required}
                            disabled={loading}
                        />
                    </div>
                );
            })}

            <Button type="submit" className="layout-auth-submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : submitLabel}
            </Button>
        </form>
    );
}
