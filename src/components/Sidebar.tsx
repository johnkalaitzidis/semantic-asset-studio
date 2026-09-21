import { FolderOpen, FolderUp, GitBranch, GitCompare, Images, RotateCcw } from "lucide-react";
import { useStudio } from "../store";
import type { WorkspaceId } from "../shared/types";

const items: Array<{ id: WorkspaceId; label: string; caption: string; icon: typeof Images }> = [
  { id: "library", label: "Library", caption: "Discovery & staging", icon: Images },
  { id: "compare", label: "Compare", caption: "Parametric diff", icon: GitCompare },
  { id: "lineage", label: "Lineage", caption: "History matrix", icon: GitBranch },
];

async function openFolder() {
  const picked = await window.sas?.pickFolder();
  if (!picked || !window.sas) return;
  useStudio.getState().setScanning(true, { done: 0, total: 0, folder: picked });
  const assets = await window.sas.scanFolder(picked);
  useStudio.getState().setFolderAssets(picked, assets);
}

async function reloadLibrary() {
  const api = window.sas;
  const current = useStudio.getState().folder;
  if (api && current) {
    useStudio.getState().setScanning(true, { done: 0, total: 0, folder: current });
    const assets = await api.scanFolder(current);
    useStudio.getState().setFolderAssets(current, assets);
    return;
  }
  if (api) {
    const example = await api.getExampleLibrary();
    if (example) {
      useStudio.getState().setScanning(true, { done: 0, total: 0, folder: example });
      const assets = await api.scanFolder(example);
      useStudio.getState().setFolderAssets(example, assets);
      return;
    }
  }
  useStudio.getState().loadDemo();
}

export function Sidebar() {
  const workspace = useStudio((s) => s.workspace);
  const setWorkspace = useStudio((s) => s.setWorkspace);
  const folder = useStudio((s) => s.folder);
  const usingDemo = useStudio((s) => s.usingDemo);
  const assets = useStudio((s) => s.assets);
  const scanning = useStudio((s) => s.scanning);

  return (
    <aside className="material flex w-[220px] shrink-0 flex-col">
      <div className="px-4 pb-3 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-tertiary">Workspace</p>
      </div>
      <nav className="flex flex-col gap-0.5 px-2" aria-label="Studio views">
        {items.map((item) => {
          const active = workspace === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setWorkspace(item.id)}
              className={`app-no-drag flex items-center gap-3 rounded-[8px] px-2 py-1.5 text-left transition-colors ${active ? "bg-blue text-white" : "text-label hover:bg-white/6"}`}
            >
              <Icon size={16} strokeWidth={1.75} className={active ? "opacity-100" : "opacity-70"} />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium leading-tight">{item.label}</span>
                <span className={`block text-[11px] leading-tight ${active ? "text-white/70" : "text-secondary"}`}>{item.caption}</span>
              </span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto">
        <div className="px-3 pb-3">
          <KofiButton />
        </div>
        <div className="border-t border-white/8 px-3 py-4" data-tutorial="open-folder">
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void openFolder()}
            disabled={scanning}
            className="inline-flex h-[30px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-blue px-2.5 text-[12px] font-medium text-white hover:brightness-110 active:brightness-95 disabled:opacity-50"
          >
            <FolderUp size={14} />
            Open Folder
          </button>
          <button
            type="button"
            title="Reload library"
            aria-label="Reload library"
            onClick={() => void reloadLibrary()}
            disabled={scanning}
            className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] bg-white/8 text-label hover:bg-white/12 disabled:opacity-50"
          >
            <RotateCcw size={14} />
          </button>
        </div>
        <div className="flex items-start gap-2 px-1 text-secondary">
          <FolderOpen size={14} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-label">
              {usingDemo ? "Placeholder library" : folder?.includes("example-library") ? "Example library" : "Linked folder"}
            </p>
            <p className="truncate text-[11px] text-secondary" title={folder ?? "No folder linked"}>
              {folder ? folder.split(/[/\\]/).slice(-2).join(" / ") : "No folder linked"}
            </p>
            <p className="mt-1 text-[11px] text-tertiary">{assets.length} assets</p>
          </div>
        </div>
        </div>
      </div>
    </aside>
  );
}

const KOFI_URL = "https://ko-fi.com/L0W426QW6M";

function openKofi() {
  if (window.sas?.openExternal) {
    void window.sas.openExternal(KOFI_URL);
    return;
  }
  window.open(KOFI_URL, "_blank", "noopener,noreferrer");
}

function KofiButton() {
  return (
    <button
      type="button"
      title="Support me on ko-fi.com"
      onClick={() => openKofi()}
      className="app-no-drag inline-flex h-[36px] w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] px-3 text-[14px] font-bold text-white shadow-[1px_1px_0_rgb(0_0_0_/_0.2)] hover:opacity-85 active:opacity-80"
      style={{ backgroundColor: "#EA645F" }}
    >
      <img
        src="https://storage.ko-fi.com/cdn/cup-border.png"
        alt=""
        className="kofi-cup h-[15px] w-[22px]"
      />
      Support me on Ko-fi
    </button>
  );
}
