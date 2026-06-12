"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bookmark, Check, ImagePlus, LoaderCircle, Settings2, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { StepNav } from "@/components/StepNav";
import { loadStored, saveStored } from "@/lib/storage";
import { useApiGuard } from "@/lib/use-api-guard";
import { readApiResponse } from "@/lib/client-api";
import {
  STORAGE_KEYS,
  type AspectRatioPreference,
  type HumanPresence,
  type OutputCount,
  type PlanningDraft,
  type ProductInput
} from "@/types/prompt-generator";

const initialInput: ProductInput = {
  productName: "",
  productType: "",
  appearanceDescription: "",
  realFeatures: "",
  outputCount: 3,
  visualStyle: "高端電商資訊圖",
  colorDirection: "",
  layoutStyle: "單一主體、清楚標註、充足留白",
  humanPresence: "none",
  sceneType: "",
  aspectRatio: "ai_suggest",
  forbiddenClaims: "",
  hasReferenceImage: false,
  additionalNotes: ""
};

const visualStyles = [
  "高端電商資訊圖",
  "科技感功能拆解圖",
  "韓系極簡圖卡",
  "日系雜誌風圖卡",
  "老錢風精品版面",
  "運動機能廣告風",
  "3C 科技產品風",
  "保養品水感清透風",
  "戶外運動情境風",
  "醫材級乾淨資訊圖風格"
];

const humanOptions: { value: HumanPresence; label: string }[] = [
  { value: "none", label: "無人物" },
  { value: "model", label: "有人物" },
  { value: "hand", label: "手部特寫" },
  { value: "foot", label: "腳部特寫" },
  { value: "wearing_demo", label: "模特兒配戴" }
];

const aspectRatioOptions: { value: AspectRatioPreference; label: string; hint: string }[] = [
  { value: "ai_suggest", label: "AI 建議", hint: "依構圖自動選擇" },
  { value: "1:1", label: "1:1", hint: "方形貼文" },
  { value: "4:5", label: "4:5", hint: "社群直式" },
  { value: "9:16", label: "9:16", hint: "限動／短影音" },
  { value: "16:9", label: "16:9", hint: "橫幅／簡報" }
];

const layoutStyleOptions = [
  "單一主體、清楚標註、充足留白",
  "中央商品加周圍功能標註",
  "中央商品＋環形階段比較",
  "商品特寫加局部放大框",
  "結構拆解與分層剖面",
  "技術原理剖面＋側邊效果驗證",
  "單一畫面效果對照",
  "雜誌式主視覺與資訊區",
  "極簡網格資訊圖",
  "情境主圖加側邊重點條列"
];

const sceneTypeOptions = [
  "乾淨商業攝影棚",
  "居家日常使用情境",
  "現代辦公與工作桌",
  "城市通勤情境",
  "戶外運動與步道",
  "自然光生活場景",
  "高端精品展示空間",
  "科技感未來空間",
  "水感清透保養場景"
];

const MEMORY_STORAGE_KEY = "product-prompt-generator-memory-slots";
type MemorySlot = ProductInput | null;
type GeneratingField = "appearance" | "features" | "layout" | "scene" | "forbidden" | "notes";

function normalizeProductInput(saved: ProductInput & { presentationPreference?: unknown }): ProductInput {
  const { presentationPreference: _legacyPresentationPreference, ...input } = saved;
  return { ...initialInput, ...input };
}

