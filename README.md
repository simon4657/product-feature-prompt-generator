# Product Feature Prompt Generator

產品功能圖企劃與生圖 Prompt 產生器。使用者可自行設定 OpenAI、Google Gemini 或 Kimi API Key，整理產品資料、微調功能圖企劃，並輸出可直接使用的生圖 Prompts。

## Local Development

```bash
npm ci
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

## Production

```bash
npm run build
npm start
```

## Render

專案包含 `render.yaml`，可透過 Render Blueprint 建立 Node Web Service：

- Build: `npm ci && npm run build`
- Start: `npm start`
- Health check: `/`
- API Key 由使用者在瀏覽器中輸入，不需設定伺服器端模型金鑰

API Key 預設只儲存在瀏覽器 `sessionStorage`，不會提交至 Git 或寫入公開資料庫。
