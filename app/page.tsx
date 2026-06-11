import Link from "next/link";
import { ArrowRight, Check, Layers3, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

export default function HomePage() {
  return (
    <main className="site-shell">
      <AppHeader />
      <section className="landing">
        <div className="hero-copy">
          <span className="eyebrow">PRODUCT FEATURE PROMPT GENERATOR</span>
          <h1>把產品賣點，<br />變成看得懂的畫面。</h1>
          <p>從真實功能出發，整理、微調，再輸出可直接交給生圖模型的完整商業 Prompts。</p>
          <div className="hero-actions">
            <Link className="button primary large" href="/setup">
              設定 API Key 並開始 <ArrowRight size={18} />
            </Link>
            <span><Check size={15} /> 無需登入，草稿自動保存在本機</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-card card-back">
            <span>03</span><b>使用情境</b>
          </div>
          <div className="visual-card card-mid">
            <span>02</span><b>功能拆解</b>
          </div>
          <div className="visual-card card-front">
            <small>FEATURE / 01</small>
            <div className="product-orbit">
              <i /><i /><i />
              <div><Layers3 size={42} /></div>
            </div>
            <h3>一個功能，<br />一張好圖。</h3>
            <p>清楚主標 · 商品鎖定 · 商業構圖</p>
          </div>
        </div>
      </section>
      <section className="workflow">
        <div className="section-heading">
          <span>HOW IT WORKS</span>
          <h2>四步完成，從連線到可用 Prompt</h2>
        </div>
        <div className="workflow-grid four">
          <article><b>01</b><ShieldCheck /><h3>連接你的模型</h3><p>選擇 OpenAI、Gemini 或 Kimi，測試自己的 API Key。</p></article>
          <article><b>02</b><Sparkles /><h3>填入產品事實</h3><p>輸入外觀、真實功能、場景與禁止誇大事項。</p></article>
          <article><b>03</b><WandSparkles /><h3>調整功能企劃</h3><p>逐張編輯機制、好處、文案、構圖與視覺符號。</p></article>
          <article><b>04</b><Layers3 /><h3>輸出完整 Prompts</h3><p>一鍵複製單張、全部複製，或匯出 Markdown。</p></article>
        </div>
      </section>
    </main>
  );
}
