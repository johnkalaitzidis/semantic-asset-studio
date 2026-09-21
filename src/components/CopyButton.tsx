import { Check, Copy } from "lucide-react";
import { useState, type MouseEvent } from "react";

export function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy(event: MouseEvent) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard can fail in locked contexts */
    }
  }

  return (
    <button
      type="button"
      onClick={(event) => void copy(event)}
      disabled={!text}
      className="inline-flex h-[22px] items-center gap-1 rounded-[6px] px-1.5 text-[11px] font-medium text-secondary hover:bg-white/8 hover:text-label disabled:opacity-40"
      aria-label={copied ? "Copied" : label}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : label}
    </button>
  );
}
