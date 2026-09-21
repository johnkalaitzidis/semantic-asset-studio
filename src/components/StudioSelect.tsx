import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export type StudioSelectOption = {
  value: string;
  label: string;
};

export function StudioSelect({
  id,
  value,
  options,
  onChange,
  placeholder = "Select",
}: {
  id?: string;
  value: string;
  options: StudioSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const generatedId = useId();
  const listId = `${id ?? generatedId}-list`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number }>({
    left: 0,
    width: 0,
    maxHeight: 240,
  });
  const selected = options.find((option) => option.value === value) ?? options[0];

  function close() {
    setOpen(false);
  }

  function pick(next: string) {
    onChange(next);
    close();
    buttonRef.current?.focus();
  }

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
    setMenu({
      top: openUp ? undefined : rect.bottom + gap,
      bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
      left: rect.left,
      width: rect.width,
      maxHeight: Math.min(240, Math.max(88, openUp ? spaceAbove : spaceBelow)),
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        buttonRef.current?.focus();
      }
    };
    const onScroll = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      close();
    };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className="flex h-[30px] w-full items-center gap-2 rounded-[8px] bg-white/8 px-2.5 text-left text-[12px] text-label ring-1 ring-inset ring-white/6 hover:bg-white/10"
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown size={12} className={`shrink-0 text-secondary transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={listId}
              role="listbox"
              aria-labelledby={id}
              style={{ top: menu.top, bottom: menu.bottom, left: menu.left, width: menu.width, maxHeight: menu.maxHeight }}
              className="apple-scroll fixed z-[80] overflow-y-auto rounded-[8px] bg-[#2c2c2e] p-1 ring-1 ring-white/12 shadow-[0_12px_40px_rgb(0_0_0_/_0.55)]"
            >
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value || "empty"}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(option.value)}
                    className={`flex w-full items-center rounded-[6px] px-2.5 py-1.5 text-left text-[12px] ${
                      active ? "bg-blue text-white" : "text-label hover:bg-white/8"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
