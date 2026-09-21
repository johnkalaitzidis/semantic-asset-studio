import { ChevronDown } from "lucide-react";
import { useRef, type PointerEvent } from "react";
import { useStudio, useSelectedAssets } from "../store";
import { assetImageSrc, buildTrayGroups, trayRoleFor } from "../lib/studio";
import { TaxonomyTag } from "./TaxonomyTag";
import { prettyName } from "./AssetCard";

const TRAY_MIN = 96;
const TRAY_MAX = 480;

export function SelectionTray() {
  const selected = useSelectedAssets();
  const trayOpen = useStudio((s) => s.trayOpen);
  const trayHeight = useStudio((s) => s.trayHeight);
  const setTrayOpen = useStudio((s) => s.setTrayOpen);
  const setTrayHeight = useStudio((s) => s.setTrayHeight);
  const setWorkspace = useStudio((s) => s.setWorkspace);
  const toggleSelected = useStudio((s) => s.toggleSelected);
  const unstageAssets = useStudio((s) => s.unstageAssets);
  const groups = buildTrayGroups(selected);
  const drag = useRef<{ startY: number; startH: number; opened: boolean } | null>(null);

  function onResizePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const opened = trayOpen;
    if (!opened) setTrayOpen(true);
    drag.current = {
      startY: event.clientY,
      startH: opened ? trayHeight : TRAY_MIN,
      opened,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onResizePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    const delta = drag.current.startY - event.clientY;
    const max = Math.min(TRAY_MAX, Math.round(window.innerHeight * 0.55));
    const next = Math.round(Math.min(max, Math.max(TRAY_MIN, drag.current.startH + delta)));
    setTrayHeight(next);
    if (next > TRAY_MIN) setTrayOpen(true);
  }

  function onResizePointerUp(event: PointerEvent<HTMLDivElement>) {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <section className="relative shrink-0 hairline-t bg-[#111112]">
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize selection tray"
        className="group/resize absolute inset-x-0 -top-1 z-20 flex h-3 cursor-ns-resize items-start justify-center"
        onPointerDown={onResizePointerDown}
        onPointerMove={onResizePointerMove}
        onPointerUp={onResizePointerUp}
        onPointerCancel={onResizePointerUp}
      >
        <span className="mt-0.5 h-1 w-11 rounded-full bg-white/0 transition-colors group-hover/resize:bg-white/45" />
      </div>
      <div className="flex items-center justify-between px-4 pt-4" data-tutorial="tray">
        <div className="flex items-center gap-2">
          <p className="text-[12px] font-semibold">Selection Tray</p>
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-secondary">{selected.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 ? (
            <button
              type="button"
              onClick={() => unstageAssets(selected.map((asset) => asset.id))}
              className="h-[26px] rounded-[7px] px-2.5 text-[12px] text-secondary hover:bg-white/8 hover:text-label"
            >
              Clear
            </button>
          ) : null}
          <button
            type="button"
            disabled={selected.length < 2}
            onClick={() => setWorkspace("compare")}
            className="h-[26px] rounded-[7px] bg-white/8 px-2.5 text-[12px] font-medium enabled:hover:bg-white/12 disabled:opacity-40"
          >
            Compare
          </button>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => setWorkspace("lineage")}
            className="h-[26px] rounded-[7px] bg-white/8 px-2.5 text-[12px] font-medium enabled:hover:bg-white/12 disabled:opacity-40"
          >
            Lineage
          </button>
          <span className="mx-1 h-4 w-px bg-white/12" />
          <button
            type="button"
            aria-expanded={trayOpen}
            aria-label={trayOpen ? "Collapse tray" : "Expand tray"}
            onClick={() => setTrayOpen(!trayOpen)}
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] hover:bg-white/8"
          >
            <ChevronDown size={16} className={`transition ${trayOpen ? "" : "rotate-180"}`} />
          </button>
        </div>
      </div>
      {trayOpen ? (
        <div className="overflow-auto px-4 pb-4 apple-scroll" style={{ height: trayHeight, paddingTop: 20 }}>
          {selected.length === 0 ? (
            <p className="py-8 text-[12px] text-secondary">
              Click assets in the library to stage them. Related files stay in a lineage bracket; unlinked files drop to their own row.
            </p>
          ) : (
            <div className="flex min-w-max flex-col gap-4">
              {groups.filter((group) => !group.unlinked).map((group) => (
                <div
                  key={group.familyId}
                  className="flex items-stretch rounded-[12px] bg-white/4 p-3 ring-1 ring-cyan/35"
                >
                  <span className="w-1 shrink-0 rounded-full bg-cyan/80" />
                  <div className="ml-2 flex gap-3">
                    {group.items.map((asset) => (
                      <TrayCard
                        key={asset.id}
                        asset={asset}
                        role={trayRoleFor(asset, group)}
                        onRemove={() => toggleSelected(asset.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {groups.filter((group) => group.unlinked).map((group) => (
                <div key="unlinked" className="flex gap-3 rounded-[12px] bg-white/[0.03] p-3 ring-1 ring-white/10">
                  {group.items.map((asset) => (
                    <TrayCard
                      key={asset.id}
                      asset={asset}
                      role="unlinked"
                      onRemove={() => toggleSelected(asset.id)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function TrayCard({
  asset,
  role,
  onRemove,
}: {
  asset: ReturnType<typeof useSelectedAssets>[number];
  role: "ancestry" | "branch" | "variant" | "unlinked";
  onRemove: () => void;
}) {
  return (
    <div className="w-[96px]">
      <div className="relative aspect-square overflow-hidden rounded-[8px] bg-black/30">
        <img src={assetImageSrc(asset)} alt="" className="h-full w-full object-cover object-top" />
        <button
          type="button"
          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-[11px] text-white"
          onClick={onRemove}
          aria-label={`Remove ${prettyName(asset.filename)}`}
        >
          ×
        </button>
      </div>
      <div className="mt-2">
        <TaxonomyTag role={role} compact />
      </div>
    </div>
  );
}
