"use client";

import React from "react";
import { Button } from "@heroui/react";
import Form from "./Form";

interface CardFormProps {
  moduleId: string;
  actionId: string;
  entityId?: string;
  onClose?: () => void;
}

export default function CardForm({ moduleId, actionId, entityId = "new", onClose }: CardFormProps) {
  // A centered, 1-2 column form suitable for overlay injections via & modifier
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-content1 shadow-2xl rounded-2xl border border-default-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-default-100 flex justify-between items-center bg-default-50/50">
          <div className="text-lg font-bold capitalize text-foreground">
            {actionId.replace(/_/g, ' ')} {moduleId}
          </div>
          {onClose && (
            <Button 
              isIconOnly
              variant="ghost"
              onPress={onClose}
              className="text-default-400 hover:text-default-foreground transition rounded-full hover:bg-default-100"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </Button>
          )}
        </div>

        {/* Body (Uses Universal Form inside) */}
        <div className="p-6">
          <Form moduleId={moduleId} actionId={actionId} entityId={entityId} />
        </div>
      </div>
    </div>
  );
}
