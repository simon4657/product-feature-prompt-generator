"use client";

import { Plus, RotateCcw, Trash2 } from "lucide-react";
import type { FeatureCardDraft, PresentationType } from "@/types/prompt-generator";

type Props = {
  card: FeatureCardDraft;
  onChange: (card: FeatureCardDraft) => void;
  onRegenerate: () => void;
};

const presentationTypes: { value: PresentationType; label: string }[] = [
  { value: "decomposition", label: "拆解圖" },
  { value: "comparison", label: "對比圖" },
  { value: "scenario", label: "情境圖" },
  { value: "infographic", label: "資訊圖" }
];

const visualSymbolPresets = [
  "功能光線",
  "局部放大框",
  "簡潔標註線",
  "透明分層",
  "材質特寫",
  "箭頭流程",
  "數據圖示",
  "盾牌防護",
  "動態軌跡",
  "Before / After 分界"
];

export function FeatureCardEditor({ card, onChange, onRegenerate }: Props) {
  function update<K extends keyof FeatureCardDraft>(key: K, value: FeatureCardDraft[K]) {
    onChange({ ...card, [key]: value });
  }

  function updateList(key: "bulletPoints" | "visualSymbols" | "negativePrompt", index: number, value: string) {
    const next = [...card[key]];
    next[index] = value;
    update(key, next);
  }

  function removeList(key: "bulletPoints" | "visualSymbols" | "negativePrompt", index: number) {
    update(key, card[key].filter((_, itemIndex) => itemIndex !== index));
  }

  function addList(key: "bulletPoints" | "visualSymbols" | "negativePrompt") {
    update(key, [...card[key], ""]);
  }

  function toggleVisualSymbol(symbol: string) {
    if (card.visualSymbols.includes(symbol)) {
      update("visualSymbols", card.visualSymbols.filter((item) => item !== symbol));
      return;
    }
    update("visualSymbols", [...card.visualSymbols.filter(Boolean), symbol]);
  }

  return (
    <div className="card-editor">
      <div className="editor-heading">
        <div><span>PAGE {String(card.cardIndex).padStart(2, "0")}</span><h2>{card.featureTheme || "未命名功能"}</h2><p>{card.pageRole}</p></div>
        <button type="button" className="button ghost" onClick={onRegenerate}><RotateCcw size={15} /> 重新生成本張</button>
      </div>
      <div className="field-grid two">
        <label className="field"><span>功能主題</span><input value={card.featureTheme} onChange={(e) => update("featureTheme", e.target.value)} /></label>
        <label className="field"><span>頁面角色</span><input value={card.pageRole} onChange={(e) => update("pageRole", e.target.value)} /></label>
      </div>
      <label className="field"><span>功能機制</span><textarea value={card.featureMechanism} onChange={(e) => update("featureMechanism", e.target.value)} /></label>
      <label className="field"><span>使用者好處</span><textarea value={card.userBenefit} onChange={(e) => update("userBenefit", e.target.value)} /></label>
      <div className="field-grid two">
        <label className="field"><span>主標</span><input value={card.headline} onChange={(e) => update("headline", e.target.value)} /></label>
        <label className="field"><span>副標</span><input value={card.subheadline} onChange={(e) => update("subheadline", e.target.value)} /></label>
      </div>
      <div className="choice-block">
        <span className="field-caption">呈現方式</span>
        <div className="pill-options">{presentationTypes.map((item) => <button type="button" key={item.value} className={card.presentationType === item.value ? "selected" : ""} onClick={() => update("presentationType", item.value)}>{item.label}</button>)}</div>
      </div>
      <EditableList title="重點條列" items={card.bulletPoints} onChange={(i, value) => updateList("bulletPoints", i, value)} onRemove={(i) => removeList("bulletPoints", i)} onAdd={() => addList("bulletPoints")} />
      <div className="visual-symbol-editor">
        <div className="list-heading"><span>視覺符號</span><button type="button" onClick={() => addList("visualSymbols")}><Plus size={14} /> 自訂新增</button></div>
        <p>點選常用符號快速加入，再於下方自由修改文字。</p>
        <div className="symbol-presets">
          {visualSymbolPresets.map((symbol) => (
            <button type="button" key={symbol} className={card.visualSymbols.includes(symbol) ? "selected" : ""} onClick={() => toggleVisualSymbol(symbol)}>
              <span>{card.visualSymbols.includes(symbol) ? "✓" : "+"}</span>{symbol}
            </button>
          ))}
        </div>
        <div className="list-fields symbol-fields">
          {card.visualSymbols.map((item, index) => (
            <div key={`視覺符號-${index}`}>
              <span>{index + 1}</span>
              <input value={item} onChange={(e) => updateList("visualSymbols", index, e.target.value)} placeholder="輸入自訂視覺符號" />
              <button type="button" onClick={() => removeList("visualSymbols", index)} aria-label="刪除視覺符號"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
      <label className="field"><span>構圖描述</span><textarea value={card.compositionDescription} onChange={(e) => update("compositionDescription", e.target.value)} /></label>
      <div className="field-grid two">
        <label className="field"><span>場景設定</span><textarea value={card.sceneDescription} onChange={(e) => update("sceneDescription", e.target.value)} /></label>
        <label className="field"><span>人物設定</span><textarea value={card.humanDescription} onChange={(e) => update("humanDescription", e.target.value)} /></label>
      </div>
    </div>
  );
}

function EditableList({ title, items, onChange, onRemove, onAdd, compact = false }: { title: string; items: string[]; onChange: (index: number, value: string) => void; onRemove: (index: number) => void; onAdd: () => void; compact?: boolean }) {
  return (
    <div className={`editable-list ${compact ? "compact" : ""}`}>
      <div className="list-heading"><span>{title}</span><button type="button" onClick={onAdd}><Plus size={14} /> 新增</button></div>
      <div className="list-fields">{items.map((item, index) => <div key={`${title}-${index}`}><span>{index + 1}</span><input value={item} onChange={(e) => onChange(index, e.target.value)} /><button type="button" onClick={() => onRemove(index)} aria-label={`刪除${title}`}><Trash2 size={14} /></button></div>)}</div>
    </div>
  );
}
