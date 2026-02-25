"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import Autocomplete from "react-google-autocomplete";
import { MapPin } from "lucide-react";

export interface PlaceResult {
    fullAddress: string;
    address: string;
    city: string;
    province: string;
    zipCode: string;
    country: string;
}

interface InputPlaceProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value?: string;
    onPlaceSelect: (place: PlaceResult) => void;
    onChangeText?: (text: string) => void;
    label?: string;
    error?: string;
    containerClassName?: string;
}

export const InputPlace = React.forwardRef<HTMLInputElement, InputPlaceProps>(
    ({ className, value, onPlaceSelect, onChangeText, disabled, placeholder, label, error, containerClassName, id, ...props }, ref) => {
        const t = useTranslations("Components.InputPlace");

        // Assicurati che NEXT_PUBLIC_GOOGLE_MAPS_API_KEY sia definita in .env.local
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            console.warn("InputPlace: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined. Autocomplete will not work.");
        }

        const inputElement = (
            <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                {/* 
                  Usiamo "react-google-autocomplete" passando l'apiKey per consentire l'auto-caricamento
                  sicuro dello script Google Maps Places.
                */}
                <Autocomplete
                    apiKey={apiKey}
                    ref={ref as unknown as never}
                    onPlaceSelected={(place: google.maps.places.PlaceResult) => {
                        if (!place || !place.address_components) return;

                        let street = "";
                        let route = "";
                        let city = "";
                        let province = "";
                        let zipCode = "";
                        let country = "";

                        for (const component of place.address_components) {
                            const type = component.types[0];
                            if (type === "street_number") street = component.long_name;
                            if (type === "route") route = component.long_name;
                            if (type === "locality") city = component.long_name;
                            if (type === "administrative_area_level_2") province = component.short_name;
                            if (type === "postal_code") zipCode = component.long_name;
                            if (type === "country") country = component.long_name;
                        }

                        const result: PlaceResult = {
                            fullAddress: place.formatted_address || "",
                            address: `${route} ${street}`.trim(),
                            city,
                            province,
                            zipCode,
                            country
                        };

                        onPlaceSelect(result);
                    }}
                    options={{
                        types: ["address"],
                    }}
                    defaultValue={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (onChangeText) onChangeText(e.target.value);
                    }}
                    disabled={disabled}
                    placeholder={placeholder || t("placeholder", { fallback: "Cerca un indirizzo..." })}
                    className={`ui-input pl-10 h-10 ${error ? 'border-destructive focus-visible:ring-destructive' : ''} ${className || ''}`}
                    {...props}
                />
                {error && <span className="text-xs text-destructive font-medium mt-1">{error}</span>}
            </div>
        );

        if (!label) {
            return inputElement;
        }

        return (
            <div className={`ui-input-wrapper ${containerClassName || ''}`}>
                <label className="ui-input-label" htmlFor={id}>
                    {label}
                </label>
                {inputElement}
            </div>
        );
    }
);
InputPlace.displayName = "InputPlace";
