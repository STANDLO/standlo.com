"use client";

import { Card, CardHeader } from "@heroui/react";
import { AlertCircle, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Guard() {
    const router = useRouter();

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="max-w-md w-full p-4 shadow-lg border border-danger-200">
                <CardHeader className="flex flex-col items-center gap-2 text-danger">
                    <AlertCircle size={48} strokeWidth={1.5} />
                    <h2 className="text-xl font-bold">Access Denied</h2>
                </CardHeader>
                <div className="flex flex-col text-center text-gray-600 gap-6 p-4">
                    <p>You do not have the required structural permissions to access this Action or Module.</p>
                    <button 
                        className="flex items-center justify-center gap-2 bg-danger text-white px-4 py-2 rounded-lg hover:opacity-80 transition-opacity" 
                        onClick={() => router.push("/")}
                    >
                        <Home size={18} />
                        Return to Dashboard
                    </button>
                </div>
            </Card>
        </div>
    );
}
