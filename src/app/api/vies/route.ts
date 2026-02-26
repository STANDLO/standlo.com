import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { countryCode, vatNumber } = body;

        if (!countryCode || !vatNumber) {
            return NextResponse.json({ isValid: false, error: "Missing parameters" }, { status: 400 });
        }

        // UK and US cannot be validated via VIES natively. Return a specific warning flag.
        if (countryCode === "US" || countryCode === "GB" || countryCode === "EN") {
            return NextResponse.json({
                isValid: false,
                isBypassed: true,
                message: "Extra-EU Country. VIES validation bypassed."
            }, { status: 200 }); // We return 200 so the UI can interpret the bypass state gracefully
        }

        // EU API POST to VIES REST API
        const response = await fetch("https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                countryCode: countryCode.toUpperCase(),
                vatNumber: vatNumber.replace(/\s+/g, '') // Sanitize spaces
            })
        });

        if (!response.ok) {
            return NextResponse.json({ isValid: false, error: "VIES service unavailable" }, { status: response.status });
        }

        const data = await response.json();

        return NextResponse.json({
            isValid: data.valid || false,
            name: data.name || "",
            address: data.address || "",
            isBypassed: false
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        return NextResponse.json({ isValid: false, error: e.message || "Unknown proxy error" }, { status: 500 });
    }
}
