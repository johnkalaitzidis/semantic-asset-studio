import { useStudio, useVisibleAssets, useFamilySizes } from "../store";
import { AssetCard } from "../components/AssetCard";
import { LibraryFilters } from "../components/LibraryFilters";
import { LibrarySearch } from "../components/LibrarySearch";
import { displayRole } from "../lib/studio";
import { useMemo } from "react";

export function LibraryScreen() {
  const assets = useVisibleAssets();
  const allAssets = useStudio((s) => s.assets);
  const selectedIds = useStudio((s) => s.selectedIds);
  const inspectorId = useStudio((s) => s.inspectorId);
  const tokens = useStudio((s) => s.tokens);
  const toggleSelected = useStudio((s) => s.toggleSelected);
  const setInspector = useStudio((s) => s.setInspector);
  const usingDemo = useStudio((s) => s.usingDemo);
  const folder = useStudio((s) => s.folder);
  const familySizes = useFamilySizes();
  const sources = useMemo(
    () => [...new Set(allAssets.map((asset) => asset.source))],
    [allAssets],
  );
  const models = useMemo(
    () => [...new Set(allAssets.map((asset) => asset.model).filter((model): model is string => Boolean(model)))],
    [allAssets],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-end justify-between px-5 pb-3 pt-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-semibold tracking-tight">Library</h1>
          <p className="mt-1 text-[12px] text-secondary">
            {usingDemo ? "Placeholder cards · " : folder?.includes("example-library") ? "Example library · " : folder ? "Linked folder · " : ""}
            {assets.length} visible {tokens.length > 0 ? "matches" : "assets"}
            {" · "}
            Click an asset to stage or unstage it
          </p>
          <div className="mt-3">
            <LibrarySearch />
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <LibraryFilters sources={sources} models={models} />
            </div>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => useStudio.getState().unstageAssets(useStudio.getState().selectedIds)}
              className="shrink-0 rounded-full text-[10px] font-medium text-secondary ring-1 ring-white/14 hover:bg-white/8 hover:text-label disabled:opacity-40"
              style={{ padding: "2px 12px" }}
            >
              Deselect all
            </button>
          </div>
        </div>
      </div>
      {assets.length === 0 ? (
        <div
          className="m-5 flex min-h-0 flex-1 flex-col items-center justify-center rounded-[12px] bg-white/4 text-center"
          data-tutorial="library"
        >
          <p className="text-[15px] font-semibold">No matching assets</p>
          <p className="mt-1 max-w-[360px] text-[13px] text-secondary">
            Clear a filter or search token, or open a generation folder with PNG metadata or sidecar text files.
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 apple-scroll" data-tutorial="library">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                selected={selectedIds.includes(asset.id)}
                focused={inspectorId === asset.id}
                role={displayRole(asset, familySizes.get(asset.familyId) ?? 1)}
                onSelect={() => {
                  setInspector(asset.id);
                  toggleSelected(asset.id);
                }}
                onToggle={() => toggleSelected(asset.id)}
                onFocus={() => setInspector(asset.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
