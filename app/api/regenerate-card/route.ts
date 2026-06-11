import { NextResponse } from "next/server";
import { safeApiError, validateApiSettings } from "@/lib/api-route-utils";
import { callLLM } from "@/lib/llm-client";
import { parseLLMJson } from "@/lib/parse-llm";
import { REGENERATE_CARD_SYSTEM_PROMPT } from "@/lib/prompts";
import type { ApiKeySettings, FeatureCardDraft, PlanningDraft, ProductInput } from "@/types/prompt-generator";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      apiSettings: ApiKeySettings;
      productInput: ProductInput;
      currentPlanningDraft: PlanningDraft;
      targetCardIndex: number;
    };
    validateApiSettings(body.apiSettings);
    const target = body.currentPlanningDraft.cards.find((card) => card.cardIndex === body.targetCardIndex);
    if (!target) throw new Error("找不到要重新生成的圖卡。");
    const response = await callLLM({
      ...body.apiSettings,
      systemPrompt: REGENERATE_CARD_SYSTEM_PROMPT,
      userPrompt: `請只輸出一個符合 FeatureCardDraft 的 JSON 物件。

產品資料：
${JSON.stringify(body.productInput, null, 2)}

全組風格：
${JSON.stringify(body.currentPlanningDraft.globalStyleRules, null, 2)}

其他圖卡：
${JSON.stringify(body.currentPlanningDraft.cards.filter((card) => card.cardIndex !== body.targetCardIndex), null, 2)}

原始圖卡：
${JSON.stringify(target, null, 2)}`,
      temperature: 0.8,
      responseFormat: "json"
    });
    const card = parseLLMJson<FeatureCardDraft>(response.content);
    card.cardIndex = body.targetCardIndex;
    return NextResponse.json({ success: true, card });
  } catch (error) {
    return safeApiError(error);
  }
}
