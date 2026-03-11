"use client";

import { X, Move } from "lucide-react";
import { usePathname } from "next/navigation";
import { Card, CardColor } from "@/components/ui/Card";

// --- Subcomponents ---

function PitchCard({ variant, title, onClick }: { variant: string, title: string, onClick: () => void }) {
  const colorMap: Record<string, CardColor> = {
    customer: "green",
    pipelines: "orange",
    team: "blue",
    professional: "fucsia",
    "design-tech": "yellow",
    investor: "violet",
    educational: "red",
    business: "dark",
    design: "light",
  };
  const color = colorMap[variant] || "default";

  return (
    <Card 
      color={color}
      layout="full"
      onClick={onClick}
      className={`ui-pitch-card ui-pitch-card-${variant}`}
      icon={false}
    >
      <div className="ui-pitch-card-header" />
      <div className="ui-pitch-card-content">
        <span className="ui-pitch-card-title-text">{title}</span>
      </div>
    </Card>
  );
}

function PitchSync({ orientation }: { orientation: "horizontal" | "vertical" }) {
  if (orientation === "horizontal") {
    return (
      <div className="w-full h-full flex items-center justify-center pointer-events-none">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground/30">
          <path d="M38 18H10M38 18L32 12M38 18L32 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 30H38M10 30L16 24M10 30L16 36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }
  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground/30">
        <path d="M18 10V38M18 10L12 16M18 10L24 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M30 38V10M30 38L24 32M30 38L36 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function PitchSyncGrid() {
  return (
    <div className="w-full h-full flex items-center justify-center pointer-events-none">
      <Move className="w-12 h-12 text-muted-foreground/30 rotate-45" strokeWidth={1.5} />
    </div>
  );
}

// --- Collections ---

const cards = [
  { variant: "customer", title: "CUSTOMER", colClass: "col-start-1", rowClass: "row-start-1", delay: 0 },
  { variant: "pipelines", title: "PIPELINES", colClass: "col-start-4", rowClass: "row-start-1", delay: 0.1 },
  { variant: "team", title: "TEAM", colClass: "col-start-7", rowClass: "row-start-1", delay: 0.2 },
  
  { variant: "professional", title: "PROFESSIONAL", colClass: "col-start-1", rowClass: "row-start-4", delay: 0.3 },
  { variant: "design-tech", title: "DESIGN TECH", colClass: "col-start-4", rowClass: "row-start-4", delay: 0.4 },
  { variant: "investor", title: "INVESTOR", colClass: "col-start-7", rowClass: "row-start-4", delay: 0.5 },
  
  { variant: "educational", title: "EDUCATIONAL", colClass: "col-start-1", rowClass: "row-start-7", delay: 0.6 },
  { variant: "business", title: "BUSINESS", colClass: "col-start-4", rowClass: "row-start-7", delay: 0.7 },
  { variant: "design", title: "DESIGN", colClass: "col-start-7", rowClass: "row-start-7", delay: 0.8 },
];

const syncsHorizontal = [
  { colClass: "col-start-3", rowClass: "row-start-1" },
  { colClass: "col-start-6", rowClass: "row-start-1" },
  { colClass: "col-start-3", rowClass: "row-start-4" },
  { colClass: "col-start-6", rowClass: "row-start-4" },
  { colClass: "col-start-3", rowClass: "row-start-7" },
  { colClass: "col-start-6", rowClass: "row-start-7" },
];

const syncsVertical = [
  { colClass: "col-start-1", rowClass: "row-start-3" },
  { colClass: "col-start-4", rowClass: "row-start-3" },
  { colClass: "col-start-7", rowClass: "row-start-3" },
  { colClass: "col-start-1", rowClass: "row-start-6" },
  { colClass: "col-start-4", rowClass: "row-start-6" },
  { colClass: "col-start-7", rowClass: "row-start-6" },
];

const syncsGrid = [
  { colClass: "col-start-3", rowClass: "row-start-3" },
  { colClass: "col-start-6", rowClass: "row-start-3" },
  { colClass: "col-start-3", rowClass: "row-start-6" },
  { colClass: "col-start-6", rowClass: "row-start-6" },
];

export function PitchOverlay({ active = true }: { active?: boolean }) {
  const pathname = usePathname();
  const isCanvasRoute = pathname?.includes("/canvas");

  if (!active || isCanvasRoute) return null;

  const handleClose = () => {
    document.cookie = `ui_mode=canvas; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <div className="ui-pitch absolute inset-0 z-50 pointer-events-auto bg-transparent animate-in fade-in duration-500">
      
      {/* Glassmorphic Grid Cells */}
      {Array.from({ length: 64 }).map((_, i) => {
        const row = Math.floor(i / 8);
        const col = i % 8;
        return (
          <div 
            key={i} 
            className="w-full h-full pointer-events-none bg-white/70 dark:bg-black/70 backdrop-blur-md" 
            style={{ gridColumn: col + 1, gridRow: row + 1 }}
          />
        );
      })}

      <div 
        className="ui-pitch-exit absolute pl-6 pr-6 pt-6 top-0 right-0 cursor-pointer text-muted-foreground hover:text-slate-400 transition-colors z-[60] bg-black/20 rounded-bl-3xl" 
        onClick={handleClose} 
        aria-label="Avvia 3D Canvas"
        title="Avvia 3D Canvas"
      >
        <X className="w-8 h-8" />
      </div>

      {cards.map((card) => (
        <div 
          key={card.title}
          className={`ui-pitch-cell ${card.colClass} ${card.rowClass} col-span-2 row-span-2 z-10`}
        >
          <div 
            className="animate-fade-slide-up w-full h-full" 
            style={{ animationDelay: `${card.delay}s` }}
          >
            <PitchCard 
              variant={card.variant} 
              title={card.title} 
              onClick={handleClose}
            />
          </div>
        </div>
      ))}

      {syncsHorizontal.map((sync, i) => (
        <div key={`sh-${i}`} className={`${sync.colClass} ${sync.rowClass} col-span-1 row-span-2 z-0 flex items-center justify-center`}>
          <PitchSync orientation="horizontal" />
        </div>
      ))}

      {syncsVertical.map((sync, i) => (
        <div key={`sv-${i}`} className={`${sync.colClass} ${sync.rowClass} col-span-2 row-span-1 z-0 flex items-center justify-center`}>
          <PitchSync orientation="vertical" />
        </div>
      ))}

      {syncsGrid.map((sync, i) => (
        <div key={`sg-${i}`} className={`${sync.colClass} ${sync.rowClass} col-span-1 row-span-1 z-0 flex items-center justify-center`}>
          <PitchSyncGrid />
        </div>
      ))}

    </div>
  );
}
