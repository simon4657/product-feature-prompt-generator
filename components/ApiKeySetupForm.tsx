"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, ShieldCheck, XCircle } from "lucide-react";
import { defaultApiSettings, loadApiSettings, saveApiSettings } from "@/lib/api-settings";
import { readApiResponse } from "@/lib/client-api";
import type { ApiKeySettings, LLMProvider, SavePreference } from "@/types/prompt-generator";

const providerOptions: { value: LLMProvider; label: string; detail: string }[] = [
  { value: "openai", label: "OpenAI", detail: "Responses API" },
  { value: "gemini", label: "Google Gemini", detail: "Gemini API" },
  { value: "kimi", label: "Kimi", detail: "Moonshot API" }
];

const modelOptions: Record<LLMProvider, string[]> = {
  openai: ["gpt-5-mini", "gpt-5", "gpt-4.1-mini"],
  gemini: ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.5-pro"],
  kimi: ["kimi-k2.5", "moonshot-v1-32k", "moonshot-v1-128k"]
};

const modelUsageHints: Record<string, string> = {
  "gpt-5-mini": "適合日常企劃與大量生成，速度、成本與品質較均衡。",
  "gpt-5": "適合高品質企劃、複雜商品資訊整理與精細 Prompt 撰寫。",
  "gpt-4.1-mini": "適合快速文案整理、簡單欄位生成與成本敏感任務。",
  "gemini-2.5-flash": "適合快速生成、多輪調整與大量商品企劃。",
  "gemini-2.5-pro": "適合複雜推理、長篇產品資料與高品質企劃。",
  "gemini-3-flash-preview": "適合需要新一代推理能力、快速回應與大規模生成的企劃；目前為預覽版。",
  "kimi-k2.5": "適合完整企劃、中文內容理解與複雜 Prompt 生成。",
  "moonshot-v1-32k": "適合一般長篇企劃、產品資料整理與中等上下文任務。",
  "moonshot-v1-128k": "適合超長產品資料、規格文件與大量上下文整理。"
};

