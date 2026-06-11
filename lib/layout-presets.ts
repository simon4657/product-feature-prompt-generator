const DEFAULT_LAYOUT = "單一主體、清楚標註、充足留白";

export const LAYOUT_PRESETS: Record<string, string> = {
  "單一主體、清楚標註、充足留白":
    "單一商品作為唯一視覺主體，占畫面約 60%；主標置於上方或左上；2 至 3 條短標註靠近對應部位；四周保留至少 20% 留白。不得改成情境照、滿版文字或多卡片排列。",
  "中央商品加周圍功能標註":
    "商品精準置中並占畫面約 50%；3 至 5 個功能標註沿商品外圍呈放射狀分布，以細標註線連到正確部位；主標在上方，副標在下方。不得把商品移到角落或省略周圍標註。",
  "商品特寫加局部放大框":
    "商品主體占畫面約 65%；只使用 1 個圓形或圓角局部放大框，占畫面約 18% 至 25%，以細線連回商品對應部位；標題與兩項短說明配置於剩餘留白。維持單一完整畫布，不得做成多格拼貼。",
  "結構拆解與分層剖面":
    "商品沿單一軸線進行結構拆解或半透明分層，清楚呈現 3 至 5 個關鍵層次；每層使用短標註線說明，原始完整商品仍需可辨識。不得變成零件散落、九宮格或多張圖片拼貼。",
  "單一畫面效果對照":
    "在同一個連續場景中呈現效果變化，以光線、材質或環境狀態形成自然漸變；商品只出現一個完整主體並保持外觀一致；對照文字分置畫面兩側但不使用硬切分隔線。不得生成左右兩張照片、Before/After 拼貼或分割畫面。",
  "雜誌式主視覺與資訊區":
    "採不對稱精品雜誌構圖：商品主視覺占約 65% 至 70%，文字資訊集中在一側約 30% 的留白區；包含醒目主標、短副標及最多 3 項重點。資訊區不得做成獨立卡片或表格，整體維持單一連續畫面。",
  "極簡網格資訊圖":
    "使用 12 欄編輯網格建立清楚對齊，但不是九宮格；商品橫跨主要欄位並占畫面約 50%；主標、數字序號、2 至 3 項短資訊依基線整齊排列。不得出現九個小格、儀表板或大量卡片。",
  "情境主圖加側邊重點條列":
    "使用單一完整使用情境作為約 70% 的主視覺，商品必須清楚可見；同一畫布側邊保留約 30% 乾淨區域，垂直排列主標與 2 至 3 項短條列。不得把文字區做成另一張圖片或分割成兩個畫面。"
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

export function enforcePlanningLayout<T extends {
  globalStyleRules: { layoutPrinciple: string };
  cards: Array<{ compositionDescription: string }>;
}>(planning: T, layoutStyle?: string): T {
  const requirement = buildLayoutRequirement(layoutStyle);
  return {
    ...planning,
    globalStyleRules: {
      ...planning.globalStyleRules,
      layoutPrinciple: requirement
    },
    cards: planning.cards.map((card) => enforceCardLayout(card, layoutStyle))
  };
}

export function enforceCardLayout<T extends { compositionDescription: string }>(
  card: T,
  layoutStyle?: string
): T {
  const requirement = buildLayoutRequirement(layoutStyle);
  return {
    ...card,
    compositionDescription: `${requirement}\n本張細節：${card.compositionDescription || "依本張核心功能安排標註與視覺符號。"}`
  };
}
