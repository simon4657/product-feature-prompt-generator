import type { ProductInput } from "@/types/prompt-generator";

const DEFAULT_LAYOUT = "單一主體、清楚標註、充足留白";

export const LAYOUT_PRESETS: Record<string, string> = {
  "單一主體、清楚標註、充足留白":
    "單一商品作為唯一視覺主體，占畫面約 60%；主標置於上方或左上；2 至 3 條短標註靠近對應部位；四周保留至少 20% 留白。不得改成情境照、滿版文字或多卡片排列。",
  "中央商品加周圍功能標註":
    "商品精準置中並占畫面約 50%；3 至 5 個功能標註沿商品外圍呈放射狀分布，以細標註線連到正確部位；主標在上方，副標在下方。不得把商品移到角落或省略周圍標註。",
  "中央商品＋環形階段比較":
    "主標與功能摘要置於畫面上方；商品置於中央前景並占畫面約 30% 至 40%；商品後方使用半圓形或扇形環帶，依變化順序切分為 3 至 5 個連續階段，每個階段包含清楚的短標題、關鍵數值或狀態、對應情境及簡潔圖示；環帶上方加入箭頭或刻度，明確表示由低至高、由弱至強或時間推進的變化方向；底部可水平並排各階段的商品外觀或效果樣本，並附短標籤。所有內容必須位於同一張完整資訊圖中，不得改成九宮格、獨立卡片、左右 Before/After 拼貼或零散多張圖片。",
  "商品特寫加局部放大框":
    "商品主體占畫面約 65%；只使用 1 個圓形或圓角局部放大框，占畫面約 18% 至 25%，以細線連回商品對應部位；標題與兩項短說明配置於剩餘留白。維持單一完整畫布，不得做成多格拼貼。",
  "結構拆解與分層剖面":
    "商品沿單一軸線進行結構拆解或半透明分層，清楚呈現 3 至 5 個關鍵層次；每層使用短標註線說明，原始完整商品仍需可辨識。不得變成零件散落、九宮格或多張圖片拼貼。",
  "技術原理剖面＋側邊效果驗證":
    "技術名稱與一句功能摘要置於畫面上方；商品或核心元件的半透明剖面、分層結構占中央至左側約 60%，以光束、粒子、流線或方向箭頭清楚呈現作用前、作用中與作用後的物理路徑；可在主視覺附近配置 1 至 2 個簡短功能標示。畫面右側保留約 25% 至 30% 的資訊欄，垂直放置最多 2 個效果驗證框，例如簡化數據圖、色階圖、局部放大或單一前後效果對照；驗證內容只能使用產品資料中已提供的真實資訊。整體維持單張完整技術資訊圖，不得改成零件散落、九宮格、多張圖片拼貼或讓側邊資訊框遮擋核心作用路徑。",
  "單一畫面效果對照":
    "在同一個連續場景中呈現效果變化，以光線、材質或環境狀態形成自然漸變；商品只出現一個完整主體並保持外觀一致；對照文字分置畫面兩側但不使用硬切分隔線。不得生成左右兩張照片、Before/After 拼貼或分割畫面。",
  "雜誌式主視覺與資訊區":
    "採不對稱精品雜誌構圖：商品主視覺占約 65% 至 70%，文字資訊集中在一側約 30% 的留白區；包含醒目主標、短副標及最多 3 項重點。資訊區不得做成獨立卡片或表格，整體維持單一連續畫面。",
  "極簡網格資訊圖":
    "使用 12 欄編輯網格建立清楚對齊，但不是九宮格；商品橫跨主要欄位並占畫面約 50%；主標、數字序號、2 至 3 項短資訊依基線整齊排列。不得出現九個小格、儀表板或大量卡片。",
  "情境主圖加側邊重點條列":
    "使用單一完整使用情境作為約 70% 的主視覺，商品必須清楚可見；同一畫布側邊保留約 30% 乾淨區域，垂直排列主標與 2 至 3 項短條列。不得把文字區做成另一張圖片或分割成兩個畫面。"
};

const LAYOUT_CONTENT_PLACEMENTS: Record<string, string> = {
  "單一主體、清楚標註、充足留白":
    "將重點條列垂直放在商品側邊或下方留白區；每項前方配置對應視覺符號，並以短標註線連到商品部位。",
  "中央商品加周圍功能標註":
    "將重點條列改寫成商品周圍的放射狀短標註；每個視覺符號放在對應標註的起點或端點，不得另外塞入獨立資訊欄。",
  "中央商品＋環形階段比較":
    "將重點條列分配到環形階段的短說明或底部樣本標籤；視覺符號放入相對應的扇形區段，協助辨識各階段。",
  "商品特寫加局部放大框":
    "將重點條列放在放大框旁的留白資訊區；視覺符號作為條列圖示或放大框內的功能提示，避免遮擋商品。",
  "結構拆解與分層剖面":
    "將重點條列對應到各結構層的短標籤；視覺符號放在標註線端點或對應層旁，清楚連結功能與結構。",
  "技術原理剖面＋側邊效果驗證":
    "將重點條列放入右側效果驗證欄，維持 2 至 3 項；視覺符號分別放在作用路徑及驗證框標題旁。",
  "單一畫面效果對照":
    "將重點條列分布於效果變化兩側或底部說明列；視覺符號放在對應狀態旁，協助辨識變化但不可形成分割畫面。",
  "雜誌式主視覺與資訊區":
    "將重點條列置於單側資訊區並保持雜誌式對齊；視覺符號作為精簡條列圖示或小型視覺章，不得破壞精品留白。",
  "極簡網格資訊圖":
    "將每項重點條列配置在清楚對齊的網格資訊列；視覺符號與對應條列成組排列，但不得變成獨立卡片或九宮格。",
  "情境主圖加側邊重點條列":
    "將重點條列垂直放入側邊資訊區；每項前方必須配置一個對應視覺符號，主情境仍需保持完整可辨識。"
};

