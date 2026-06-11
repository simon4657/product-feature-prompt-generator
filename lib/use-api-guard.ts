"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadApiSettings } from "@/lib/api-settings";
import type { ApiKeySettings } from "@/types/prompt-generator";

export function useApiGuard() {
  const router = useRouter();
  const [settings, setSettings] = useState<ApiKeySettings | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = loadApiSettings();
    if (!stored || stored.connectionStatus !== "success") {
      window.sessionStorage.setItem("prompt-generator-setup-message", "請先設定並測試大模型 API Key，才能使用 AI 生成功能。");
      router.replace("/setup");
      return;
    }
    setSettings(stored);
    setReady(true);
  }, [router]);

  return { settings, ready };
}
