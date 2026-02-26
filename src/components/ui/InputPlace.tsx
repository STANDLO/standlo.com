"use client";

import * as React from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { Input } from "@/components/ui/Input";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlaceResult {
    fullAddress: string;
    address: string;
    city: string;
    province: string;
    zipCode: string;
    country: string;
}

interface InputPlaceProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    onPlaceSelect: (place: PlaceResult) => void;
    onChangeText?: (text: string) => void;
    label?: string;
    error?: string;
    containerClassName?: string;
    id?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: any; // To support external value binding
}

export const InputPlace = React.forwardRef<HTMLDivElement, InputPlaceProps>(
    ({ onPlaceSelect, className, containerClassName, error, label, id, value, onChangeText, disabled, placeholder, ...props }, ref) => {
        const placesLib = useMapsLibrary("places");

        const [inputValue, setInputValue] = React.useState("");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [predictions, setPredictions] = React.useState<any[]>([]);
        const [isOpen, setIsOpen] = React.useState(false);
        const [isLoading, setIsLoading] = React.useState(false);

        const dropdownRef = React.useRef<HTMLDivElement>(null);

        // Tracking refs to break infinite autocomplete loops
        const lastSelectedValue = React.useRef("");
        const ignoreNextPredictions = React.useRef(false);
        const autoSelectNext = React.useRef(false);

        // Update inputValue when external value changes
        React.useEffect(() => {
            if (value) {
                const targetValue = typeof value === 'string' ? value : value.fullAddress || "";
                if (targetValue !== inputValue) {
                    if (targetValue === lastSelectedValue.current) {
                        // Echo from our own selection. Just update visually, do not fetch predictions.
                        ignoreNextPredictions.current = true;
                        setInputValue(targetValue);
                    } else {
                        // External update (e.g. from VIES). Update visually and queue auto-selection.
                        autoSelectNext.current = true;
                        setInputValue(targetValue);
                    }
                }
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [value]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handleSelect = React.useCallback(async (prediction: any) => {
            // We just selected something. The next inputValue update MUST NOT pop open predictions loop.
            ignoreNextPredictions.current = true;
            setInputValue(prediction.description);
            setIsOpen(false);
            setIsLoading(true);

            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((placesLib as any).Place) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const place = new (placesLib as any).Place({ id: prediction.place_id });
                    await place.fetchFields({ fields: ['addressComponents', 'formattedAddress', 'location'] });

                    let street = "";
                    let route = "";
                    let city = "";
                    let province = "";
                    let zipCode = "";
                    let country = "";

                    if (place.addressComponents) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        for (const component of place.addressComponents as any[]) {
                            const types = component.types;
                            if (types.includes("street_number")) street = component.longText || "";
                            if (types.includes("route")) route = component.longText || "";
                            if (types.includes("locality")) city = component.longText || "";
                            if (types.includes("administrative_area_level_2")) province = component.shortText || "";
                            if (types.includes("postal_code")) zipCode = component.longText || "";
                            if (types.includes("country")) country = component.longText || "";
                        }
                    }

                    const fullAddress = place.formattedAddress || prediction.description;

                    const result: PlaceResult = {
                        fullAddress,
                        address: `${route} ${street}`.trim(),
                        city,
                        province,
                        zipCode,
                        country
                    };

                    lastSelectedValue.current = fullAddress;
                    ignoreNextPredictions.current = true;
                    setInputValue(fullAddress);

                    onPlaceSelect(result); // Pass back the granular details
                }
            } catch (err) {
                console.error("Failed to fetch place details:", err);
            } finally {
                setIsLoading(false);
            }
        }, [placesLib, onPlaceSelect]);

        // Fetch predictions when inputValue changes
        React.useEffect(() => {
            if (!placesLib || !inputValue) {
                setPredictions([]);
                setIsOpen(false);
                return;
            }

            if (ignoreNextPredictions.current) {
                // Skip fetching predictions for systematic programmatic updates
                ignoreNextPredictions.current = false;
                return;
            }

            const timer = setTimeout(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (!(placesLib as any).AutocompleteService) return;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const service = new (placesLib as any).AutocompleteService();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                service.getPlacePredictions({ input: inputValue }, (results: any, status: any) => {
                    if (status === "OK" && results && results.length > 0) {
                        setPredictions(results);

                        // Auto-select the top prediction if this request was triggered by an external autofill (like VIES)
                        if (autoSelectNext.current) {
                            autoSelectNext.current = false;
                            handleSelect(results[0]);
                        } else {
                            setIsOpen(true);
                        }
                    } else {
                        setPredictions([]);
                        setIsOpen(false);
                        autoSelectNext.current = false;
                    }
                });
            }, 300);

            return () => clearTimeout(timer);
        }, [inputValue, placesLib, handleSelect]);

        // Handle Click Outside to close dropdown
        React.useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setInputValue(e.target.value);
            if (onChangeText) onChangeText(e.target.value);
        };

        return (
            <div className={cn("relative w-full", containerClassName)} ref={dropdownRef}>
                <div ref={ref} className="relative w-full">
                    <Input
                        id={id}
                        label={label}
                        error={error}
                        disabled={disabled}
                        placeholder={placeholder || "Cerca un luogo..."}
                        value={inputValue}
                        onChange={handleInputChange}
                        onFocus={() => {
                            if (predictions.length > 0) setIsOpen(true);
                        }}
                        autoComplete="new-password"
                        className={className}
                        {...props}
                    />

                    {/* Status Icon */}
                    <div className="absolute right-3 top-[38px] flex items-center justify-center pointer-events-none z-10">
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        )}
                    </div>
                </div>

                {/* Dropdown */}
                {isOpen && predictions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <ul className="py-1 text-sm text-foreground">
                            {predictions.map((prediction) => (
                                <li
                                    key={prediction.place_id}
                                    onClick={() => handleSelect(prediction)}
                                    className="px-4 py-2 hover:bg-muted cursor-pointer flex flex-col gap-0.5 border-b border-border/50 last:border-none"
                                >
                                    <span className="font-medium text-foreground truncate">
                                        {prediction.structured_formatting?.main_text || prediction.description}
                                    </span>
                                    {prediction.structured_formatting?.secondary_text && (
                                        <span className="text-xs text-muted-foreground truncate">
                                            {prediction.structured_formatting.secondary_text}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    }
);
InputPlace.displayName = "InputPlace";
