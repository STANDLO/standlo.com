import React from "react";

export const metadata = {
    title: "Terms & Conditions | Standlo",
    description: "Terms and conditions for using Standlo.",
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-start py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full">
                <h1 className="text-3xl font-bold text-foreground mb-8">Terms & Conditions</h1>
                <div className="prose prose-invert max-w-none text-muted-foreground space-y-4">
                    <p>
                        Welcome to the STANDLO Terms & Conditions. By accessing our services, you agree to be bound by these terms.
                    </p>
                    <p>
                        [Insert your complete Terms and Conditions text here]
                    </p>
                </div>
            </div>
        </div>
    );
}