export function getLayoutStyle(layoutStyle?: string) {
  return layoutStyle && LAYOUT_PRESETS[layoutStyle] ? layoutStyle : DEFAULT_LAYOUT;
}

export function getLayoutInstruction(layoutStyle?: string) {
  return LAYOUT_PRESETS[getLayoutStyle(layoutStyle)];
}

export function buildLayoutRequirement(layoutStyle?: string) {
  const style = getLayoutStyle(layoutStyle);
  return `指定構圖版型「${style}」：${getLayoutInstruction(style)}`;
}

export function buildAdditionalNotesRequirement(input: ProductInput) {
  const notes = input.additionalNotes?.trim();
  if (!notes) return "";
  return `使用者補充說明（全流程必須執行）：${notes}。若與產品事實或禁止誇大規則衝突，以產品事實與禁止誇大規則為準；其餘內容不得省略。`;
}

export function buildVisibleContentRequirement(
  layoutStyle: string | undefined,
  bulletPoints: string[],
  visualSymbols: string[]
) {
  const style = getLayoutStyle(layoutStyle);
  const bullets = bulletPoints.map((item) => item.trim()).filter(Boolean).slice(0, 3);
  const symbols = visualSymbols.map((item) => item.trim()).filter(Boolean).slice(0, 3);
  return [
    `重點條列（必須在畫面中可見）：${bullets.length ? bullets.map((item, index) => `${index + 1}. ${item}`).join("；") : "無已確認條列，不得自行編造"}`,
    `視覺符號（必須轉成可見圖形）：${symbols.length ? symbols.join("、") : "無已選符號，不得自行增加"}`,
    `配置方式：${LAYOUT_CONTENT_PLACEMENTS[style]}`,
    "不得只把上述內容寫在 Prompt 說明中；必須實際安排在圖卡畫面。文字要短而清楚，符號要與對應功能相鄰。"
  ].join("\n");
}

export function buildCreativeDirection(input: ProductInput) {
  const scene = input.sceneType?.trim() || "乾淨商業攝影棚";
  const color = input.colorDirection?.trim() || "依指定美術風格建立協調配色";
  return [
    `構圖版型：${buildLayoutRequirement(input.layoutStyle)}`,
    `美術風格：必須清楚呈現「${input.visualStyle}」的材質、光線、色調、字體氣質與影像質感，不得因版型限制而退化成通用資訊圖。`,
    `使用場景：必須讓「${scene}」成為可辨識的環境、背景或情境元素；若版型以商品或技術結構為主，場景可簡化或景深化，但不可完全消失。`,
    `配色方向：${color}。`,
    "四項指令分工且必須同時成立：構圖只決定元素位置與比例；美術風格決定渲染語言；使用場景決定環境內容；配色決定色彩。不得用其中一項取代另一項。"
  ].filter(Boolean).join("\n");
}

export function enforcePlanningLayout<T extends {
  globalStyleRules: {
    visualStyle: string;
    colorDirection: string;
    layoutPrinciple: string;
    consistencyRules: string[];
  };
  cards: Array<{
    bulletPoints: string[];
    visualSymbols: string[];
    compositionDescription: string;
    sceneDescription: string;
  }>;
}>(planning: T, input: ProductInput): T {
  const layoutRequirement = buildLayoutRequirement(input.layoutStyle);
  const additionalNotesRequirement = buildAdditionalNotesRequirement(input);
  return {
    ...planning,
    globalStyleRules: {
      ...planning.globalStyleRules,
      visualStyle: `指定美術風格「${input.visualStyle}」；必須反映在材質、光線、色調、字體氣質與影像質感。`,
      colorDirection: input.colorDirection?.trim() || planning.globalStyleRules.colorDirection,
      layoutPrinciple: layoutRequirement,
      consistencyRules: additionalNotesRequirement
        ? [
            ...planning.globalStyleRules.consistencyRules.filter((rule) => rule !== additionalNotesRequirement),
            additionalNotesRequirement
          ]
        : planning.globalStyleRules.consistencyRules
    },
    cards: planning.cards.map((card) => enforceCardLayout(card, input))
  };
}

export function enforceCardLayout<T extends {
  bulletPoints: string[];
  visualSymbols: string[];
  compositionDescription: string;
  sceneDescription: string;
}>(
  card: T,
  input: ProductInput
): T {
  const layoutRequirement = buildLayoutRequirement(input.layoutStyle);
  const visibleContentRequirement = buildVisibleContentRequirement(
    input.layoutStyle,
    card.bulletPoints,
    card.visualSymbols
  );
  const additionalNotesRequirement = buildAdditionalNotesRequirement(input);
  const scene = input.sceneType?.trim() || "乾淨商業攝影棚";
  return {
    ...card,
    compositionDescription: `${layoutRequirement}\n${visibleContentRequirement}${additionalNotesRequirement ? `\n${additionalNotesRequirement}` : ""}\n構圖只管理元素位置與比例，不得省略指定美術風格或使用場景。\n本張細節：${card.compositionDescription || "依本張核心功能安排標註與視覺符號。"}`,
    sceneDescription: `指定使用場景「${scene}」必須可辨識；可依構圖簡化或景深化，但不可消失。\n本張場景細節：${card.sceneDescription || "將商品自然整合於指定場景。"}`
  };
}
