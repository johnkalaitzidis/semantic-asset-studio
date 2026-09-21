import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { TUTORIAL_STORAGE_KEY, useStudio } from "../store";
import type { WorkspaceId } from "../shared/types";

type Placement = "top" | "bottom" | "left" | "right";

type TutorialStep = {
  title: string;
  body: string;
  workspace: WorkspaceId;
  target?: string;
  placement: Placement;
  openTray?: boolean;
  sampleDiff?: boolean;
};

const STEPS: TutorialStep[] = [
  {
    title: "Welcome to Semantic Asset Studio",
    body: "This is a studio for character images you already generated — not a generator. It reads prompt, seed, and settings from your files so you can browse, compare, and see how a look branched.",
    workspace: "library",
    placement: "bottom",
  },
  {
    title: "Open a generation folder",
    body: "Scan Fooocus, Automatic1111, or ComfyUI outputs here. PNG metadata and sidecar .txt files become prompt, seed, CFG, sampler, and model. Reload rescans the current folder.",
    workspace: "library",
    target: "open-folder",
    placement: "right",
  },
  {
    title: "Library",
    body: "Click a card to inspect it and stage it in the Selection Tray. Click again to unstage. Search looks through prompts, seeds, and models.",
    workspace: "library",
    target: "library",
    placement: "bottom",
  },
  {
    title: "Taxonomy",
    body: "Families share a seed. The earliest file is Ancestry. The same prompt with different settings is a Variant. Prompt changes are Branches. Unlinked files sit outside a family.",
    workspace: "library",
    target: "taxonomy",
    placement: "bottom",
  },
  {
    title: "Inspector",
    body: "The focused asset’s recipe lives here. Fill prompt and seed for files that didn’t embed them. Taxonomy is computed from the family — same seed joins, same prompt is a Variant, a prompt change is a Branch. Save recipe writes a .txt and .json sidecar next to the image.",
    workspace: "library",
    target: "inspector",
    placement: "left",
  },
  {
    title: "Selection Tray",
    body: "Staged assets collect here. Related files sit in a lineage bracket. Clear, Compare, and Lineage act on the tray. Drag the top edge to resize.",
    workspace: "library",
    target: "tray",
    placement: "top",
    openTray: true,
  },
  {
    title: "Compare",
    body: "Side-by-side parametric diff for staged assets. Prompt tokens turn red when removed and green when added. Numeric drift — CFG, steps, seed — highlights in cyan.",
    workspace: "compare",
    target: "compare",
    placement: "bottom",
    sampleDiff: true,
  },
  {
    title: "Lineage",
    body: "A map of the staged family. Ancestry sits at the root; branches and variants connect from there. Hover an arrow to see what changed in the prompt or settings.",
    workspace: "lineage",
    target: "lineage",
    placement: "bottom",
    openTray: true,
  },
  {
    title: "Shortcuts",
    body: "Ctrl+F focuses search. Ctrl+1, 2, and 3 switch Library, Compare, and Lineage. Reopen this tour anytime with this question mark.",
    workspace: "library",
    target: "help",
    placement: "bottom",
  },
];

const TIP_WIDTH = 340;
const GAP = 22;
const MARGIN = 12;
const EDGE = 8;
const PAD = 6;
const CAPTION_W = 138;
const CAPTION_H = 52;

