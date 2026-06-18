import type { FeatureCardDraft, GlobalStyleRules, PlanningDraft, PresentationType, ProductInput } from "@/types/prompt-generator";
import { resolveHumanDescription } from "@/lib/layout-presets";

const presentationTypes: PresentationType[] = ["decomposition", "comparison", "scenario", "infographic"];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asTextArray(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => typeof item === "string" ? item.trim() : "")
      .filter(Boolean);
    return items.length ? items : fallback;
  }
  if (typeof value === "string" && value.trim()) {
    const items = value
      .split(/[\n；;、]/)
      .map((item) => item.replace(/^[-*\d.、\s]+/, "").trim())
      .filter(Boolean);
    return items.length ? items : fallback;
  }
  return fallback;
}

function firstRealFeature(input?: ProductInput) {
  return input?.realFeatures
    ?.split("\n")
    .map((item) => item.replace("[待確認]", "").trim())
    .find(Boolean);
}

export function normalizeFeatureCardDraft(value: unknown, index = 0, input?: ProductInput): FeatureCardDraft {
  const card = asRecord(value);
  const featureTheme = asText(card.featureTheme, firstRealFeature(input) || input?.productName || "核心功能");
  const bulletPoints = asTextArray(card.bulletPoints, [
    featureTheme,
    "依真實功能資料呈現",
    "避免誇大未確認效果"
  ]).slice(0, 3);
  const visualSymbols = asTextArray(card.visualSymbols, ["簡潔標註線"]).slice(0, 3);
  const presentationType = asText(card.presentationType);

  return {
    cardIndex: typeof card.cardIndex === "number" ? card.cardIndex : index + 1,
    pageRole: asText(card.pageRole, "功能重點圖"),
    featureTheme,
    featureMechanism: asText(card.featureMechanism, "需使用者補充功能機制。"),
    userBenefit: asText(card.userBenefit, "以保守方式呈現使用者好處。"),
    presentationType: presentationTypes.includes(presentationType as PresentationType)
      ? presentationType as PresentationType
      : "infographic",
    headline: asText(card.headline, featureTheme),
    subheadline: asText(card.subheadline, "以真實資料整理功能重點"),
    bulletPoints,
    visualSymbols,
    compositionDescription: asText(card.compositionDescription, "以單張知識圖卡呈現重點條列與視覺符號。"),
    sceneDescription: asText(card.sceneDescription, input?.sceneType || "乾淨商業攝影棚"),
    humanDescription: input
      ? resolveHumanDescription(input, asText(card.humanDescription))
      : asText(card.humanDescription, "依人物設定呈現"),
    negativePrompt: asTextArray(card.negativePrompt, [])
  };
}

export function normalizeGlobalStyleRules(value: unknown, input?: ProductInput): GlobalStyleRules {
  const rules = asRecord(value);
  return {
    visualStyle: asText(rules.visualStyle, input?.visualStyle || "高端電商資訊圖"),
    colorDirection: asText(rules.colorDirection, input?.colorDirection || "依指定美術風格建立協調配色"),
    layoutPrinciple: asText(rules.layoutPrinciple, input?.layoutStyle || "單一主體、清楚標註、充足留白"),
    consistencyRules: asTextArray(rules.consistencyRules, ["系列視覺一致", "文字短而清楚"])
  };
}

export function normalizePlanningDraft(value: unknown, input?: ProductInput): PlanningDraft {
  const planning = asRecord(value);
  const rawCards = Array.isArray(planning.cards) ? planning.cards : [];
  const fallbackCount = input?.outputCount || 1;
  const cardSources = rawCards.length ? rawCards : Array.from({ length: fallbackCount }, () => ({}));
  const cards = cardSources.map((card, index) => normalizeFeatureCardDraft(card, index, input));

  return {
    productSummary: asText(planning.productSummary, input?.productName || "產品功能摘要"),
    featureCategories: Array.isArray(planning.featureCategories) ? planning.featureCategories as PlanningDraft["featureCategories"] : [],
    globalStyleRules: normalizeGlobalStyleRules(planning.globalStyleRules, input),
    cards,
    globalNegativeRules: asTextArray(planning.globalNegativeRules, [])
  };
}
