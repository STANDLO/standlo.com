"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { callGateway } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import {
  Loader2,
  Lock,
  Box,
  Boxes,
  Package,
  Move,
  RotateCw,
  PaintBucket,
  Glasses
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useDictionarySync } from "./useDictionarySync";

// The mock tools array matching the translations
const TUTORIAL_TOOLS = [
  { id: "addPart", icon: Box },
  { id: "addAssembly", icon: Boxes },
  { id: "addBundle", icon: Package },
  { id: "move", icon: Move },
  { id: "rotate", icon: RotateCw },
  { id: "material", icon: PaintBucket },
  { id: "arVr", icon: Glasses },
];

export function DesignOnboarding() {
  const { isReady, error } = useDictionarySync();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const tBrand = useTranslations("Brand");
  const t = useTranslations("DesignOnboarding");

  const handleStart = async () => {
    setLoading(true);
    try {
      const autoPassword = Math.random().toString(36).slice(2, 8).toUpperCase();
      const data = await callGateway<Record<string, unknown>>("orchestrator", {
        actionId: "createCanvasSandbox",
        payload: {
          canvasType: "design",
          password: autoPassword
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
    <div className="ui-design-onboarding-overlay">
      <div className="ui-design-onboarding-container">

        <div className="ui-design-onboarding-left-col">
          <div className="ui-design-onboarding-content">
            <div className="ui-design-onboarding-logo">
              <Logo size="xxl" />
            </div>
            <h1 className="ui-design-onboarding-title">{t("title")}</h1>
            <div className="ui-design-onboarding-subtitle-container">
              <p className="ui-design-onboarding-description" dangerouslySetInnerHTML={{ __html: t.raw("description").replace("<bold>", "<strong>").replace("</bold>", "</strong>") }} />
            </div>
          </div>

          <div className="ui-design-onboarding-card">
            <div className="ui-design-onboarding-card-header">
              <p className="ui-design-onboarding-card-badge">
                <Lock className="w-4 h-4" /> {t("workspaceTitle")}
              </p>
              <p className="ui-design-onboarding-card-desc">
                {t("workspaceDesc")}
              </p>
            </div>

            <div className="ui-design-onboarding-card-actions">
              <Button
                size="lg"
                variant="green"
                onClick={handleStart}
                disabled={loading || !isReady}
                className="ui-design-onboarding-start-btn"
              >
                {(loading || !isReady) && <Loader2 className="w-5 h-5 mr-3 animate-spin" />}
                {loading ? t("statusStarting") : (!isReady ? t("statusSyncing") : t("statusReady"))}
              </Button>
              {error && <p className="ui-design-onboarding-error-msg">{t("statusFailed")}</p>}

              <div className="ui-design-onboarding-footer">
                <p className="ui-design-onboarding-copyright">
                  {tBrand("copyright", { year: new Date().getFullYear() })}
                </p>
              </div>
            </div>
          </div>

          <div className="ui-design-onboarding-content">
            <div className="ui-design-onboarding-subtitle-container">
              <div className="ui-design-onboarding-slogan-block">
                <p>{t("subtitle1")}</p>
                <p dangerouslySetInnerHTML={{ __html: t.raw("subtitle2_1") }} />
                <p dangerouslySetInnerHTML={{ __html: t.raw("subtitle2_2") }} />
              </div>
            </div>
          </div>

        </div>
        ƒ
        <div className="ui-design-onboarding-right-col">
          {TUTORIAL_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <div key={tool.id} className="ui-design-onboarding-tool-item">
                <Icon className="ui-design-onboarding-tool-icon" />
                <div className="ui-design-onboarding-tool-info">
                  <h4 className="ui-design-onboarding-tool-title">{t(`tutorialNames.${tool.id}`)}</h4>
                  <p className="ui-design-onboarding-tool-desc">{t(`tutorials.${tool.id}`)}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
