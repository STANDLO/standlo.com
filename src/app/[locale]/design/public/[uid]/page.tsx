"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useDesignStore } from "@/components/layout/design/store";

export default function PublicCanvasPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const uid = params?.uid as string;

  const setTutorialStep = useDesignStore((state) => state.setTutorialStep);
  const setEditPassword = useDesignStore((state) => state.setEditPassword);

  useEffect(() => {
    if (searchParams?.get("tutorial") === "1") {
      setTutorialStep(1);
    }
    const keyParam = searchParams?.get("key");
    const sessionKey = `canvas_key_${uid}`;

    if (keyParam) {
      setEditPassword(keyParam);
      sessionStorage.setItem(sessionKey, keyParam);
      
      // Clean up URL to prevent accidental sharing of the admin link
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("key");
      window.history.replaceState({}, document.title, newUrl.toString());
    } else if (uid) {
      const savedKey = sessionStorage.getItem(sessionKey);
      if (savedKey) {
        setEditPassword(savedKey);
      }
    }
  }, [searchParams, setTutorialStep, setEditPassword, uid]);

  return null;
}
