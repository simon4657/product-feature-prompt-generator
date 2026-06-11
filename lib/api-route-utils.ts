import { NextResponse } from "next/server";
import type { ApiKeySettings } from "@/types/prompt-generator";

export function validateApiSettings(settings?: ApiKeySettings) {
  if (!settings?.apiKey?.trim()) throw new Error("API Key 不可空白。");
  if (!settings.modelName?.trim()) throw new Error("模型名稱不可空白。");
  if (!["openai", "gemini", "kimi"].includes(settings.provider)) throw new Error("不支援的模型服務商。");
}

export function safeApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "模型服務發生未知錯誤。";
  return NextResponse.json({ success: false, message }, { status: 400 });
}
