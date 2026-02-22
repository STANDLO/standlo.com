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
}

export const InputPlace = React.forwardRef<HTMLInputElement, InputPlaceProps>(
    ({ className, value, onPlaceSelect, onChangeText, disabled, placeholder, ...props }, ref) => {
        const t = useTranslations("Components.InputPlace");

        // Assicurati che NEXT_PUBLIC_GOOGLE_MAPS_API_KEY sia definita in .env.local
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            console.warn("InputPlace: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined. Autocomplete will not work.");
        }

        return (
            <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                {/* 
                  Usiamo "react-google-autocomplete" come wrapper. 
                  Passiamo le classi standard del nostro Input Tailwind.
                */}
                <Autocomplete
                    ref={ref as unknown as never}
                    apiKey={apiKey}
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
                    className={`flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
                    {...props}
                />
            </div>
        );
    }
);
InputPlace.displayName = "InputPlace";
