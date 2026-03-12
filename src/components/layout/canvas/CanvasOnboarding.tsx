"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { callGateway } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Loader2, Lock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function CanvasOnboarding() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const tBrand = useTranslations("Brand");

  const handleStart = async () => {
    setLoading(true);
    try {
      const autoPassword = Math.random().toString(36).slice(2, 8).toUpperCase();
      const data = await callGateway<Record<string, unknown>>("canvas", {
        actionId: "createCanvasSandbox",
        payload: {
          canvasType: "canvas",
          editPassword: autoPassword
        }
      });
      if (data?.canvasId) {
        const locale = window.location.pathname.split("/")[1] || "it";
        router.push(`/${locale}/canvas/public/${data.canvasId}?key=${autoPassword}`);
      }
    } catch (err: unknown) {
      console.error("Failed to start canvas sandbox", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-50 flex flex-col items-center justify-center w-full min-h-[100dvh] bg-background text-foreground pointer-events-auto" style={{ animation: "fadeIn 0.5s ease-in-out" }}>
      <div className="flex flex-col items-center justify-center w-full flex-1 max-w-2xl mx-auto p-8 gap-8">
        <div className="text-center space-y-4">
          <div className="flex w-full items-center justify-center mb-6 text-primary">
            <Logo size="xxl" className="!w-auto !h-auto" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight pt-8">The Global Factory</h1>
          <p className="text-lg text-muted-foreground">
            Sperimenta il <strong>Temporary Information Modeling</strong> in prima persona.<br />
            Crea il tuo stand 3D in pochi secondi, senza registrazione.
          </p>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-4 p-6 bg-card border rounded-2xl shadow-sm">
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium text-green-600 dark:text-green-500 flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" /> Spazio di Lavoro Privato
            </p>
            <p className="text-xs text-muted-foreground">
              Inizierai come Editor. Le modifiche verranno salvate automaticamente in un ambiente Sandbox sicuro e condivisibile.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              variant="green"
              onClick={handleStart}
              disabled={loading}
              className="w-full h-12 text-lg mt-2"
            >
              {loading && <Loader2 className="w-5 h-5 mr-3 animate-spin" />}
              {loading ? "Avvio in corso..." : "Inizia a Progettare"}
            </Button>
            <p className="text-center text-[12px] mt-2">
              {tBrand("copyright", { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
