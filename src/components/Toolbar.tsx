import { CircleHelp } from "lucide-react";
import { useStudio } from "../store";

export function Toolbar() {
  const scanning = useStudio((s) => s.scanning);
  const progress = useStudio((s) => s.progress);

  return (
    <header className="app-drag absolute inset-x-0 top-0 z-30 flex min-h-[52px] flex-col justify-center bg-[#1c1c1e]/88 px-3 py-1.5 pr-[146px] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[var(--separator)]" />
      <div className="flex items-center gap-3">
        <div className="min-w-[168px] pl-1" data-tutorial="welcome">
          <p className="text-[13px] font-semibold tracking-tight text-label">Semantic Asset Studio</p>
        </div>
        <div className="app-no-drag ml-auto flex items-center gap-2">
          {scanning && progress && progress.done < (progress.total || 1) ? (
            <p className="text-[11px] text-secondary">
              Scanning {progress.done}/{progress.total || "…"}
            </p>
          ) : null}
          <button
            type="button"
            title="Tutorial"
            aria-label="Open tutorial"
            data-tutorial="help"
            onClick={() => useStudio.getState().openTutorial()}
            className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-white/8 text-label hover:bg-white/12"
          >
            <CircleHelp size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