export default function CreatePage() {
  const router = useRouter();
  const { settings: apiSettings, ready } = useApiGuard();
  const [form, setForm] = useState<ProductInput>(initialInput);
  const [memorySlots, setMemorySlots] = useState<MemorySlot[]>(Array(5).fill(null));
  const [memoryMessage, setMemoryMessage] = useState("");
  const [generatingField, setGeneratingField] = useState<GeneratingField | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = loadStored<ProductInput & { presentationPreference?: unknown }>(STORAGE_KEYS.input);
    if (saved) setForm(normalizeProductInput(saved));
    const savedSlots = loadStored<Array<(ProductInput & { presentationPreference?: unknown }) | null>>(MEMORY_STORAGE_KEY);
    if (savedSlots) {
      setMemorySlots(Array.from(
        { length: 5 },
        (_, index) => savedSlots[index] ? normalizeProductInput(savedSlots[index]) : null
      ));
    }
  }, []);

  useEffect(() => {
    saveStored(STORAGE_KEYS.input, form);
  }, [form]);

  function update<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function showMemoryMessage(message: string) {
    setMemoryMessage(message);
    window.setTimeout(() => setMemoryMessage(""), 1800);
  }

  function handleMemorySlot(index: number) {
    const saved = memorySlots[index];
    if (saved) {
      setForm(saved);
      showMemoryMessage(`已載入記憶 ${index + 1}`);
      return;
    }

    const nextSlots = [...memorySlots];
    nextSlots[index] = { ...form };
    setMemorySlots(nextSlots);
    saveStored(MEMORY_STORAGE_KEY, nextSlots);
    showMemoryMessage(`已儲存至記憶 ${index + 1}`);
  }

  function clearMemorySlot(index: number) {
    const nextSlots = [...memorySlots];
    nextSlots[index] = null;
    setMemorySlots(nextSlots);
    saveStored(MEMORY_STORAGE_KEY, nextSlots);
    showMemoryMessage(`已清除記憶 ${index + 1}`);
  }

  async function generateField(field: GeneratingField) {
    if (!form.productName.trim() || !form.productType.trim()) {
      setError("請先填寫商品名稱與商品類型，AI 才能產生合適草稿。");
      return;
    }
    if (!apiSettings) return;

    setError("");
    setGeneratingField(field);
    try {
      const response = await fetch("/api/generate-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiSettings, productInput: form, field })
      });
      const data = await readApiResponse<{ success: boolean; message?: string; content: string }>(response);
      if (!response.ok || !data.success) throw new Error(data.message || "AI 生成失敗。");
      const targets: Record<GeneratingField, keyof ProductInput> = {
        appearance: "appearanceDescription",
        features: "realFeatures",
        layout: "layoutStyle",
        scene: "sceneType",
        forbidden: "forbiddenClaims",
        notes: "additionalNotes"
      };
      setForm((current) => ({ ...current, [targets[field]]: data.content }));
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "AI 生成失敗。");
    } finally {
      setGeneratingField(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.productName.trim() || !form.productType.trim() || !form.realFeatures.trim()) {
      setError("請先完成商品名稱、類型與真實功能清單。");
      return;
    }
    if (form.realFeatures.includes("[待確認]")) {
      setError("AI 產生的功能仍含有「待確認」項目，請依商品真實資料核對、修改後再生成企劃。");
      return;
    }
    if (!apiSettings) return;
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/generate-planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiSettings, productInput: form })
      });
      const data = await readApiResponse<{ success: boolean; message?: string; planning: PlanningDraft }>(response);
      if (!response.ok || !data.success) throw new Error(data.message || "企劃生成失敗。");
      saveStored(STORAGE_KEYS.input, form);
      saveStored(STORAGE_KEYS.planning, data.planning);
      window.localStorage.removeItem(STORAGE_KEYS.output);
      router.push("/planning");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "企劃生成失敗。");
      setLoading(false);
    }
  }

  if (!ready) return <main className="site-shell"><AppHeader /><div className="empty-state"><LoaderCircle className="spin" size={28} /><p>正在確認 API 設定...</p></div></main>;

  return (
    <main className="site-shell">
      <AppHeader />
      <div className="workspace">
        <StepNav current={1} />
        <div className="page-intro">
          <div><span className="eyebrow">STEP 01 / PRODUCT FACTS</span><h1>先把事實說清楚。</h1></div>
          <p>AI 只會整理你提供的內容，不會替商品發明功能、認證或數據。</p>
        </div>
        <form className="form-layout" onSubmit={handleSubmit}>
          <section className="panel form-panel">
            <div className="panel-title"><span>01</span><div><h2>商品基本資料</h2><p>建立所有功能圖共同遵循的商品事實。</p></div></div>
            <div className="field-grid two">
              <label className="field"><span>商品名稱 <b>必填</b></span><input value={form.productName} onChange={(e) => update("productName", e.target.value)} placeholder="例：AeroShade 運動眼鏡" /></label>
              <label className="field"><span>商品類型 <b>必填</b></span><input value={form.productType} onChange={(e) => update("productType", e.target.value)} placeholder="例：戶外運動眼鏡" /></label>
            </div>
            <label className={`reference-toggle ${form.hasReferenceImage ? "selected" : ""}`}>
              <input type="checkbox" checked={form.hasReferenceImage} onChange={(e) => update("hasReferenceImage", e.target.checked)} />
              <ImagePlus size={22} /><span><b>我有商品參考圖</b><small>最終 Prompt 會加入嚴格維持參考圖外觀的要求</small></span><i>{form.hasReferenceImage && <Check size={14} />}</i>
            </label>
            <div className="field">
              <div className="field-title-row"><label htmlFor="appearance-description">商品外觀描述 <small>選填</small></label><button type="button" className="ai-field-button" onClick={() => generateField("appearance")} disabled={generatingField !== null}>{generatingField === "appearance" ? <LoaderCircle className="spin" size={13} /> : <Sparkles size={13} />} AI 生成</button></div>
              <textarea id="appearance-description" value={form.appearanceDescription || ""} onChange={(e) => update("appearanceDescription", e.target.value)} placeholder="選填：顏色、材質、輪廓、比例、關鍵零件與不可改變的外觀特徵" />
            </div>
            <div className="field featured">
              <div className="field-title-row"><label htmlFor="real-features">真實功能清單 <b>必填</b></label><button type="button" className="ai-field-button" onClick={() => generateField("features")} disabled={generatingField !== null}>{generatingField === "features" ? <LoaderCircle className="spin" size={13} /> : <Sparkles size={13} />} AI 生成</button></div>
              <textarea id="real-features" value={form.realFeatures} onChange={(e) => update("realFeatures", e.target.value)} placeholder={"每行一項，例如：\n抗 UV\n感光變色鏡片\n防滑可調鼻墊"} />
              <small>AI 只提供候選草稿，請核對並移除「待確認」標示</small>
            </div>

            <div className="section-divider" />
            <div className="panel-title compact"><span>02</span><div><h2>輸出與視覺方向</h2><p>決定系列張數、美術風格與構圖版型。</p></div></div>
            <div className="choice-block">
              <span className="field-caption">輸出張數</span>
              <div className="count-options">
                {([1, 2, 3] as OutputCount[]).map((count) => (
                  <button type="button" className={form.outputCount === count ? "selected" : ""} onClick={() => update("outputCount", count)} key={count}>
                    <b>{count}</b><span>{count === 1 ? "單張聚焦" : count === 2 ? "雙功能組合" : "完整系列"}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="field-grid two">
              <label className="field"><span>美術風格</span><select value={form.visualStyle} onChange={(e) => update("visualStyle", e.target.value)}>{visualStyles.map((style) => <option key={style}>{style}</option>)}</select></label>
              <label className="field"><span>配色方向</span><input value={form.colorDirection} onChange={(e) => update("colorDirection", e.target.value)} placeholder="例：霧黑、螢光黃、冷灰" /></label>
            </div>
            <div className="choice-block">
              <span className="field-caption">是否有人物</span>
              <div className="pill-options">{humanOptions.map((item) => <button type="button" key={item.value} className={form.humanPresence === item.value ? "selected" : ""} onClick={() => update("humanPresence", item.value)}>{item.label}</button>)}</div>
            </div>
            <div className="field-grid two">
              <label className="field">
                <span>圖片比例</span>
                <select value={form.aspectRatio} onChange={(e) => update("aspectRatio", e.target.value as AspectRatioPreference)}>
                  {aspectRatioOptions.map((item) => <option value={item.value} key={item.value}>{item.label}｜{item.hint}</option>)}
                </select>
              </label>
            </div>
            <AiSelectField
              id="layout-style"
              label="構圖版型"
              value={form.layoutStyle || ""}
              options={layoutStyleOptions}
              generating={generatingField === "layout"}
              disabled={generatingField !== null}
              onGenerate={() => generateField("layout")}
              onChange={(value) => update("layoutStyle", value)}
            />
            <AiSelectField
              id="scene-type"
              label="使用場景"
              value={form.sceneType || ""}
              options={sceneTypeOptions}
              generating={generatingField === "scene"}
              disabled={generatingField !== null}
              onGenerate={() => generateField("scene")}
              onChange={(value) => update("sceneType", value)}
            />
            <AiTextField
              id="forbidden-claims"
              label="禁止誇大事項"
              value={form.forbiddenClaims || ""}
              placeholder="例：不可宣稱 100% 防護"
              multiline
              generating={generatingField === "forbidden"}
              disabled={generatingField !== null}
              onGenerate={() => generateField("forbidden")}
              onChange={(value) => update("forbiddenClaims", value)}
            />
            <AiTextField
              id="additional-notes"
              label="補充說明"
              value={form.additionalNotes || ""}
              placeholder="品牌語氣、必須保留的元素或其他要求"
              multiline
              generating={generatingField === "notes"}
              disabled={generatingField !== null}
              onGenerate={() => generateField("notes")}
              onChange={(value) => update("additionalNotes", value)}
            />
            <div className="memory-section">
              <div className="memory-heading">
                <span><Bookmark size={15} /> 快速記憶</span>
                <small>{memoryMessage || "空槽點擊儲存，已有內容點擊載入"}</small>
              </div>
              <div className="memory-grid">
                {memorySlots.map((slot, index) => (
                  <div className={`memory-slot ${slot ? "filled" : ""}`} key={index}>
                    <button type="button" onClick={() => handleMemorySlot(index)}>
                      <span>記憶 {index + 1}</span>
                      <b>{slot?.productName || "儲存目前設定"}</b>
                      <small>{slot?.visualStyle || "尚未使用"}</small>
                    </button>
                    {slot && (
                      <button type="button" className="memory-clear" onClick={() => clearMemorySlot(index)} aria-label={`清除記憶 ${index + 1}`}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {error && <div className="error-box">{error}</div>}
            <div className="form-actions">
              <span><ShieldCheck size={16} /> 內容只儲存在你的瀏覽器</span>
              <div className="form-action-buttons">
                <Link className="button ghost" href="/setup"><Settings2 size={16} /> 返回 API 設定</Link>
                <button className="button primary" type="submit" disabled={loading}>
                  {loading ? <LoaderCircle className="spin" size={18} /> : null}
                  {loading ? "正在整理企劃" : "生成企劃草稿"} <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </section>
          <aside className="panel preview-panel">
            <span className="preview-label">LIVE BRIEF</span>
            <div className="brief-cover">
              <small>{String(form.outputCount).padStart(2, "0")} CARDS / SERIES</small>
              <div className="brief-object"><div><span>{form.productName ? form.productName.slice(0, 2).toUpperCase() : "PF"}</span></div><i /><i /></div>
              <h3>{form.productName || "你的商品名稱"}</h3>
              <p>{form.visualStyle}</p>
            </div>
            <dl className="brief-list">
              <div><dt>產品類型</dt><dd>{form.productType || "尚未填寫"}</dd></div>
              <div><dt>輸出張數</dt><dd>{form.outputCount} 張</dd></div>
              <div><dt>圖片比例</dt><dd>{form.aspectRatio === "ai_suggest" ? "AI 建議" : form.aspectRatio}</dd></div>
              <div><dt>人物</dt><dd>{humanOptions.find((item) => item.value === form.humanPresence)?.label}</dd></div>
              <div><dt>參考圖鎖定</dt><dd>{form.hasReferenceImage ? "開啟" : "未開啟"}</dd></div>
            </dl>
            <div className="notice-card"><ShieldCheck size={18} /><p><b>真實性護欄</b>企劃會保留「需使用者補充」，不會用想像補齊產品能力。</p></div>
          </aside>
        </form>
      </div>
    </main>
  );
}

function AiSelectField({
  id,
  label,
  value,
  options,
  generating,
  disabled,
  onGenerate,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  generating: boolean;
  disabled: boolean;
  onGenerate: () => void;
  onChange: (value: string) => void;
}) {
  const hasCustomValue = Boolean(value) && !options.includes(value);
  return (
    <div className="field">
      <div className="field-title-row">
        <label htmlFor={id}>{label}</label>
        <button type="button" className="ai-field-button" onClick={onGenerate} disabled={disabled}>
          {generating ? <LoaderCircle className="spin" size={13} /> : <Sparkles size={13} />} AI 生成
        </button>
      </div>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="" disabled>請選擇{label}</option>
        {hasCustomValue && <option value={value}>AI 生成內容：{value}</option>}
        {options.map((option) => <option value={option} key={option}>{option}</option>)}
      </select>
    </div>
  );
}

function AiTextField({
  id,
  label,
  value,
  placeholder,
  multiline = false,
  generating,
  disabled,
  onGenerate,
  onChange
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  generating: boolean;
  disabled: boolean;
  onGenerate: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <div className="field-title-row">
        <label htmlFor={id}>{label}</label>
        <button type="button" className="ai-field-button" onClick={onGenerate} disabled={disabled}>
          {generating ? <LoaderCircle className="spin" size={13} /> : <Sparkles size={13} />} AI 生成
        </button>
      </div>
      {multiline
        ? <textarea id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
        : <input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />}
    </div>
  );
}
