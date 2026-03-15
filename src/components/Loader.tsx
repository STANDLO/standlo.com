"use client";

import React from "react";

interface LoaderProps {
  message?: string;
  subMessage?: string;
  isVisible: boolean;
}

export default function Loader({ 
  message = "Sincronizzazione Design in corso...",
  subMessage = "Caricamento da IndexedDB e idratazione Zustand 3D",
  isVisible
}: LoaderProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-md">
      <div className="bg-content1 p-8 rounded-2xl shadow-2xl flex flex-col items-center border border-default-200 animate-in fade-in zoom-in-95 duration-300 min-w-[320px]">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-xl font-bold text-foreground mb-2 text-center tracking-tight">STANDLO DCODE</div>
        <div className="text-sm font-medium text-default-600 text-center">{message}</div>
        <div className="text-xs text-default-400 mt-2 text-center max-w-xs">{subMessage}</div>
      </div>
    </div>
  );
}
