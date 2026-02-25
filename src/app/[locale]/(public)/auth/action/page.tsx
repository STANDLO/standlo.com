import React, { Suspense } from "react";
import { FormAuthAction } from "@/components/forms/FormAuthAction";

type Props = {
    params: Promise<{
        locale: string;
    }>;
};

export default async function AuthActionPage({ params }: Props) {
    const { locale } = await params;

    return (
        <Suspense fallback={<div className="text-white text-center p-8">Loading action data...</div>}>
            <FormAuthAction locale={locale} />
        </Suspense>
    );
}
