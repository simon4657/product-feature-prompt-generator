import { NextResponse } from "next/server";
import { safeApiError, validateApiSettings } from "@/lib/api-route-utils";
import { callLLM } from "@/lib/llm-client";
import {
  buildAdditionalNotesRequirement,
  buildCreativeDirection,
  enforceCardLayout
} from "@/lib/layout-presets";
import { normalizeFeatureCardDraft, normalizePlanningDraft } from "@/lib/normalize-planning";
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
    const currentPlanningDraft = normalizePlanningDraft(body.currentPlanningDraft, body.productInput);
    const target = currentPlanningDraft.cards.find((card) => card.cardIndex === body.targetCardIndex);
    if (!target) throw new Error("找不到要重新生成的圖卡。");
    const response = await callLLM({
      ...body.apiSettings,
      systemPrompt: REGENERATE_CARD_SYSTEM_PROMPT,
      userPrompt: `請只輸出一個符合 FeatureCardDraft 的 JSON 物件。

產品資料：
${JSON.stringify(body.productInput, null, 2)}

強制創意方向（三者必須同時呈現）：
${buildCreativeDirection(body.productInput)}
${body.productInput.additionalNotes?.trim() ? `\n${buildAdditionalNotesRequirement(body.productInput)}` : ""}

全組風格：
${JSON.stringify(currentPlanningDraft.globalStyleRules, null, 2)}

其他圖卡：
${JSON.stringify(currentPlanningDraft.cards.filter((card) => card.cardIndex !== body.targetCardIndex), null, 2)}

本次要完全重新生成第 ${body.targetCardIndex} 張圖卡。
原始第 ${body.targetCardIndex} 張的頁面角色是「${target.pageRole || "功能圖"}」，但這只用來判斷系列位置；不得沿用原本的主標、副標、重點條列、視覺符號、構圖描述、場景描述或任何既有句子。
請直接輸出一份全新的 FeatureCardDraft，前端會用它完整覆蓋原本內容。

compositionDescription 必須執行構圖版型，sceneDescription 必須保留指定場景，整張圖必須呈現指定美術風格。三者不得互相取代。
bulletPoints 必須提供 2 至 3 項非空白短句，visualSymbols 必須提供 1 至 3 項可視覺化符號，並在 compositionDescription 指定它們的畫面位置。
請避免與其他圖卡重複，也避免產出與原本第 ${body.targetCardIndex} 張相同的常見表述。`,
      temperature: 0.9,
      responseFormat: "json"
    });
    const regeneratedCard = normalizeFeatureCardDraft(parseLLMJson<FeatureCardDraft>(response.content), body.targetCardIndex - 1, body.productInput);
    regeneratedCard.cardIndex = body.targetCardIndex;
    const card = enforceCardLayout(regeneratedCard, body.productInput);
    return NextResponse.json({ success: true, card });
  } catch (error) {
    return safeApiError(error);
  }
}
