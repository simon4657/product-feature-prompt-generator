import { NextResponse } from "next/server";
import { safeApiError, validateApiSettings } from "@/lib/api-route-utils";
import { callLLM } from "@/lib/llm-client";
import { enforcePlanningLayout } from "@/lib/layout-presets";
import { normalizePlanningDraft } from "@/lib/normalize-planning";
import { parseLLMJson } from "@/lib/parse-llm";
import { buildPlanningRepairPrompt, buildPlanningUserPrompt, PLANNING_SYSTEM_PROMPT } from "@/lib/prompts";
import type { ApiKeySettings, PlanningDraft, ProductInput } from "@/types/prompt-generator";

function hasRequestedCardCount(planning: PlanningDraft, count: number) {
  return Array.isArray(planning?.cards) && planning.cards.length === count;
}

function normalizeCardIndexes(planning: PlanningDraft): PlanningDraft {
  return {
    ...planning,
    cards: planning.cards.map((card, index) => ({ ...card, cardIndex: index + 1 }))
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { apiSettings: ApiKeySettings; productInput: ProductInput };
    validateApiSettings(body.apiSettings);
    const llmRequest = {
      ...body.apiSettings,
      systemPrompt: PLANNING_SYSTEM_PROMPT,
      userPrompt: buildPlanningUserPrompt(body.productInput),
      temperature: 0.45,
      responseFormat: "json" as const,
      timeoutMs: 180000,
      maxOutputTokens: 8000
    };
    const response = await callLLM(llmRequest);
    let planning = parseLLMJson<PlanningDraft>(response.content);

    if (!hasRequestedCardCount(planning, body.productInput.outputCount)) {
      const repairedResponse = await callLLM({
        ...llmRequest,
        userPrompt: buildPlanningRepairPrompt(body.productInput, planning),
        temperature: 0.2
      });
      planning = parseLLMJson<PlanningDraft>(repairedResponse.content);
    }

    if (!hasRequestedCardCount(planning, body.productInput.outputCount)) {
      throw new Error(`模型未能產生指定的 ${body.productInput.outputCount} 張企劃，請再試一次或更換模型。`);
    }
    const normalized = normalizeCardIndexes(normalizePlanningDraft(planning, body.productInput));
    return NextResponse.json({
      success: true,
      planning: enforcePlanningLayout(normalized, body.productInput)
    });
  } catch (error) {
    return safeApiError(error);
  }
}
