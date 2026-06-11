import { NextResponse } from "next/server";
import { safeApiError, validateApiSettings } from "@/lib/api-route-utils";
import { callLLM } from "@/lib/llm-client";
import type { ApiKeySettings } from "@/types/prompt-generator";

export async function POST(request: Request) {
  try {
    const settings = await request.json() as ApiKeySettings;
    validateApiSettings(settings);
    await callLLM({
      ...settings,
      systemPrompt: "You are a connection test. Follow the user instruction exactly.",
      userPrompt: "Reply with only: OK",
      temperature: 0,
      responseFormat: "text",
      timeoutMs: 30000,
      maxOutputTokens: 512
    });
    return NextResponse.json({
      success: true,
      message: "連線成功，可以開始建立 Prompt。",
      provider: settings.provider,
      modelName: settings.modelName
    });
  } catch (error) {
    return safeApiError(error);
  }
}
