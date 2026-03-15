"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/react";

interface FormProps {
  moduleId: string;
  actionId: string;
  entityId: string;
}

export default function Form({ moduleId, actionId, entityId }: FormProps) {
  const [loading, setLoading] = useState(true);

  // Future logic:
  // 1. Fetch Zod schema based on `moduleId` and `actionId`
  // 2. Fetch existing data if action is update/read from entityId
  // 3. Render precise geometric inputs based on schema fields
  
  useEffect(() => {
    // Simulate loading schema
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [moduleId, actionId]);

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center border-2 border-dashed border-default-200 rounded-xl">
        <div className="text-default-500">Loading Schema: {moduleId}.ts ...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-content1 shadow-sm rounded-xl p-6 border border-default-100">
      <div className="mb-4 pb-4 border-b border-default-100">
        <div className="text-lg font-semibold text-primary">
          Universal Form Engine (V2)
        </div>
        <div className="text-sm text-default-500 mt-1">
          Module: <div className="inline font-mono bg-default-100 px-1 rounded text-default-700">{moduleId}</div> | 
          Action: <div className="inline font-mono bg-default-100 px-1 rounded text-default-700">{actionId}</div> | 
          Entity: <div className="inline font-mono bg-default-100 px-1 rounded text-default-700">{entityId}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-default-50 rounded-lg border border-default-200 text-sm text-default-600">
          <div>
            <div className="font-bold inline">SDUI Area:</div> Here the dynamic form fields will be injected directly from Zod 
            definitions. For a Create action, fields are empty. For Update, they are pre-filled 
            by fetching Entity: {entityId}.
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="bordered">
            Cancel
          </Button>
          <Button color="primary" variant="solid">
            Submit DCODE Request
          </Button>
        </div>
      </div>
    </div>
  );
}
