"use client";

import * as React from "react";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { InputPlace, PlaceResult } from "@/components/ui/InputPlace";

export function OnboardingForm({ locale }: { locale: string }) {
    const t = useTranslations("Auth.Onboarding");


    const [role, setRole] = React.useState("customer");
    const [vatNumber, setVatNumber] = React.useState("");
    const [sdiCode, setSdiCode] = React.useState("");
    const [iban, setIban] = React.useState("");

    // Address state
    const [fullAddress, setFullAddress] = React.useState("");
    const [addressDetails, setAddressDetails] = React.useState<Partial<PlaceResult>>({});

    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Call the Server Action / API to finalize the onboarding
            const res = await fetch("/api/auth/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role,
                    vatNumber,
                    sdiCode,
                    iban,
                    fullAddress,
                    ...addressDetails
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to complete onboarding");
            }

            // On success, Firebase claims will be updated. We must force a token refresh.
            // A simple page reload securely navigates through proxy.ts which will now see the NEW role.
            window.location.href = `/${locale}`;

        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Onboarding failed");
            }
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
            {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-1.5">
                <label htmlFor="role" className="text-sm font-medium leading-none">
                    {t("roleLabel", { fallback: "Seleziona il tuo ruolo" })}
                </label>
                <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isLoading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="customer">Cliente / Espositore</option>
                    <option value="provider">Fornitore Materiali</option>
                    <option value="manager">Account Manager</option>
                    <option value="designer">Progettista / Designer</option>
                    <option value="carpenter">Falegname</option>
                    <option value="builder">Allestitore</option>
                    <option value="painter">Pittore</option>
                    <option value="technician">Tecnico</option>
                    <option value="driver">Trasportatore</option>
                    <option value="promoter">Promoter</option>
                </select>
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="vatNumber" className="text-sm font-medium leading-none">
                    {t("vatLabel", { fallback: "Partita IVA" })}
                </label>
                <Input
                    id="vatNumber"
                    type="text"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="sdiCode" className="text-sm font-medium leading-none">
                    {t("sdiLabel", { fallback: "Codice SDI" })}
                </label>
                <Input
                    id="sdiCode"
                    type="text"
                    value={sdiCode}
                    onChange={(e) => setSdiCode(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="iban" className="text-sm font-medium leading-none">
                    {t("ibanLabel", { fallback: "IBAN" })}
                </label>
                <Input
                    id="iban"
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="address" className="text-sm font-medium leading-none">
                    {t("addressLabel", { fallback: "Indirizzo Sede Legale" })}
                </label>
                <InputPlace
                    id="address"
                    value={fullAddress}
                    onChangeText={setFullAddress}
                    onPlaceSelect={(place) => {
                        setFullAddress(place.fullAddress);
                        setAddressDetails(place);
                    }}
                    required
                    disabled={isLoading}
                />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={isLoading || !fullAddress}>
                {isLoading ? "..." : t("submitButton", { fallback: "Completa Profilo" })}
            </Button>
        </form>
    );
}
