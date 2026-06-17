import { NextResponse } from "next/server";
import { safeApiError, validateApiSettings } from "@/lib/api-route-utils";
import { callLLM } from "@/lib/llm-client";
import type { ApiKeySettings, ProductInput } from "@/types/prompt-generator";

type FieldName = "appearance" | "features" | "layout" | "scene" | "forbidden" | "notes";

function fieldInstruction(field: FieldName, input: ProductInput) {
  const featureName = input.productName.trim() || "未命名功能";
  const baseContext = `目前功能名稱：「${featureName}」。商品類型：「${input.productType.trim() || "未填寫"}」。生成內容必須直接對應此功能名稱，不可只依商品類型產生通用文字。`;
  const instructions: Record<FieldName, string> = {
    appearance: "產出一段可編輯的商品外觀描述，涵蓋顏色、材質、輪廓、比例、關鍵零件與不可變動特徵。資訊不足處明確寫「需確認」，不得自行斷言。",
    features: `針對功能名稱「${featureName}」列出 3 至 5 項可能的真實功能候選，每行一項且以「[待確認]」開頭。每項都必須能看出與「${featureName}」的關聯，不可只輸出商品類型的泛用功能。不得把候選寫成已證實事實，不得加入認證、數據或療效。`,
    layout: "產出一段商業功能圖版面建議，說明商品比例、文字區、留白、視線動線與所選圖片比例。禁止九宮格、拼貼和分割畫面。",
    scene: "產出一段符合商品類型、人物設定與功能呈現方式的使用場景。商品必須清楚，不加入未提供配件。",
    forbidden: "產出一段保守的禁止誇大規則，涵蓋未提供認證、專利、數據、醫療效果、100% 或保證性用語。只輸出限制，不要解釋。",
    notes: `只列出 1 至 3 條真正必要、且其他欄位尚未涵蓋的補充要求。每條不超過 20 個中文字，以分號分隔，總長不超過 60 個中文字。內容必須直接服務於功能名稱「${featureName}」的呈現，優先保留此功能的品牌語氣、不可改動元素或特殊呈現需求；不要重複系統已有的繁體中文、系列一致、單張畫面、禁止拼貼、九宮格或分割畫面規則。不要加標題或解釋。`
  };
  return `${baseContext}\n${instructions[field]}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { apiSettings: ApiKeySettings; productInput: ProductInput; field: FieldName };
    validateApiSettings(body.apiSettings);
    if (!["appearance", "features", "layout", "scene", "forbidden", "notes"].includes(body.field)) {
      throw new Error("不支援的 AI 生成欄位。");
    }
    const response = await callLLM({
      ...body.apiSettings,
      systemPrompt: "你是產品資訊整理與電商視覺企劃助理。不得編造產品事實，請使用繁體中文，只輸出可直接填入欄位的內容。",
      userPrompt: `${fieldInstruction(body.field, body.productInput)}\n\n產品資料：\n${JSON.stringify(body.productInput, null, 2)}`,
      temperature: 0.65
    });
    return NextResponse.json({ success: true, content: response.content.trim() });
  } catch (error) {
    return safeApiError(error);
  }
}
