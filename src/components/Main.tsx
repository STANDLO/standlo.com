import * as React from "react";

export function Main({ children }: { children: React.ReactNode }) {
  return (
    <div role="main" className="flex-1 flex flex-col w-full h-[calc(100vh-4rem)] bg-background overflow-hidden relative">
      {children}
    </div>
  );
}
