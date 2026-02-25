import React from "react";

export const metadata = {
    title: "Privacy Policy | Standlo",
    description: "Privacy policy for Standlo services.",
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-start py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full">
                <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>
                <div className="prose prose-invert max-w-none text-muted-foreground space-y-4">
                    <p>
                        Welcome to the STANDLO Privacy Policy. We are committed to protecting your personal information and your right to privacy.
                    </p>
                    <p>
                        [Insert your complete Privacy Policy text here]
                    </p>
                </div>
            </div>
        </div>
    );
}
