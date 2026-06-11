"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ApiKeySetupForm } from "@/components/ApiKeySetupForm";
import { StepNav } from "@/components/StepNav";

export default function SetupPage() {
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setNotice(window.sessionStorage.getItem("prompt-generator-setup-message") || "");
    window.sessionStorage.removeItem("prompt-generator-setup-message");
  }, []);
  return (
    <main className="site-shell">
      <AppHeader />
      <div className="workspace">
        <StepNav current={0} />
        <div className="page-intro">
          <div><span className="eyebrow">STEP 00 / CONNECT YOUR MODEL</span><h1>先連上你的 AI。</h1></div>
          <p>輸入自己的 API Key，選擇 OpenAI、Gemini 或 Kimi，測試成功後再開始建立企劃。</p>
        </div>
        {notice && <div className="setup-notice">{notice}</div>}
        <ApiKeySetupForm />
      </div>
    </main>
  );
}
