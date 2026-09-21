import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function HoverReveal({
  preview,
  detail,
  label,
}: {
  preview: ReactNode;
  detail: ReactNode;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number>(0);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const show = () => {
    window.clearTimeout(hideTimer.current);
    const next = ref.current?.getBoundingClientRect();
    if (next) setRect(next);
    setOpen(true);
  };

  const hide = () => {
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setOpen(false), 80);
  };

  return (
    <>
      <div
        ref={ref}
        className="relative"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
      >
        <div className="h-[88px] overflow-hidden rounded-[8px] bg-white/4 px-2 py-1.5 select-text" title={label}>
          <div className="line-clamp-4 text-[12px] leading-5">{preview}</div>
        </div>
      </div>
      {open && rect
        ? createPortal(
            <div
              className="fixed z-[80] max-h-[240px] overflow-y-auto rounded-[10px] bg-[#2c2c2e] p-2.5 shadow-[0_12px_40px_rgb(0_0_0_/_0.45)] ring-1 ring-white/12 apple-scroll"
              style={{ left: rect.left, top: rect.top, width: Math.max(rect.width, 260) }}
              onMouseEnter={show}
              onMouseLeave={hide}
            >
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-tertiary">Full prompt</p>
              <div className="select-text text-[12px] leading-5">{detail}</div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
