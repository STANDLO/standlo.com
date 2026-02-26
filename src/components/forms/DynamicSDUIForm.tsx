"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Gallery } from "@/components/ui/Gallery";
import { InputPlace } from "@/components/ui/InputPlace";
import { InputVat } from "@/components/ui/InputVat";
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

    const handleFieldChange = (name: string, value: unknown) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <form onSubmit={submitForm} className="layout-auth-form">
            {fields.filter(f => f.editable).map(field => {

                // --- GALLERY ---
                if (field.type === "gallery") {
                    return (
                        <div key={field.name} className="layout-auth-field">
                            <Gallery
                                id={field.name}
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
                                value={formData[field.name]}
                                onPlaceSelect={(place) => {
                                    handleFieldChange(field.name, place);
                                }}
                                required={field.required}
                                disabled={loading}
                            />
                        </div>
                    );
                }

                // --- VAT AUTOCOMPLETE ---
                if (field.type === "vat") {
                    return (
                        <div key={field.name} className="layout-auth-field">
                            <InputVat
                                id={field.name}
                                label={(field.label || field.name) + (field.required ? " *" : "")}
                                value={(formData[field.name] as string) || ""}
                                onChange={(val) => handleFieldChange(field.name, val)}
                                required={field.required}
                                disabled={loading}
                                roleId={(formData.roleId as string) || ""}
                                onViesData={(data) => {
                                    // Auto-fill company name if empty
                                    if (data.name && !formData.name) {
                                        handleFieldChange('name', data.name);
                                    }
                                    // Auto-fill address if empty
                                    if (data.address && (!formData.place || !(formData.place as Record<string, unknown>).fullAddress)) {
                                        const cleanAddress = data.address.trim().replace(/\n/g, ', ');
                                        handleFieldChange('place', { fullAddress: cleanAddress });
                                    }
                                }}
                            />
                        </div>
                    );
                }

                // --- SELECT ---
                if (field.type === "select" && field.options) {
                    // Translate options if it's the roleId field (or gracefully fallback for other selects in future)
                    const translatedOptions = field.options.map(opt => {
                        let newLabel = opt.label;
                        if (field.name === 'roleId') {
                            try {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const tr = tRoles(opt.value as any);
                                // next-intl restituisce la stessa chiave se manca, es. "customer" invece di tradurlo
                                // ma se la traduzione è andata a buon fine usiamo tr, altrimenti opt.label
                                if (tr && tr !== opt.value && !tr.includes('Roles.')) {
                                    newLabel = tr;
                                }
                            } catch {
                                // fallback su opt.label
                            }
                        }
                        return { value: opt.value, label: newLabel };
                    });

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