export function Tutorial() {
  const open = useStudio((s) => s.tutorialOpen);
  const step = useStudio((s) => s.tutorialStep);
  const workspace = useStudio((s) => s.workspace);
  const trayOpen = useStudio((s) => s.trayOpen);
  const closeTutorial = useStudio((s) => s.closeTutorial);
  const setTutorialStep = useStudio((s) => s.setTutorialStep);
  const [anchor, setAnchor] = useState<Box | null>(null);
  const [tipSize, setTipSize] = useState({ w: TIP_WIDTH, h: 200 });
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === "1") return;
    } catch {
      return;
    }
    useStudio.getState().openTutorial();
  }, []);

  useEffect(() => {
    if (!open) return;
    const current = STEPS[step];
    if (!current) return;
    useStudio.getState().setWorkspace(current.workspace);
    if (current.openTray) useStudio.getState().setTrayOpen(true);
  }, [open, step]);

  useLayoutEffect(() => {
    if (!open) {
      setAnchor(null);
      return;
    }
    const target = STEPS[step]?.target;
    if (!target) {
      setAnchor(null);
      return;
    }
    let alive = true;
    let attempts = 0;
    let frame = 0;
    let timer = 0;
    const read = () => {
      const el = document.querySelector(`[data-tutorial="${target}"]`);
      if (!el || !alive) return false;
      setAnchor(boxFromElement(el));
      return true;
    };
    if (!read()) {
      const retry = () => {
        if (!alive || read() || attempts++ >= 60) return;
        frame = requestAnimationFrame(retry);
        if (attempts === 12) timer = window.setTimeout(read, 50);
      };
      frame = requestAnimationFrame(retry);
      timer = window.setTimeout(read, 32);
    }
    const onResize = () => {
      read();
    };
    window.addEventListener("resize", onResize);
    const observed = document.querySelector(`[data-tutorial="${target}"]`);
    const ro = new ResizeObserver(() => read());
    if (observed) ro.observe(observed);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [open, step, workspace, trayOpen]);

  useLayoutEffect(() => {
    if (!open || !tipRef.current) return;
    const next = { w: tipRef.current.offsetWidth, h: tipRef.current.offsetHeight };
    if (Math.abs(next.w - tipSize.w) > 1 || Math.abs(next.h - tipSize.h) > 1) setTipSize(next);
  }, [open, step, anchor, tipSize.h, tipSize.w]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        useStudio.getState().closeTutorial();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        const current = useStudio.getState().tutorialStep;
        if (current >= STEPS.length - 1) useStudio.getState().closeTutorial();
        else useStudio.getState().setTutorialStep(current + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        const current = useStudio.getState().tutorialStep;
        if (current > 0) useStudio.getState().setTutorialStep(current - 1);
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  if (!open) return null;

  const current = STEPS[step] ?? STEPS[0];
  const isFirst = step <= 0;
  const isLast = step >= STEPS.length - 1;
  const hole = anchor ? holeFromRect(anchor) : null;
  const layout = hole ? placeTip(hole, current.placement, tipSize) : null;

  return createPortal(
    <div className="fixed inset-0 z-[80]" role="presentation">
      <Spotlight hole={hole} />
      <div
        ref={tipRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        className="app-no-drag absolute w-[340px] rounded-[14px] bg-[#2c2c2e] p-4 shadow-[0_24px_80px_rgb(0_0_0_/_0.55)] ring-1 ring-white/12"
        style={
          layout
            ? { left: layout.left, top: layout.top }
            : { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
        }
      >
        {layout ? <Arrow placement={layout.placement} offset={layout.arrow} /> : null}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-tertiary">
              Tutorial · {step + 1} of {STEPS.length}
            </p>
            <h2 id="tutorial-title" className="mt-1.5 text-[15px] font-semibold tracking-tight">
              {current.title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close tutorial"
            onClick={closeTutorial}
            className="inline-flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[8px] text-secondary hover:bg-white/8 hover:text-label"
          >
            <X size={16} />
          </button>
        </div>
        <p className="mt-2 text-[13px] leading-5 text-secondary">{current.body}</p>
        {current.sampleDiff ? <SampleDiffPills /> : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1" aria-hidden>
            {STEPS.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full ${index === step ? "w-3.5 bg-blue" : "w-1.5 bg-white/18"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (step > 0) setTutorialStep(step - 1);
              }}
              disabled={isFirst}
              className="h-[30px] rounded-[8px] px-3 text-[13px] font-medium text-secondary hover:bg-white/8 hover:text-label disabled:opacity-35"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLast) closeTutorial();
                else setTutorialStep(step + 1);
              }}
              className="h-[30px] rounded-[8px] bg-blue px-3 text-[13px] font-medium text-white hover:brightness-110 active:brightness-95"
            >
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SampleDiffPills() {
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      <span className="rounded-full bg-red/20 px-2 py-0.5 text-[11px] font-medium text-red">winter coat</span>
      <span className="rounded-full bg-green/20 px-2 py-0.5 text-[11px] font-medium text-green">holding a katana</span>
    </div>
  );
}

type Box = { left: number; top: number; right: number; bottom: number; width: number; height: number };
type Hole = { x: number; y: number; w: number; h: number };

function boxFromElement(el: Element): Box {
  const rect = el.getBoundingClientRect();
  return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
}

function holeFromRect(rect: Box): Hole {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const overlayLeft = vw - CAPTION_W;

  let x = rect.left - PAD;
  let y = rect.top - PAD;
  let x2 = rect.right + PAD;
  let y2 = rect.bottom + PAD;

  x = Math.max(EDGE, x);
  y = Math.max(EDGE, y);
  x2 = Math.min(vw - EDGE, x2);
  y2 = Math.min(vh - EDGE, y2);

  if (x2 > overlayLeft && y < CAPTION_H + EDGE) {
    if (rect.top < CAPTION_H) {
      x2 = Math.min(x2, overlayLeft - EDGE);
    } else {
      y = Math.max(y, CAPTION_H + EDGE);
    }
  }

  return { x, y, w: Math.max(28, x2 - x), h: Math.max(28, y2 - y) };
}

function Spotlight({ hole }: { hole: Hole | null }) {
  if (!hole) return <div className="absolute inset-0 bg-black/50" />;
  const { x, y, w, h } = hole;
  const dim = "absolute bg-black/50";
  return (
    <>
      <div className={dim} style={{ left: 0, top: 0, right: 0, height: y }} />
      <div className={dim} style={{ left: 0, top: y, width: x, height: h }} />
      <div className={dim} style={{ left: x + w, top: y, right: 0, height: h }} />
      <div className={dim} style={{ left: 0, top: y + h, right: 0, bottom: 0 }} />
      <div
        className="pointer-events-none absolute rounded-[10px]"
        style={{
          left: x,
          top: y,
          width: w,
          height: h,
          boxShadow: "inset 0 0 0 2px #0a84ff",
        }}
      />
    </>
  );
}

function Arrow({ placement, offset }: { placement: Placement; offset: number }) {
  const common = "pointer-events-none absolute h-0 w-0";
  if (placement === "right") {
    return (
      <span
        className={`${common} border-y-8 border-y-transparent border-r-8 border-r-[#2c2c2e]`}
        style={{ left: -8, top: offset - 8 }}
      />
    );
  }
  if (placement === "left") {
    return (
      <span
        className={`${common} border-y-8 border-y-transparent border-l-8 border-l-[#2c2c2e]`}
        style={{ right: -8, top: offset - 8 }}
      />
    );
  }
  if (placement === "bottom") {
    return (
      <span
        className={`${common} border-x-8 border-x-transparent border-b-8 border-b-[#2c2c2e]`}
        style={{ top: -8, left: offset - 8 }}
      />
    );
  }
  return (
    <span
      className={`${common} border-x-8 border-x-transparent border-t-8 border-t-[#2c2c2e]`}
      style={{ bottom: -8, left: offset - 8 }}
    />
  );
}

function placeTip(hole: Hole, preferred: Placement, size: { w: number; h: number }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const leftEdge = hole.x;
  const topEdge = hole.y;
  const rightEdge = hole.x + hole.w;
  const bottomEdge = hole.y + hole.h;
  const fits = {
    right: rightEdge + GAP + size.w + MARGIN <= vw,
    left: leftEdge - GAP - size.w >= MARGIN,
    bottom: bottomEdge + GAP + size.h + MARGIN <= vh,
    top: topEdge - GAP - size.h >= MARGIN,
  };
  const order: Placement[] = [preferred, "right", "left", "bottom", "top"];
  const placement = order.find((side) => fits[side]) ?? preferred;

  let left = 0;
  let top = 0;
  if (placement === "right") {
    left = rightEdge + GAP;
    top = topEdge + hole.h / 2 - size.h / 2;
  } else if (placement === "left") {
    left = leftEdge - GAP - size.w;
    top = topEdge + hole.h / 2 - size.h / 2;
  } else if (placement === "bottom") {
    left = leftEdge + hole.w / 2 - size.w / 2;
    top = bottomEdge + GAP;
  } else {
    left = leftEdge + hole.w / 2 - size.w / 2;
    top = topEdge - GAP - size.h;
  }

  left = Math.min(Math.max(MARGIN, left), Math.max(MARGIN, vw - size.w - MARGIN));
  top = Math.min(Math.max(MARGIN, top), Math.max(MARGIN, vh - size.h - MARGIN));

  let arrow = 24;
  if (placement === "right" || placement === "left") {
    arrow = topEdge + hole.h / 2 - top;
  } else {
    arrow = leftEdge + hole.w / 2 - left;
  }
  arrow = Math.min(Math.max(18, arrow), (placement === "right" || placement === "left" ? size.h : size.w) - 18);

  return { left, top, placement, arrow };
}
