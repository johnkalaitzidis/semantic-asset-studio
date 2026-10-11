import { TaxonomyLabel } from "./TaxonomyTag";
import { assetImageSrc } from "../lib/studio";
import type { AssetRecord, TaxonomyRole } from "../shared/types";

export function AssetCard({
  asset,
  selected,
  focused,
  role,
  onSelect,
  onToggle,
  onFocus,
}: {
  asset: AssetRecord;
  selected: boolean;
  focused: boolean;
  role: TaxonomyRole;
  onSelect: () => void;
  onToggle: () => void;
  onFocus: () => void;
}) {
  const emptyRecipe = !asset.prompt.trim() && !asset.seed;
  return (
    <article
      className={`group relative aspect-square rounded-[10px] bg-elevated transition-[transform,box-shadow] duration-150 ${
        selected ? "ring-2 ring-blue" : focused ? "ring-2 ring-white/40" : "ring-1 ring-white/8 hover:ring-white/16"
      }`}
    >
      <button
        type="button"
        className="absolute inset-0 overflow-hidden rounded-[10px] bg-black/30 text-left"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Stage ${asset.filename}`}
      >
        <img
          src={assetImageSrc(asset)}
          alt=""
          className="h-full w-full object-cover object-top transition duration-200 group-hover:scale-[1.02]"
          draggable={false}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 space-y-0.5 px-2.5 py-2"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
        >
          <TaxonomyLabel role={role} className="text-[12px]" />
          <p className="truncate text-[12px] font-medium text-label">{prettyName(asset.filename)}</p>
          <p className="truncate text-[10px] text-secondary">
            {emptyRecipe ? "Add recipe" : `${asset.seed ? `Seed ${asset.seed}` : "No seed"} · ${asset.steps ?? "—"} steps`}
          </p>
        </div>
      </button>
      {emptyRecipe ? (
        <button
          type="button"
          className="absolute right-2 top-2 z-10 rounded-[6px] bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-label backdrop-blur-md hover:bg-black/65"
          onClick={(event) => {
            event.stopPropagation();
            onFocus();
          }}
        >
          Add recipe
        </button>
      ) : null}
      <button
        type="button"
        className={`absolute left-2 top-2 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-[6px] border backdrop-blur-md ${
          selected ? "border-blue bg-blue text-white" : "border-white/35 bg-black/25 text-white"
        }`}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        aria-label={selected ? `Unstage ${asset.filename}` : `Stage ${asset.filename}`}
      >
        {selected ? (
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.5 6.2 4.8 8.5 9.5 3.5" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </button>
    </article>
  );
}

export function prettyName(filename: string) {
  return filename.replace(/\.[^.]+$/, "").replaceAll("_", " ");
}
