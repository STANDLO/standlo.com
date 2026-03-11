"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { functions } from "@/core/firebase";
import { httpsCallable } from "firebase/functions";
import { Button } from "@/components/ui/Button";
import { Loader2, Lock, Box } from "lucide-react";

export function CanvasOnboarding() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStart = async () => {
    setLoading(true);
    try {
      const autoPassword = Math.random().toString(36).slice(2, 8).toUpperCase();
      const gatewayFn = httpsCallable(functions, "canvas");
      const response = await gatewayFn({
        actionId: "createCanvasSandbox",
        payload: {
            canvasType: "canvas",
            editPassword: autoPassword
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = response.data as any;
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
          <div className="flex justify-center mb-6 text-primary">
              <Box className="w-16 h-16" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Standlo 3D Canvas</h1>
          <p className="text-lg text-muted-foreground">
            Sperimenta il <strong>Temporary Information Modeling</strong> in prima persona.<br/>
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

          <Button 
              size="lg" 
              variant="green"
              onClick={handleStart} 
              disabled={loading}
              className="w-full h-12 text-md mt-2"
          >
              {loading && <Loader2 className="w-5 h-5 mr-3 animate-spin" />}
              {loading ? "Avvio in corso..." : "Inizia a Progettare"}
          </Button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
