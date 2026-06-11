import Link from "next/link";
import { Check } from "lucide-react";

const steps = [
  { label: "API 設定", href: "/setup" },
  { label: "產品資料", href: "/create" },
  { label: "企劃微調", href: "/planning" },
  { label: "Prompt 輸出", href: "/output" }
];

export function StepNav({ current }: { current: number }) {
  return (
    <nav className="step-nav" aria-label="建立進度">
      {steps.map((step, index) => {
        const number = index + 1;
        const done = index < current;
        const content = <>
          <span>{done ? <Check size={14} /> : number}</span>
          <b>{step.label}</b>
        </>;
        return (
          <div className={`step ${index === current ? "active" : ""} ${done ? "done" : ""}`} key={step.label}>
            {done
              ? <Link className="step-main step-link" href={step.href} aria-label={`返回${step.label}`}>{content}</Link>
              : <div className="step-main">{content}</div>}
            {index < steps.length - 1 && <i />}
          </div>
        );
      })}
    </nav>
  );
}
