import type { PlanningDraft, ProductInput } from "@/types/prompt-generator";
import { buildLayoutRequirement } from "@/lib/layout-presets";

export const PLANNING_SYSTEM_PROMPT = `你是一位產品功能圖企劃師、電商視覺設計師、社群圖卡文案顧問與生圖 Prompt 工程師。

請根據使用者提供的產品資訊，產出一份「產品功能拆解圖 / 效果呈現圖」企劃草稿。

重要規則：
1. 不得自行編造產品功能、認證、專利、檢測數據、醫療效果或保證性效果。
2. 只能根據使用者提供的真實功能進行分類、轉譯與視覺化。
3. 若資訊不足，請標示「需使用者補充」，不要亂補。
4. 商品外觀描述為選填；若未提供，不得自行編造顏色、材質、零件或造型細節。
5. 每張圖只講一個核心功能。
6. 輸出張數必須與使用者要求一致。
7. 多張圖需維持同一系列感。
8. 避免過多小字、重複文字、亂碼、九宮格、拼貼、分割畫面。
9. 僅輸出 JSON，不要 Markdown、程式碼圍欄或解釋文字。`;

export const REGENERATE_CARD_SYSTEM_PROMPT = `只重新生成指定功能圖企劃，不影響其他張圖。不得編造未提供的功能、認證、數據或療效，並維持全組一致視覺風格。`;

export const FINAL_PROMPT_SYSTEM_PROMPT = `你是一位專業生圖 Prompt 工程師。請將已確認企劃轉換為可直接提供給生圖大模型的完整 Prompts。

每張圖必須是獨立單張圖片，只呈現一個核心功能。禁止九宮格、拼貼、分割畫面。商品外觀必須依照使用者描述，有參考圖時需精準維持外觀、比例、材質與關鍵零件。文字需大而清楚，禁止亂碼、小字與重複文字。不得加入未確認的數據、認證、醫療效果或保證性用語。`;

export function buildPlanningUserPrompt(input: ProductInput) {
  return `請產生剛好 ${input.outputCount} 張功能圖企劃。cards 陣列長度必須等於 ${input.outputCount}，cardIndex 必須依序為 ${Array.from({ length: input.outputCount }, (_, index) => index + 1).join("、")}。

使用者提供資訊：
${JSON.stringify(input, null, 2)}

強制構圖規格：
${buildLayoutRequirement(input.layoutStyle)}
上述規格的優先級高於 presentationType 與場景描述。presentationType 只能決定如何解說功能，不得替換指定構圖版型。

headline、subheadline、bulletPoints、featureMechanism 與 userBenefit 只能改寫上述產品資料，不得自行加入專利、認證、數據、療效或保證性說法。

只輸出以下完整 JSON 結構：
{
  "productSummary": "產品摘要",
  "featureCategories": [
    {
      "categoryName": "分類名稱",
      "features": ["只能使用使用者已提供的真實功能"],
      "reason": "分類原因"
    }
  ],
  "globalStyleRules": {
    "visualStyle": "視覺風格",
    "colorDirection": "配色方向",
    "layoutPrinciple": "版面原則",
    "consistencyRules": ["系列一致性規則"]
  },
  "cards": [
    {
      "cardIndex": 1,
      "pageRole": "本張角色",
      "featureTheme": "單一核心功能",
      "featureMechanism": "根據真實資料說明機制，資訊不足則寫需使用者補充",
      "userBenefit": "不誇大的使用者利益",
      "presentationType": "decomposition",
      "headline": "主標題",
      "subheadline": "副標題",
      "bulletPoints": ["重點一", "重點二", "重點三"],
      "visualSymbols": ["視覺符號一", "視覺符號二"],
      "compositionDescription": "構圖描述",
      "sceneDescription": "場景描述",
      "humanDescription": "人物描述，無人物時明確寫無人物",
      "negativePrompt": ["本張禁止事項"]
    }
  ],
  "globalNegativeRules": ["全系列禁止事項"]
}

presentationType 只能是 decomposition、comparison、scenario、infographic 其中之一。
再次確認：cards 必須剛好有 ${input.outputCount} 個物件，不可省略、合併或增加。`;
}

export function buildPlanningRepairPrompt(input: ProductInput, invalidPlanning: unknown) {
  return `上一份企劃的 cards 張數或結構不符合要求。請修正並重新輸出完整 JSON。

必要條件：
- cards 必須剛好有 ${input.outputCount} 張
- cardIndex 必須依序為 ${Array.from({ length: input.outputCount }, (_, index) => index + 1).join("、")}
- 每張只聚焦一個真實功能
- 每張 compositionDescription 必須明確執行：${buildLayoutRequirement(input.layoutStyle)}
- headline、subheadline、bulletPoints、featureMechanism 與 userBenefit 都不得加入產品資料中沒有的「專利、認證、數據、療效、保證」字樣
- 保留完整 PlanningDraft 欄位
- 只能輸出 JSON

產品資料：
${JSON.stringify(input, null, 2)}

上一份不合格回應：
${JSON.stringify(invalidPlanning, null, 2)}`;
}

export function buildFinalUserPrompt(input: ProductInput, planning: PlanningDraft) {
  return `${FINAL_PROMPT_SYSTEM_PROMPT}

產品資訊：
${JSON.stringify(input, null, 2)}

最高優先構圖規格：
${buildLayoutRequirement(input.layoutStyle)}
最終 Image Prompt 必須逐字說清楚商品占比、文字區位置、標註方式與留白配置。不得改用其他版型；presentationType 只能輔助功能表達。

最終確認企劃：
${JSON.stringify(planning, null, 2)}`;
}
