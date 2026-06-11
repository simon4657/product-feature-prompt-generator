"use client";

import { STORAGE_KEYS, type ApiKeySettings } from "@/types/prompt-generator";

export const defaultApiSettings: ApiKeySettings = {
  provider: "openai",
  apiKey: "",
  modelName: "gpt-5-mini",
  savePreference: "session",
  connectionStatus: "idle"
};

function parseSettings(value: string | null): ApiKeySettings | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<ApiKeySettings>;
    if (!parsed.provider || !parsed.apiKey || !parsed.modelName) return null;
    return {
      ...defaultApiSettings,
      ...parsed,
      connectionStatus: parsed.connectionStatus === "success" ? "success" : "idle"
    };
  } catch {
    return null;
  }
}

export function loadApiSettings(): ApiKeySettings | null {
  if (typeof window === "undefined") return null;
  return parseSettings(window.sessionStorage.getItem(STORAGE_KEYS.apiSettings))
    || parseSettings(window.localStorage.getItem(STORAGE_KEYS.apiSettings));
}

export function saveApiSettings(settings: ApiKeySettings) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEYS.apiSettings);
  window.localStorage.removeItem(STORAGE_KEYS.apiSettings);

  if (settings.savePreference === "session" || settings.savePreference === "none") {
    window.sessionStorage.setItem(STORAGE_KEYS.apiSettings, JSON.stringify(settings));
  } else if (settings.savePreference === "local") {
    window.localStorage.setItem(STORAGE_KEYS.apiSettings, JSON.stringify(settings));
  }
}

export function clearApiSettings() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEYS.apiSettings);
  window.localStorage.removeItem(STORAGE_KEYS.apiSettings);
}

export function hasConnectedApiSettings() {
  return loadApiSettings()?.connectionStatus === "success";
}
