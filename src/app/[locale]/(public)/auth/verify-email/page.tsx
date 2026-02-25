import React, { Suspense } from "react";
import { FormVerifyEmail } from "@/components/forms/FormVerifyEmail";
import { FormAuthAction } from "@/components/forms/FormAuthAction";

export const metadata = {
    title: "Verify Email | Standlo",
};

type Props = {
    params: Promise<{
        locale: string;
    }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function VerifyEmailPage({ params, searchParams }: Props) {
    const { locale } = await params;
    const resolvedSearchParams = await searchParams;
    const oobCode = resolvedSearchParams.oobCode;

    if (oobCode && typeof oobCode === 'string') {
        return (
            <Suspense fallback={<div className="text-white text-center p-8">Loading action data...</div>}>
                <FormAuthAction locale={locale} />
            </Suspense>
        );
    }

    return <FormVerifyEmail />;
}
