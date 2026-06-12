import { NextResponse } from "next/server";
import { safeApiError, validateApiSettings } from "@/lib/api-route-utils";
import { callLLM } from "@/lib/llm-client";
import { buildCreativeDirection } from "@/lib/layout-presets";
import { parseLLMJson } from "@/lib/parse-llm";
import { buildFinalUserPrompt, FINAL_PROMPT_SYSTEM_PROMPT } from "@/lib/prompts";
import type { ApiKeySettings, AspectRatio, FinalPromptOutput, PlanningDraft, ProductInput } from "@/types/prompt-generator";

type GeneratedPrompt = {
  cardIndex?: number;
  title?: string;
  imagePrompt: string;
  negativePrompt: string;
  aspectRatio?: AspectRatio;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      apiSettings: ApiKeySettings;
      productInput: ProductInput;
      editedPlanningDraft: PlanningDraft;
    };
    validateApiSettings(body.apiSettings);
    const response = await callLLM({
      ...body.apiSettings,
      systemPrompt: FINAL_PROMPT_SYSTEM_PROMPT,
      userPrompt: `${buildFinalUserPrompt(body.productInput, body.editedPlanningDraft)}

只輸出以下 JSON 結構，不要輸出 copyText：
{"prompts":[{"cardIndex":1,"title":"","imagePrompt":"","negativePrompt":"","aspectRatio":"1:1"}]}

aspectRatio 必須遵循產品資料中的比例設定。Image Prompt 請完整但避免重複相同規則。`,
      temperature: 0.55,
      responseFormat: "json",
      timeoutMs: 180000,
      maxOutputTokens: 8000
    });
    const generated = parseLLMJson<{ prompts: GeneratedPrompt[] }>(response.content);
    if (!Array.isArray(generated.prompts) || generated.prompts.length !== body.editedPlanningDraft.cards.length) {
      throw new Error("模型回傳的 Prompt 數量不正確，請重新生成。");
    }
    const output: FinalPromptOutput = { prompts: generated.prompts.map((prompt, index) => {
      const card = body.editedPlanningDraft.cards[index];
      const creativeDirection = buildCreativeDirection(body.productInput);
      const aspectRatio = body.productInput.aspectRatio !== "ai_suggest"
        ? body.productInput.aspectRatio
        : prompt.aspectRatio || "1:1";
      const title = prompt.title || `第 ${card.cardIndex} 張：${card.featureTheme}功能圖`;
      const imagePrompt = `MANDATORY CREATIVE DIRECTION / 強制創意方向：\n${creativeDirection}\n維持單張完整畫面，構圖、美術風格與使用場景缺一不可。\n\n${prompt.imagePrompt}`;
      const copyText = `【${title}】\n\nImage Prompt:\n${imagePrompt}\n\nNegative Prompt:\n${prompt.negativePrompt}\n\n建議比例：\n${aspectRatio}`;
      return { ...prompt, imagePrompt, cardIndex: card.cardIndex, title, aspectRatio, copyText };
    }) };
    return NextResponse.json({ success: true, output });
  } catch (error) {
    return safeApiError(error);
  }
}
