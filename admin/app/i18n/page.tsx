"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Download, RefreshCw, Languages } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LocaleStats {
    code: string;
    nativeLabel: string;
    flag: string;
    isFound: boolean;
    missingCount: number;
    exportData: string | null;
}

export default function I18nManager() {
    const [stats, setStats] = useState<LocaleStats[]>([]);
    const [baseCount, setBaseCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/i18n/status");
            const data = await res.json();
            if (data.success) {
                setStats(data.analysis);
                setBaseCount(data.baseKeysCount);
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const downloadJson = (code: string, jsonString: string) => {
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `missing_translations_${code}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Languages className="h-8 w-8 text-blue-500" />
                        Translation Manager
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Base Locale: <span className="font-mono text-primary font-medium">en (English)</span> with <strong>{baseCount}</strong> Translation Keys Source of Truth.
                    </p>
                </div>
                <Button onClick={fetchStats} disabled={loading} variant="outline">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </header>

            <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted text-muted-foreground border-b text-sm">
                            <th className="p-4 font-medium">Locale</th>
                            <th className="p-4 font-medium">File Status</th>
                            <th className="p-4 font-medium">Missing Keys</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                    Analyzing locales...
                                </td>
                            </tr>
                        ) : stats.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                    Could not find system locales.
                                </td>
                            </tr>
                        ) : (
                            stats.map((locale) => (
                                <tr key={locale.code} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{locale.flag}</span>
                                            <div>
                                                <p className="font-semibold">{locale.nativeLabel}</p>
                                                <p className="text-xs text-muted-foreground uppercase">{locale.code}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        {locale.code === "en" ? (
                                            <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                Source of Truth
                                            </span>
                                        ) : locale.isFound ? (
                                            <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">
                                                messages/{locale.code}.json Present
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-800">
                                                File Not Found
                                            </span>
                                        )}
                                    </td>

                                    <td className="p-4">
                                        {locale.code === "en" ? (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        ) : locale.missingCount > 0 ? (
                                            <div className="flex items-center text-red-600 gap-1.5 font-medium">
                                                <AlertCircle className="h-4 w-4" />
                                                {locale.missingCount} missing
                                            </div>
                                        ) : locale.isFound ? (
                                            <div className="flex items-center text-green-600 gap-1.5 font-medium">
                                                <CheckCircle className="h-4 w-4" />
                                                Fully Translated
                                            </div>
                                        ) : <span className="text-muted-foreground text-sm">Unknown</span>}
                                    </td>

                                    <td className="p-4 text-right">
                                        {locale.exportData && locale.missingCount > 0 && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => downloadJson(locale.code, locale.exportData!)}
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                            >
                                                <Download className="h-4 w-4 mr-2" /> Download Missing JSON
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
