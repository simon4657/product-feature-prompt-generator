import Link from "next/link";
import { Aperture } from "lucide-react";

export function AppHeader() {
  return (
    <header className="app-header">
      <Link href="/" className="brand">
        <span className="brand-mark"><Aperture size={20} /></span>
        <span>
          <strong>Prompt Studio</strong>
          <small>PRODUCT VISUAL LAB</small>
        </span>
      </Link>
      <div className="header-status"><i /> OpenAI · Gemini · Kimi</div>
    </header>
  );
}
