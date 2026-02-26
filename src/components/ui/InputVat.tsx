"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, TriangleAlert, Loader2 } from "lucide-react";

export const vatSystemLocales = [
    { code: "it", nativeLabel: "Italia", flag: "🇮🇹" },
    { code: "es", nativeLabel: "España", flag: "🇪🇸" },
    { code: "en", nativeLabel: "United Kingdom", flag: "🇬🇧" },
    { code: "us", nativeLabel: "United States of America", flag: "🇺🇸" },
    { code: "de", nativeLabel: "Deutschland", flag: "🇩🇪" },
    { code: "fr", nativeLabel: "France", flag: "🇫🇷" }
];

export interface InputVatProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value?: string; // full value like "IT12345678901" or just "12345678901"
    onChange?: (value: string) => void;
    label?: string;
    roleId?: string; // Passed to know if customer bypass applies
    onViesData?: (data: { name: string, address: string }) => void;
}

export const InputVat = React.forwardRef<HTMLInputElement, InputVatProps>(
    ({ className, label, value = "", onChange, roleId, disabled, required, id, onViesData, ...props }, ref) => {
        const [country, setCountry] = React.useState("it");
        const [vat, setVat] = React.useState("");

        const [isValidating, setIsValidating] = React.useState(false);
        const [validationState, setValidationState] = React.useState<"idle" | "success" | "warning">("idle");
        const [validationMessage, setValidationMessage] = React.useState("");

        // Initialize from value if provided
        React.useEffect(() => {
            if (value && value.length > 2) {
                const prefix = value.substring(0, 2).toLowerCase();
                const matchedLocale = vatSystemLocales.find(l => l.code === prefix);
                if (matchedLocale) {
                    setCountry(prefix);
                    setVat(value.substring(2));
                } else {
                    setVat(value);
                }
            } else {
                setVat(value || "");
            }
            // We only want to run this once on mount or if external value completely changes
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        React.useEffect(() => {
            if (onChange) {
                if (!vat) onChange("");
                else onChange(`${country.toUpperCase()}${vat.toUpperCase()}`);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [country, vat]);

        // Debounced Validation via API
        React.useEffect(() => {
            if (!vat || vat.length < 4) {
                setValidationState("idle");
                return;
            }

            const timeoutId = setTimeout(async () => {
                setIsValidating(true);
                try {
                    const res = await fetch("/api/vies", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ countryCode: country.toUpperCase(), vatNumber: vat })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.isValid) {
                            setValidationState("success");
                            setValidationMessage(data.name ? `Valid: ${data.name}` : "");
                            if (onViesData && (data.name || data.address)) {
                                onViesData({ name: data.name || "", address: data.address || "" });
                            }
                        } else if (data.isBypassed) {
                            // Extra EU
                            if (roleId === "customer") {
                                setValidationState("success"); // Bypass for extra-EU customers
                                setValidationMessage("Bypass for Extra-EU Customer");
                            } else {
                                setValidationState("warning");
                                setValidationMessage("Extra-EU: VIES not supported. You must enable it to act as provider/manager.");
                            }
                        } else {
                            // Invalid in VIES
                            setValidationState("warning");
                            setValidationMessage("VAT not configured in VIES for cross-border operations.");
                        }
                    } else {
                        setValidationState("warning");
                        setValidationMessage("VIES Service unavailable right now. You can proceed.");
                    }
                } catch {
                    setValidationState("warning");
                    setValidationMessage("Network error validating VAT.");
                } finally {
                    setIsValidating(false);
                }
            }, 800); // 800ms debounce

            return () => clearTimeout(timeoutId);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [vat, country, roleId]);


        // Determine variant class
        let variantClass = "ui-input-primary";
        if (validationState === "success") variantClass = "ui-input-success";
        if (validationState === "warning") variantClass = "ui-input-warning";

        return (
            <div className="flex flex-col gap-1 w-full relative">
                {label && (
                    <label htmlFor={id} className="ui-input-label text-foreground">
                        {label}
                    </label>
                )}

                <div className="relative flex">
                    {/* Country Prefix Dropdown */}
                    <select
                        id={`${id || 'vat'}-country`}
                        name={`${id || 'vat'}-country`}
                        aria-label="Country Code"
                        autoComplete="country"
                        className="absolute left-0 top-0 bottom-0 z-10 w-[70px] appearance-none bg-transparent border-none outline-none pl-3 text-sm cursor-pointer"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        disabled={disabled || isValidating}
                    >
                        {vatSystemLocales.map((loc) => (
                            <option key={loc.code} value={loc.code}>
                                {loc.flag} {loc.code.toUpperCase()}
                            </option>
                        ))}
                    </select>

                    {/* VAT Input field */}
                    <input
                        id={id}
                        name={id || "vatNumber"}
                        autoComplete="off"
                        ref={ref}
                        disabled={disabled}
                        required={required}
                        value={vat}
                        onChange={(e) => setVat(e.target.value.replace(/\s+/g, ''))} // Auto strip spaces
                        className={cn(
                            "ui-input",
                            variantClass,
                            "pl-[75px] pr-10 uppercase", // padding left to make space for the absolute select
                            className
                        )}
                        placeholder="01234567890"
                        {...props}
                    />

                    {/* Status Icon */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                        {isValidating ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : validationState === "success" ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : validationState === "warning" ? (
                            <TriangleAlert className="h-5 w-5 text-amber-500" />
                        ) : null}
                    </div>
                </div>

                {validationMessage && validationState !== "idle" && !isValidating && (
                    <p className={cn(
                        "text-xs mt-1",
                        validationState === "success" ? "text-emerald-500" : "text-amber-500"
                    )}>
                        {validationMessage}
                    </p>
                )}
            </div>
        );
    }
);

InputVat.displayName = "InputVat";
