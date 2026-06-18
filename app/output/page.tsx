"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Download, FileText, Ratio } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { CopyButton } from "@/components/CopyButton";
import { StepNav } from "@/components/StepNav";
import { loadStored } from "@/lib/storage";
import { useApiGuard } from "@/lib/use-api-guard";
import { STORAGE_KEYS, type FinalPromptOutput } from "@/types/prompt-generator";

export default function OutputPage() {
  const { ready } = useApiGuard();
  const [output, setOutput] = useState<FinalPromptOutput | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setOutput(loadStored<FinalPromptOutput>(STORAGE_KEYS.output));
  }, []);

  const allText = useMemo(() => output?.prompts.map((prompt) => prompt.copyText).join("\n\n---\n\n") || "", [output]);

  if (!ready) return <main className="site-shell"><AppHeader /><div className="empty-state"><FileText size={28} /><p>正在確認 API 設定...</p></div></main>;

  if (!output) {
    return <main className="site-shell"><AppHeader /><div className="empty-state"><FileText size={34} /><h1>還沒有 Prompt 輸出</h1><p>請先完成企劃確認。</p><Link href="/planning" className="button primary">返回企劃</Link></div></main>;
  }

  const active = output.prompts[activeIndex];

  function downloadMarkdown() {
    const blob = new Blob([`# 產品功能圖 Prompts\n\n${allText}`], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "product-feature-prompts.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="site-shell">
      <AppHeader />
      <div className="workspace wide">
        <StepNav current={3} />
        <div className="success-banner">
          <div><span><CheckCircle2 size={22} /></span><div><h1>Prompts 已完成</h1><p>{output.prompts.length} 張功能圖已整理為可直接複製的格式。</p></div></div>
          <div><CopyButton text={allText} label="複製全部" /><button className="button primary" onClick={downloadMarkdown}><Download size={15} /> 匯出 Markdown</button></div>
        </div>
        <div className="output-layout">
          <aside className="panel prompt-tabs">
            <span className="preview-label">PROMPT LIST</span>
            {output.prompts.map((prompt, index) => <button key={prompt.cardIndex} className={activeIndex === index ? "active" : ""} onClick={() => setActiveIndex(index)}><span>{String(prompt.cardIndex).padStart(2, "0")}</span><div><b>{prompt.title.replace(/^第 \d 張：/, "")}</b><small>{prompt.aspectRatio}</small></div></button>)}
            <Link className="sidebar-back" href="/planning"><ArrowLeft size={14} /> 返回修改企劃</Link>
          </aside>
          <section className="panel prompt-viewer">
            <div className="prompt-head">
              <div><span>IMAGE PROMPT / {String(active.cardIndex).padStart(2, "0")}</span><h2>{active.title}</h2></div>
              <CopyButton text={active.copyText} label="複製本張" />
            </div>
            <div className="prompt-meta"><span><Ratio size={15} /> 建議比例 <b>{active.aspectRatio}</b></span><span><CheckCircle2 size={15} /> 商品外觀鎖定</span><span><CheckCircle2 size={15} /> 禁止拼貼與九宮格</span></div>
            <div className="prompt-section"><h3>Image Prompt</h3><pre>{active.imagePrompt}</pre></div>
            <div className="prompt-section negative"><h3>Negative Prompt</h3><pre>{active.negativePrompt}</pre></div>
          </section>
          <aside className="panel output-guide">
            <span className="preview-label">USE GUIDE</span>
            <div className="guide-number">01</div><h3>貼入生圖模型</h3><p>完整複製 Image Prompt 與 Negative Prompt，避免只取其中一段。</p>
            <div className="guide-number">02</div><h3>加入商品參考圖／墊圖</h3><p>已開啟參考圖鎖定時，請在生圖模型中一併上傳原商品圖，並選擇保留外觀或墊圖模式，才能降低產品變形。</p>
            <div className="guide-number">03</div><h3>人工檢查文字</h3><p>生圖模型仍可能產生文字錯誤，商用前請檢查標題、結構與宣稱。</p>
          </aside>
        </div>
      </div>
    </main>
  );
}
