import { prettyName } from "../components/AssetCard";
import { CopyButton } from "../components/CopyButton";
import { HoverReveal } from "../components/HoverReveal";
import { useMemo } from "react";
import { useStudio, useSelectedAssets } from "../store";
import { assetFullSrc, diffPrompts, numericDrift, recipeText } from "../lib/studio";
import { TaxonomyTag } from "../components/TaxonomyTag";
import type { DiffToken } from "../lib/studio";

export function CompareScreen() {
  const selected = useSelectedAssets();
  const inspectorId = useStudio((s) => s.inspectorId);
  const setInspector = useStudio((s) => s.setInspector);
  const tutorialOpen = useStudio((s) => s.tutorialOpen);
  const baseline = selected.find((asset) => asset.id === inspectorId) ?? selected[0];

  if (selected.length < 2 || !baseline) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <h1 className="text-[22px] font-semibold tracking-tight">Parametric Diff</h1>
        <p className="mt-2 max-w-[420px] text-[13px] text-secondary">
          Stage at least two assets in the library, then compare prompt mutations and numeric drift side by side.
        </p>
        {tutorialOpen ? <TutorialPromptSample className="mt-4 w-full max-w-[420px]" /> : null}
        <button
          type="button"
          onClick={() => useStudio.getState().setWorkspace("library")}
          className="mt-4 h-[32px] rounded-[8px] bg-blue px-3 text-[13px] font-medium text-white"
        >
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-5 pb-3 pt-4">
        <h1 className="text-[22px] font-semibold tracking-tight">Compare</h1>
        <p className="mt-1 text-[12px] text-secondary">
          Prompt blocks stay the same height. Hover for the full recipe, or copy prompt and parameters.
        </p>
      </div>
      {tutorialOpen ? <TutorialPromptSample className="mx-5 mb-3" /> : null}
      <div className="flex min-h-0 flex-1 items-start gap-3 overflow-auto px-5 pb-5 pt-1 apple-scroll">
        {selected.map((asset) => (
          <CompareColumn
            key={asset.id}
            asset={asset}
            baseline={baseline}
            focused={asset.id === baseline.id}
            tutorialOpen={tutorialOpen}
            onFocus={() => setInspector(asset.id)}
          />
        ))}
      </div>
    </div>
  );
}

function TutorialPromptSample({ className = "" }: { className?: string }) {
  return (
    <div data-tutorial="compare" className={`rounded-[10px] bg-white/4 px-3 py-2.5 text-left ${className}`}>
      <p className="text-[11px] font-medium text-tertiary">Tutorial example</p>
      <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] leading-5">
        <span className="text-secondary">anime girl, long dark hair</span>
        <span className="rounded-full bg-red/20 px-2 py-0.5 text-[11px] font-medium text-red">winter coat</span>
        <span className="rounded-full bg-green/20 px-2 py-0.5 text-[11px] font-medium text-green">holding a katana</span>
      </p>
    </div>
  );
}

function CompareColumn({
  asset,
  baseline,
  focused,
  tutorialOpen,
  onFocus,
}: {
  asset: ReturnType<typeof useSelectedAssets>[number];
  baseline: ReturnType<typeof useSelectedAssets>[number];
  focused: boolean;
  tutorialOpen: boolean;
  onFocus: () => void;
}) {
  const promptDiff = useMemo(
    () => diffPrompts(baseline.prompt, asset.prompt),
    [baseline.prompt, asset.prompt],
  );
  const drift = numericDrift(baseline, asset);
  const prompt = asset.prompt || "No prompt";
  const removed = promptDiff.fromTokens.filter((token) => token.kind === "remove" && token.text.trim() && token.text !== ",");
  const added = promptDiff.toTokens.filter((token) => token.kind === "add" && token.text.trim() && token.text !== ",");

  return (
    <section className={`flex w-[300px] shrink-0 flex-col rounded-[12px] bg-white/4 ${focused ? "ring-2 ring-blue" : "ring-1 ring-white/8"}`}>
      <button type="button" onClick={onFocus} className="relative aspect-square w-full shrink-0 overflow-hidden rounded-t-[12px]">
        <img src={assetFullSrc(asset)} alt="" className="h-full w-full object-cover object-top" />
        <div className="absolute left-3 top-3">
          <TaxonomyTag role={asset.role} />
        </div>
      </button>
      <div className="flex flex-1 flex-col space-y-3 p-3">
        <div className="flex items-center gap-2 text-[12px]">
          <label className="flex min-w-0 flex-1 items-center gap-2">
            <input type="radio" name="compare-focus" checked={focused} onChange={onFocus} className="accent-blue" />
            <span className="truncate font-medium">{prettyName(asset.filename)}</span>
          </label>
          <CopyButton text={recipeText(asset)} label="Copy all" />
        </div>
        <div>
          <HoverReveal
            label="Hover for more info"
            preview={<span className="select-text">{prompt}</span>}
            detail={
              <div className="space-y-2">
                <p className="select-text">{prompt}</p>
                {focused ? (
                  <p className="text-[11px] text-tertiary">Baseline · no token diff</p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {removed.map((token, index) => (
                      <span key={`rm-${token.text}-${index}`} className="rounded-full bg-red/20 px-2 py-0.5 text-[11px] font-medium text-red">
                        {token.text}
                      </span>
                    ))}
                    {promptDiff.toTokens.map((token, index) => (
                      <PromptPill key={`${token.text}-${index}`} token={token} />
                    ))}
                  </div>
                )}
                <CopyButton text={prompt} label="Copy prompt" />
              </div>
            }
          />
          {tutorialOpen && !focused && (removed.length > 0 || added.length > 0) ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {removed.map((token, index) => (
                <span key={`rm-${token.text}-${index}`} className="rounded-full bg-red/20 px-2 py-0.5 text-[11px] font-medium text-red">
                  {token.text}
                </span>
              ))}
              {added.map((token, index) => (
                <span key={`add-${token.text}-${index}`} className="rounded-full bg-green/20 px-2 py-0.5 text-[11px] font-medium text-green">
                  {token.text}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-[11px] text-tertiary">Hover for more info</p>
            <CopyButton text={prompt} label="Copy" />
          </div>
        </div>
        <div className="space-y-1.5">
          {drift.map((field) => (
            <div
              key={field.key}
              className={`flex h-[30px] items-center justify-between gap-2 rounded-[8px] px-2 text-[12px] ${field.changed ? "bg-cyan/10 ring-1 ring-cyan/50" : "bg-white/4"}`}
            >
              <span className="text-secondary">{field.label}</span>
              <span className="truncate font-medium select-text">{String(field.b ?? "—")}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PromptPill({ token }: { token: DiffToken }) {
  if (token.text.trim() === "" || token.text === ",") {
    return <span className="text-[12px] text-secondary">{token.text}</span>;
  }
  if (token.kind === "add") {
    return <span className="rounded-full bg-green/20 px-2 py-0.5 text-[11px] font-medium text-green">{token.text}</span>;
  }
  if (token.kind === "remove") {
    return null;
  }
  return <span className="text-[12px] text-secondary">{token.text}</span>;
}
