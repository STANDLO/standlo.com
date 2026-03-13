"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/routing";

export function HomeOverlay({ active = true }: { active?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const isCanvasRoute = pathname?.includes("/canvas");

  if (!active || isCanvasRoute) return null;

  const handleClose = () => {
    document.cookie = `ui_mode=canvas; path=/; max-age=31536000`;
    router.push('/canvas');
  };

  return (
    <div className="ui-home absolute inset-0 z-50 pointer-events-auto bg-transparent flex items-center justify-center animate-in fade-in duration-500">
      
      {/* Dimmed background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none bg-white/70 dark:bg-black/70 backdrop-blur-md" 
      />

      <div className="z-10 bg-background/80 p-8 rounded-2xl shadow-xl border border-border/50 text-center cursor-pointer hover:bg-background transition-colors" onClick={handleClose}>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Home Page</h1>
        <p className="text-muted-foreground">Clicca qui per passare in modalità Canvas (3D)</p>
      </div>
      
    </div>
  );
}