export function ApiKeySetupForm() {
  const router = useRouter();
  const [settings, setSettings] = useState<ApiKeySettings>(defaultApiSettings);
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState("");
  const models = useMemo(() => modelOptions[settings.provider], [settings.provider]);

  useEffect(() => {
    const stored = loadApiSettings();
    if (stored) setSettings(stored);
  }, []);

  function update<K extends keyof ApiKeySettings>(key: K, value: ApiKeySettings[K]) {
    setSettings((current) => ({ ...current, [key]: value, connectionStatus: "idle" }));
    setMessage("");
  }

  function selectProvider(provider: LLMProvider) {
    setSettings((current) => ({
      ...current,
      provider,
      modelName: modelOptions[provider][0],
      connectionStatus: "idle"
    }));
    setMessage("");
  }

  async function testConnection() {
    if (!settings.apiKey.trim() || !settings.modelName.trim()) {
      setMessage("請輸入 API Key 與模型名稱。");
      setSettings((current) => ({ ...current, connectionStatus: "error" }));
      return;
    }
    setSettings((current) => ({ ...current, connectionStatus: "testing" }));
    setMessage("");
    try {
      const response = await fetch("/api/test-llm-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const data = await readApiResponse<{ success: boolean; message: string }>(response);
      if (!response.ok || !data.success) throw new Error(data.message || "連線測試失敗。");
      const connected = { ...settings, connectionStatus: "success" as const };
      setSettings(connected);
      saveApiSettings(connected);
      setMessage(data.message || "連線成功，可以開始建立 Prompt。");
    } catch (error) {
      setSettings((current) => ({ ...current, connectionStatus: "error" }));
      setMessage(error instanceof Error ? error.message : "連線測試失敗。");
    }
  }

  function continueToCreate() {
    if (settings.connectionStatus !== "success") return;
    saveApiSettings(settings);
    router.push("/create");
  }

  return (
    <div className="setup-layout">
      <section className="panel setup-panel">
        <div className="panel-title"><span>00</span><div><h2>選擇模型服務</h2><p>所有 AI 生成將使用你選擇的服務商與模型。</p></div></div>
        <ProviderSelector value={settings.provider} onChange={selectProvider} />
        <ApiKeyInput value={settings.apiKey} show={showKey} onToggle={() => setShowKey((value) => !value)} onChange={(value) => update("apiKey", value)} />
        <ModelNameInput models={models} value={settings.modelName} onChange={(value) => update("modelName", value)} />
        <StoragePreferenceSelector value={settings.savePreference} onChange={(value) => update("savePreference", value)} />
        <div className="setup-actions">
          <ConnectionTestButton status={settings.connectionStatus} onClick={testConnection} />
          <button className="button primary" type="button" disabled={settings.connectionStatus !== "success"} onClick={continueToCreate}>開始填寫產品資料</button>
        </div>
        <ApiStatusBadge status={settings.connectionStatus} message={message} />
      </section>
      <aside className="panel security-panel">
        <span className="preview-label">SECURITY</span>
        <div className="security-icon"><ShieldCheck size={28} /></div>
        <h3>Key 由你掌握</h3>
        <p>API Key 不會寫入程式碼、網址、輸出 Prompt 或公開資料庫。</p>
        <ul>
          <li>預設儲存在本次瀏覽器工作階段</li>
          <li>關閉分頁後 sessionStorage 自動清除</li>
          <li>請勿在共用電腦選擇長期保存</li>
          <li>呼叫模型時只傳送至所選服務商</li>
        </ul>
        <div className="notice-card warning"><KeyRound size={18} /><p><b>額度由服務商計費</b>測試連線及每次 AI 生成都可能使用少量 API 額度。</p></div>
      </aside>
    </div>
  );
}

export function ProviderSelector({ value, onChange }: { value: LLMProvider; onChange: (value: LLMProvider) => void }) {
  return <div className="choice-block"><span className="field-caption">模型服務商</span><div className="provider-grid">{providerOptions.map((item) => <button type="button" key={item.value} className={value === item.value ? "selected" : ""} onClick={() => onChange(item.value)}><b>{item.label}</b><small>{item.detail}</small></button>)}</div></div>;
}

export function ApiKeyInput({ value, show, onToggle, onChange }: { value: string; show: boolean; onToggle: () => void; onChange: (value: string) => void }) {
  return <div className="field"><div className="field-title-row"><label htmlFor="api-key">API Key</label><button type="button" className="key-toggle" onClick={onToggle}>{show ? <EyeOff size={13} /> : <Eye size={13} />}{show ? "隱藏" : "顯示"}</button></div><input id="api-key" type={show ? "text" : "password"} autoComplete="off" value={value} onChange={(event) => onChange(event.target.value)} placeholder="輸入你的 API Key" /></div>;
}

export function ModelNameInput({ models, value, onChange }: { models: string[]; value: string; onChange: (value: string) => void }) {
  const selectedModel = models.includes(value) ? value : models[0];
  return <label className="field"><span>模型名稱</span><select value={selectedModel} onChange={(event) => onChange(event.target.value)}>{models.map((model) => <option value={model} key={model}>{model}</option>)}</select><small className="model-usage-hint">{modelUsageHints[selectedModel]}</small></label>;
}

export function StoragePreferenceSelector({ value, onChange }: { value: SavePreference; onChange: (value: SavePreference) => void }) {
  const options: { value: SavePreference; label: string; detail: string }[] = [
    { value: "session", label: "本次工作階段", detail: "關閉分頁後清除，建議使用" },
    { value: "local", label: "儲存在此瀏覽器", detail: "下次可繼續使用，勿用於共用電腦" },
    { value: "none", label: "不保存", detail: "離開設定頁後需重新輸入" }
  ];
  return <div className="choice-block"><span className="field-caption">儲存方式</span><div className="storage-options">{options.map((item) => <button type="button" key={item.value} className={value === item.value ? "selected" : ""} onClick={() => onChange(item.value)}><b>{item.label}</b><small>{item.detail}</small></button>)}</div></div>;
}

export function ConnectionTestButton({ status, onClick }: { status: ApiKeySettings["connectionStatus"]; onClick: () => void }) {
  return <button className="button ghost" type="button" onClick={onClick} disabled={status === "testing"}>{status === "testing" ? <LoaderCircle className="spin" size={15} /> : <KeyRound size={15} />}{status === "testing" ? "測試中" : "測試 API Key"}</button>;
}

export function ApiStatusBadge({ status, message }: { status: ApiKeySettings["connectionStatus"]; message: string }) {
  if (status === "idle" && !message) return null;
  const fallbackMessage = status === "success"
    ? "連線成功，可以開始建立 Prompt。"
    : status === "testing"
      ? "正在測試模型連線..."
      : "連線失敗，請重新測試。";
  return <div className={`api-status ${status}`}>{status === "success" ? <CheckCircle2 size={16} /> : status === "testing" ? <LoaderCircle className="spin" size={16} /> : <XCircle size={16} />}<span>{message || fallbackMessage}</span></div>;
}
