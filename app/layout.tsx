import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "功能圖 Prompt Studio",
  description: "把產品功能轉換成可直接使用的商業圖像生成 Prompts"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
