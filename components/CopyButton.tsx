"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { copyToClipboard } from "@/lib/copy-to-clipboard";

export function CopyButton({ text, label = "複製" }: { text: string; label?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");
  const manualInput = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status !== "manual") return;
    manualInput.current?.focus();
    manualInput.current?.select();
  }, [status]);

  async function copy() {
    try {
      await copyToClipboard(text);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("manual");
    }
  }

  const icon = status === "copied" ? <Check size={15} /> : <Copy size={15} />;
  const buttonLabel = status === "copied" ? "已複製" : label;

  return <>
    <button className={`button ghost copy-button ${status}`} type="button" onClick={copy}>{icon}{buttonLabel}</button>
    {status === "manual" && (
      <div className="copy-fallback-backdrop" role="presentation" onClick={() => setStatus("idle")}>
        <div className="copy-fallback-dialog" role="dialog" aria-modal="true" aria-label="手動複製 Prompt" onClick={(event) => event.stopPropagation()}>
          <div className="copy-fallback-title"><Copy size={18} /><div><h3>請手動複製</h3><p>此預覽環境封鎖自動剪貼簿，文字已為你全選。</p></div></div>
          <textarea ref={manualInput} readOnly value={text} onFocus={(event) => event.currentTarget.select()} />
          <div className="copy-fallback-actions">
            <button className="button ghost" type="button" onClick={() => { manualInput.current?.focus(); manualInput.current?.select(); }}>全選文字</button>
            <button className="button primary" type="button" onClick={() => setStatus("idle")}><X size={14} /> 關閉</button>
          </div>
        </div>
      </div>
    )}
  </>;
}
