"use client";

import * as React from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { Grid } from "lucide-react";
import { Apps } from "@schemas/app";
import { useIdbState } from "@/hooks/useIdbState";
import { useRouter, useParams } from "next/navigation";

export function AppSwitch({ currentAppId = "das" }: { currentAppId?: string }) {
  const [appId, setAppId, isReady] = useIdbState<string>("STANDLO.system.app", currentAppId);
  const router = useRouter();
  const params = useParams();

  if (!isReady) {
    return (
      <Button variant="bordered" size="md" isDisabled className="w-32 flex justify-center items-center">
        <div className="w-4 h-4 border-2 border-default-400 border-t-transparent rounded-full animate-spin" />
      </Button>
    );
  }

  // TODO: Replace with global authentication context
  const isGuest = true;

  const visibleApps = Apps.filter(app => {
    if (app.nav === false) return false;
    if (isGuest && !app.public) return false;
    return true;
  }).sort((a, b) => (a.order || 10) - (b.order || 10));

  const activeApp = Apps.find((a) => a.id === appId) || Apps.find((a) => a.id === "das") || Apps[0];

  const handleAction = (key: React.Key) => {
    const selectedId = key as string;
    const selectedApp = Apps.find((a) => a.id === selectedId);

    setAppId(selectedId);

    if (selectedApp) {
      const newPath = `/${(params.locale as string) || "en"}/${selectedApp.id}`;
      router.push(newPath);
    }
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <div className="flex items-center gap-2 px-4 h-10 border-medium border-default-200 hover:bg-default-100 text-sm font-medium rounded-medium transition-colors cursor-pointer">
          <Grid size={18} />
          {activeApp.name}
        </div>
      </DropdownTrigger>

      <DropdownMenu
        aria-label="Application Module Selection"
        selectedKeys={new Set([activeApp.id as string])}
        selectionMode="single"
        onAction={handleAction}
        items={visibleApps}
        className="min-w-[200px]"
      >
        {(app) => (
          <DropdownItem key={app.id!} textValue={app.name}>
            <div className="flex items-center gap-3">
              {app.iconNode}
              <div className="flex flex-col">
                <span className="text-sm font-medium">{app.name}</span>
                <span className="text-xs text-default-500">Switch to {app.name} workspace</span>
              </div>
            </div>
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
