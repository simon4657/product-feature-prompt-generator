export type OutputCount = 1 | 2 | 3;
export type HumanPresence = "none" | "model" | "hand" | "foot" | "wearing_demo";
export type PresentationType = "decomposition" | "comparison" | "scenario" | "infographic";
export type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";
export type AspectRatioPreference = AspectRatio | "ai_suggest";
export type LLMProvider = "openai" | "gemini" | "kimi";
export type SavePreference = "session" | "local" | "none";
export type ConnectionStatus = "idle" | "testing" | "success" | "error";

export type ApiKeySettings = {
  provider: LLMProvider;
  apiKey: string;
  modelName: string;
  savePreference: SavePreference;
  connectionStatus: ConnectionStatus;
};

export type ProductInput = {
  productName: string;
  productType: string;
  appearanceDescription: string;
  realFeatures: string;
  outputCount: OutputCount;
  visualStyle: string;
  colorDirection?: string;
  layoutStyle?: string;
  humanPresence: HumanPresence;
  sceneType?: string;
  aspectRatio: AspectRatioPreference;
  forbiddenClaims?: string;
  hasReferenceImage: boolean;
  additionalNotes?: string;
};

export type FeatureCategory = {
  categoryName: string;
  features: string[];
  reason: string;
};

export type GlobalStyleRules = {
  visualStyle: string;
  colorDirection: string;
  layoutPrinciple: string;
  consistencyRules: string[];
};

export type FeatureCardDraft = {
  cardIndex: number;
  pageRole: string;
  featureTheme: string;
  featureMechanism: string;
  userBenefit: string;
  presentationType: PresentationType;
  headline: string;
  subheadline: string;
  bulletPoints: string[];
  visualSymbols: string[];
  compositionDescription: string;
  sceneDescription: string;
  humanDescription: string;
  negativePrompt: string[];
};

export type PlanningDraft = {
  productSummary: string;
  featureCategories: FeatureCategory[];
  globalStyleRules: GlobalStyleRules;
  cards: FeatureCardDraft[];
  globalNegativeRules: string[];
};

export type SinglePromptOutput = {
  cardIndex: number;
  title: string;
  imagePrompt: string;
  negativePrompt: string;
  aspectRatio: AspectRatio;
  copyText: string;
};

export type FinalPromptOutput = {
  prompts: SinglePromptOutput[];
};

export const STORAGE_KEYS = {
  apiSettings: "prompt-generator-api-settings",
  input: "product-prompt-generator-input",
  planning: "product-prompt-generator-planning-draft",
  output: "product-prompt-generator-final-output"
} as const;
