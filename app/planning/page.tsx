"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Layers3, LoaderCircle, RotateCcw, ShieldAlert } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { FeatureCardEditor } from "@/components/FeatureCardEditor";
import { StepNav } from "@/components/StepNav";
import { loadStored, saveStored } from "@/lib/storage";
import { useApiGuard } from "@/lib/use-api-guard";
import { readApiResponse } from "@/lib/client-api";
import { normalizeFeatureCardDraft, normalizePlanningDraft } from "@/lib/normalize-planning";
import { STORAGE_KEYS, type FeatureCardDraft, type FinalPromptOutput, type PlanningDraft, type ProductInput } from "@/types/prompt-generator";

type LoadingAction = "all" | "card" | "final" | null;

export default function PlanningPage() {
  const router = useRouter();
  const { settings: apiSettings, ready } = useApiGuard();
  const [input, setInput] = useState<ProductInput | null>(null);
  const [planning, setPlanning] = useState<PlanningDraft | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);
  const [error, setError] = useState("");
  const requestInFlight = useRef(false);

  useEffect(() => {
    const storedInput = loadStored<ProductInput>(STORAGE_KEYS.input);
    const storedPlanning = loadStored<PlanningDraft>(STORAGE_KEYS.planning);
    setInput(storedInput);
    setPlanning(storedPlanning ? normalizePlanningDraft(storedPlanning, storedInput || undefined) : null);
  }, []);

  useEffect(() => {
    if (planning) saveStored(STORAGE_KEYS.planning, planning);
  }, [planning]);

  if (!ready) return <main className="site-shell"><AppHeader /><div className="empty-state"><LoaderCircle className="spin" size={28} /><p>正在確認 API 設定...</p></div></main>;

  if (!input || !planning) {
    return <main className="site-shell"><AppHeader /><div className="empty-state"><Layers3 size={34} /><h1>還沒有企劃資料</h1><p>請先填寫產品資訊，再生成企劃草稿。</p><Link href="/create" className="button primary">前往建立</Link></div></main>;
  }

  const activeCard = planning.cards[activeIndex];

  async function regenerateAll() {
    if (!apiSettings || requestInFlight.current) return;
    requestInFlight.current = true;
    setLoadingAction("all");
    setError("");
    try {
      const response = await fetch("/api/generate-planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiSettings, productInput: input })
      });
      const data = await readApiResponse<{ success: boolean; message?: string; planning: PlanningDraft }>(response);
      if (!response.ok || !data.success) throw new Error(data.message || "重新生成企劃失敗。");
      setPlanning(normalizePlanningDraft(data.planning, input || undefined));
      setActiveIndex(0);
    } catch (regenerateError) {
      setError(regenerateError instanceof Error ? regenerateError.message : "重新生成企劃失敗。");
    } finally {
      requestInFlight.current = false;
      setLoadingAction(null);
    }
  }

  async function regenerateCard() {
    if (!apiSettings || requestInFlight.current) return;
    requestInFlight.current = true;
    setLoadingAction("card");
    setError("");
    try {
      const response = await fetch("/api/regenerate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiSettings,
          productInput: input,
          currentPlanningDraft: planning,
          targetCardIndex: activeCard.cardIndex
        })
      });
      const data = await readApiResponse<{ success: boolean; message?: string; card: FeatureCardDraft }>(response);
      if (!response.ok || !data.success) throw new Error(data.message || "重新生成本張失敗。");
      const normalizedCard = normalizeFeatureCardDraft(data.card, activeIndex, input || undefined);
      setPlanning((current) => current
        ? { ...current, cards: current.cards.map((card) => card.cardIndex === activeCard.cardIndex ? normalizedCard : card) }
        : current);
    } catch (cardError) {
      setError(cardError instanceof Error ? cardError.message : "重新生成本張失敗。");
    } finally {
      requestInFlight.current = false;
      setLoadingAction(null);
    }
  }

  async function generateFinal() {
    if (!apiSettings || requestInFlight.current) return;
    requestInFlight.current = true;
    setLoadingAction("final");
    setError("");
    try {
      const response = await fetch("/api/generate-final-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiSettings, productInput: input, editedPlanningDraft: planning })
      });
      const data = await readApiResponse<{ success: boolean; message?: string; output: FinalPromptOutput }>(response);
      if (!response.ok || !data.success) throw new Error(data.message || "Prompt 生成失敗。");
      saveStored(STORAGE_KEYS.output, data.output);
      router.push("/output");
    } catch (finalError) {
      setError(finalError instanceof Error ? finalError.message : "Prompt 生成失敗。");
    } finally {
      requestInFlight.current = false;
      setLoadingAction(null);
    }
  }

  const isBusy = loadingAction !== null;

  return (
    <main className="site-shell">
      <AppHeader />
      <div className="workspace wide">
        <StepNav current={2} />
        <div className="page-intro planning-intro">
          <div><span className="eyebrow">STEP 02 / EDIT THE PLAN</span><h1>讓每張圖，只說一件事。</h1></div>
          <div className="intro-actions">
            <button className="button ghost" onClick={regenerateAll} disabled={isBusy}>
              {loadingAction === "all" ? <LoaderCircle className="spin" size={16} /> : <RotateCcw size={16} />}
              {loadingAction === "all" ? "正在重生企劃" : "重生全部企劃"}
            </button>
            <button className="button primary" onClick={generateFinal} disabled={isBusy}>
              {loadingAction === "final" ? <LoaderCircle className="spin" size={16} /> : null}
              {loadingAction === "final" ? "正在生成 Prompts" : "確認並生成 Prompts"}
              {loadingAction !== "final" ? <ArrowRight size={16} /> : null}
            </button>
          </div>
        </div>
        <div className="planning-layout">
          <aside className="panel planning-sidebar">
            <div className="sidebar-head"><span>功能圖企劃</span><b>{planning.cards.length} 張</b></div>
            <div className="card-tabs">
              {planning.cards.map((card, index) => <button key={card.cardIndex} className={activeIndex === index ? "active" : ""} onClick={() => setActiveIndex(index)}><span>{String(card.cardIndex).padStart(2, "0")}</span><div><b>{card.featureTheme}</b><small>{card.presentationType}</small></div></button>)}
            </div>
            <Link className="sidebar-back" href="/create"><ArrowLeft size={14} /> 返回產品資料</Link>
          </aside>
          <section className="panel editor-panel">
            <FeatureCardEditor
              card={activeCard}
              loading={loadingAction === "card"}
              onChange={(nextCard) => setPlanning({ ...planning, cards: planning.cards.map((card, index) => index === activeIndex ? nextCard : card) })}
              onRegenerate={regenerateCard}
            />
            {error && <div className="error-box">{error}</div>}
          </section>
          <aside className="panel style-panel">
            <span className="preview-label">SERIES RULES</span>
            <div className="style-preview">
              <small>FUNCTION / {String(activeCard.cardIndex).padStart(2, "0")}</small>
              <div className="mini-product"><Layers3 size={34} /></div>
              <h3>{activeCard.headline}</h3>
              <p>{activeCard.subheadline}</p>
            </div>
            <dl className="brief-list">
              <div><dt>視覺風格</dt><dd>{planning.globalStyleRules.visualStyle}</dd></div>
              <div><dt>配色</dt><dd>{planning.globalStyleRules.colorDirection}</dd></div>
              <div><dt>版面</dt><dd>{planning.globalStyleRules.layoutPrinciple}</dd></div>
            </dl>
            <div className="rule-list">{planning.globalStyleRules.consistencyRules.map((rule) => <p key={rule}><i />{rule}</p>)}</div>
            <div className="notice-card warning"><ShieldAlert size={18} /><p><b>內容檢查</b>若機制涉及數據或技術規格，請確認它確實來自產品資料。</p></div>
          </aside>
        </div>
      </div>
    </main>
  );
}
