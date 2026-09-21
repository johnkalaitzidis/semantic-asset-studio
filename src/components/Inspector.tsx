import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useStudio, useSelectedAssets } from "../store";
import { TaxonomyTag } from "./TaxonomyTag";
import { prettyName } from "./AssetCard";
import { CopyButton } from "./CopyButton";
import { StudioSelect } from "./StudioSelect";
import { displayRole, recipeText, sourceLabel } from "../lib/studio";
import { formatRecipeText } from "../lib/recipe";
import { previewLineage } from "../lib/lineage";
import type { AssetRecord, RecipeFields } from "../shared/types";

export function Inspector() {
  const assets = useStudio((s) => s.assets);
  const selected = useSelectedAssets();
  const inspectorId = useStudio((s) => s.inspectorId);
  const setInspector = useStudio((s) => s.setInspector);
  const asset = assets.find((item) => item.id === inspectorId) ?? selected[0] ?? assets[0];

  if (!asset) {
    return (
      <aside className="hairline-l hidden w-[300px] shrink-0 bg-[#1c1c1e] p-5 lg:block" data-tutorial="inspector">
        <EmptyInspector />
      </aside>
    );
  }

  const focusList = selected.length > 0 ? selected : [asset];

  return (
    <aside className="hairline-l hidden w-[300px] shrink-0 overflow-y-auto bg-[#1c1c1e] apple-scroll lg:block" data-tutorial="inspector">
      <div className="px-4 pb-3 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-tertiary">Inspector</p>
        <h2 className="mt-2 truncate text-[15px] font-semibold tracking-tight">{prettyName(asset.filename)}</h2>
      </div>
      {focusList.length > 1 ? (
        <div className="px-4 pb-3">
          <p className="mb-2 text-[11px] text-secondary">Focus asset</p>
          <div className="flex flex-col gap-1">
            {focusList.map((item) => (
              <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded-[8px] px-2 py-1.5 hover:bg-white/5">
                <input
                  type="radio"
                  name="inspector-focus"
                  checked={asset.id === item.id}
                  onChange={() => setInspector(item.id)}
                  className="accent-blue"
                />
                <span className="truncate text-[12px]">{prettyName(item.filename)}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
      <RecipePanel key={asset.id} asset={asset} assets={assets} />
    </aside>
  );
}

type RecipeForm = {
  prompt: string;
  negativePrompt: string;
  seed: string;
  cfg: string;
  steps: string;
  sampler: string;
  model: string;
};

function formFromAsset(asset: AssetRecord): RecipeForm {
  return {
    prompt: asset.prompt ?? "",
    negativePrompt: asset.negativePrompt ?? "",
    seed: asset.seed ?? "",
    cfg: asset.cfg != null ? String(asset.cfg) : "",
    steps: asset.steps != null ? String(asset.steps) : "",
    sampler: asset.sampler ?? "",
    model: asset.model ?? "",
  };
}

function recipeFromForm(form: RecipeForm, size?: string): RecipeFields {
  const steps = form.steps.trim() ? Number.parseInt(form.steps, 10) : Number.NaN;
  const cfg = form.cfg.trim() ? Number.parseFloat(form.cfg) : Number.NaN;
  return {
    prompt: form.prompt,
    negativePrompt: form.negativePrompt,
    seed: form.seed.trim() || undefined,
    steps: Number.isFinite(steps) ? steps : undefined,
    cfg: Number.isFinite(cfg) ? cfg : undefined,
    sampler: form.sampler.trim() || undefined,
    model: form.model.trim() || undefined,
    size,
  };
}

function formsEqual(a: RecipeForm, b: RecipeForm) {
  return (
    a.prompt === b.prompt &&
    a.negativePrompt === b.negativePrompt &&
    a.seed === b.seed &&
    a.cfg === b.cfg &&
    a.steps === b.steps &&
    a.sampler === b.sampler &&
    a.model === b.model
  );
}

function lineagePreviewMessage(asset: AssetRecord, familyMembers: AssetRecord[]) {
  const ancestry = [...familyMembers].sort((a, b) => a.mtime - b.mtime)[0];
  const name = ancestry ? prettyName(ancestry.filename) : "this family";
  if (familyMembers.length <= 1) {
    if (!asset.seed && !asset.prompt.trim()) {
      return "Unlinked until you add a seed or prompt.";
    }
    if (asset.seed) {
      return `New family for seed ${asset.seed}. This file will be Ancestry when another image shares that seed.`;
    }
    return "New family from this prompt. This file will be Ancestry once a relative appears.";
  }
  if (asset.id === ancestry?.id) {
    return `Ancestry of this family · ${familyMembers.length} files.`;
  }
  if (asset.role === "variant") {
    return `Joins ${name}'s family as Variant (same prompt).`;
  }
  return `Joins ${name}'s family as Branch.`;
}

const fieldClass =
  "w-full rounded-[8px] bg-white/8 px-2.5 text-[12px] text-label placeholder:text-tertiary select-text";

function RecipePanel({ asset, assets }: { asset: AssetRecord; assets: AssetRecord[] }) {
  const applyRecipe = useStudio((s) => s.applyRecipe);
  const [form, setForm] = useState(() => formFromAsset(asset));
  const [moreOpen, setMoreOpen] = useState(() =>
    Boolean(asset.negativePrompt || asset.cfg || asset.steps || asset.sampler || asset.model),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  const saved = formFromAsset(asset);
  const dirty = !formsEqual(form, saved);
  dirtyRef.current = dirty;
  const recipe = useMemo(() => recipeFromForm(form, asset.size), [form, asset.size]);
  const demo = asset.path.startsWith("demo://");
  const saveRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    if (dirtyRef.current) return;
    setForm(formFromAsset(asset));
    setError(null);
    setStatus(null);
  }, [asset]);

  const previewed = useMemo(() => previewLineage(assets, asset.id, recipe), [assets, asset.id, recipe]);
  const preview = previewed.find((item) => item.id === asset.id) ?? asset;
  const familyMembers = previewed.filter((item) => item.familyId === preview.familyId);
  const role = displayRole(preview, familyMembers.length);
  const hint = lineagePreviewMessage(preview, familyMembers);

  const linkTargets = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ seed: string; label: string }> = [];
    for (const item of assets) {
      if (item.id === asset.id || !item.seed || seen.has(item.seed)) continue;
      seen.add(item.seed);
      const ancestry = assets
        .filter((member) => member.seed === item.seed)
        .sort((a, b) => a.mtime - b.mtime)[0];
      list.push({
        seed: item.seed,
        label: `${prettyName(ancestry?.filename ?? item.filename)} · ${item.seed}`,
      });
    }
    return list.sort((a, b) => a.label.localeCompare(b.label));
  }, [assets, asset.id]);

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    setStatus(null);
    try {
      if (!demo) {
        if (!window.sas?.writeRecipe) {
          throw new Error("Saving is only available in the desktop app.");
        }
        const written = await window.sas.writeRecipe(asset.path, recipe);
        const names = [written.txtPath, written.jsonPath]
          .map((filePath) => filePath.replace(/^.*[/\\]/, ""))
          .join(" + ");
        setStatus(`Saved ${names}`);
      } else {
        setStatus("Updated in this session. Open a folder to write .txt and .json sidecars.");
      }
      applyRecipe(asset.id, recipe);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save recipe.");
    } finally {
      setSaving(false);
    }
  }

  saveRef.current = save;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") return;
      if (!dirtyRef.current) return;
      event.preventDefault();
      void saveRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function patch<K extends keyof RecipeForm>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus(null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void save();
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="px-4 pb-3">
        <TaxonomyTag role={role} />
        <p className="mt-2 text-[11px] leading-4 text-secondary" aria-live="polite">
          {hint}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={!dirty || saving}
            className="h-[28px] rounded-[8px] bg-blue px-3 text-[12px] font-medium text-white hover:brightness-110 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save recipe"}
          </button>
          {!demo ? (
            <button
              type="button"
              className="h-[28px] rounded-[8px] bg-white/8 px-3 text-[12px] font-medium hover:bg-white/12"
              onClick={() => void window.sas?.revealInFolder(asset.path)}
            >
              Show in Folder
            </button>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-[11px] leading-4 text-red">{error}</p> : null}
        {status ? <p className="mt-2 text-[11px] leading-4 text-secondary">{status}</p> : null}
      </div>
      <section className="px-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-tertiary">Prompt</h3>
            <CopyButton text={dirty ? formatRecipeText(recipe).trim() : recipeText(asset)} label="Copy all" />
          </div>
          <textarea
            id="recipe-prompt"
            value={form.prompt}
            onChange={(event) => patch("prompt", event.target.value)}
            rows={5}
            placeholder="Paste or write the prompt"
            className={`mt-2 resize-y py-2 leading-5 ${fieldClass}`}
          />
        </section>
        <div className="px-4 pb-3">
          <label htmlFor="recipe-seed" className="text-[11px] font-semibold uppercase tracking-[0.06em] text-tertiary">
            Seed
          </label>
          <input
            id="recipe-seed"
            value={form.seed}
            onChange={(event) => patch("seed", event.target.value)}
            placeholder="Same seed joins a family"
            className={`mt-1.5 h-[30px] ${fieldClass}`}
          />
        </div>
        {linkTargets.length > 0 ? (
          <div className="px-4 pb-3">
            <label htmlFor="recipe-link" className="text-[11px] font-semibold uppercase tracking-[0.06em] text-tertiary">
              Link to
            </label>
            <div className="mt-1.5">
              <StudioSelect
                id="recipe-link"
                value={linkTargets.some((item) => item.seed === form.seed.trim()) ? form.seed.trim() : ""}
                onChange={(seed) => patch("seed", seed)}
                options={[
                  { value: "", label: "Derive from seed" },
                  ...linkTargets.map((item) => ({ value: item.seed, label: item.label })),
                ]}
              />
            </div>
          </div>
        ) : null}
        <div className="px-4 pb-3">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-secondary hover:text-label"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
          >
            {moreOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            More fields
          </button>
          {moreOpen ? (
            <div className="mt-2 space-y-2.5">
              <div>
                <label htmlFor="recipe-negative" className="text-[11px] text-secondary">
                  Negative
                </label>
                <textarea
                  id="recipe-negative"
                  value={form.negativePrompt}
                  onChange={(event) => patch("negativePrompt", event.target.value)}
                  rows={3}
                  className={`mt-1 resize-y py-2 leading-5 ${fieldClass}`}
                />
              </div>
              <FieldRow label="Guidance" id="recipe-cfg" value={form.cfg} onChange={(value) => patch("cfg", value)} />
              <FieldRow label="Steps" id="recipe-steps" value={form.steps} onChange={(value) => patch("steps", value)} />
              <FieldRow label="Sampler" id="recipe-sampler" value={form.sampler} onChange={(value) => patch("sampler", value)} />
              <FieldRow label="Model" id="recipe-model" value={form.model} onChange={(value) => patch("model", value)} />
            </div>
          ) : null}
        </div>
        <dl className="divide-y divide-white/6 border-y border-white/8">
          <div className="flex items-start justify-between gap-3 px-4 py-2.5">
            <dt className="text-[12px] text-secondary">Size</dt>
            <dd className="max-w-[58%] select-text text-right text-[12px] font-medium">{asset.size ?? "—"}</dd>
          </div>
          <div className="flex items-start justify-between gap-3 px-4 py-2.5">
            <dt className="text-[12px] text-secondary">Source</dt>
            <dd className="max-w-[58%] select-text text-right text-[12px] font-medium">{sourceLabel(asset.source)}</dd>
          </div>
        </dl>
    </form>
  );
}

function FieldRow({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[11px] text-secondary">
        {label}
      </label>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} className={`mt-1 h-[30px] ${fieldClass}`} />
    </div>
  );
}

function EmptyInspector() {
  return (
    <div className="flex h-full flex-col justify-center text-center">
      <p className="text-[13px] font-medium">No selection</p>
      <p className="mt-1 text-[12px] text-secondary">Click an asset to inspect it and stage it in the tray.</p>
    </div>
  );
}
