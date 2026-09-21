import { useEffect } from "react";
import { Toolbar } from "./components/Toolbar";
import { Sidebar } from "./components/Sidebar";
import { Inspector } from "./components/Inspector";
import { SelectionTray } from "./components/SelectionTray";
import { LibraryScreen } from "./screens/LibraryScreen";
import { CompareScreen } from "./screens/CompareScreen";
import { LineageScreen } from "./screens/LineageScreen";
import { Tutorial } from "./components/Tutorial";
import { useStudio } from "./store";

export default function App() {
  const workspace = useStudio((s) => s.workspace);

  useEffect(() => {
    document.title = `Semantic Asset Studio — ${workspace}`;
  }, [workspace]);

  useEffect(() => {
    const api = window.sas;
    if (!api) return;

    const stopProgress = api.onScanProgress((progress) => {
      const inFlight = progress.total === 0 || progress.done < progress.total;
      useStudio.getState().setScanning(inFlight, progress);
    });
    const stopUpdates = api.onAssetsUpdated((assets) => {
      if (!useStudio.getState().folder) return;
      useStudio.getState().replaceFolderAssets(assets);
    });

    void (async () => {
      const persisted = await api.getPersistedFolder();
      const example = await api.getExampleLibrary();
      const folder = persisted && persisted.length > 0 ? persisted : example;
      if (!folder) return;
      useStudio.getState().setScanning(true, { done: 0, total: 0, folder });
      const assets = await api.scanFolder(folder);
      useStudio.getState().setFolderAssets(folder, assets);
    })();

    return () => {
      stopProgress();
      stopUpdates();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (useStudio.getState().tutorialOpen) return;
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "f") {
        event.preventDefault();
        useStudio.getState().setWorkspace("library");
        window.setTimeout(() => document.getElementById("studio-search")?.focus(), 0);
      }
      if (meta && event.key === "1") {
        event.preventDefault();
        useStudio.getState().setWorkspace("library");
      }
      if (meta && event.key === "2") {
        event.preventDefault();
        useStudio.getState().setWorkspace("compare");
      }
      if (meta && event.key === "3") {
        event.preventDefault();
        useStudio.getState().setWorkspace("lineage");
      }
      if (event.key === "Escape" && useStudio.getState().query) {
        useStudio.getState().setQuery("");
      }
      if (meta && event.key.toLowerCase() === "z" && !event.shiftKey) {
        if (isTypingTarget(event)) return;
        if (useStudio.getState().selectionUndo.length === 0) return;
        event.preventDefault();
        useStudio.getState().undoSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#1c1c1e]">
      <Toolbar />
      <Tutorial />
      <div className="flex min-h-0 flex-1 pt-[52px]">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col bg-[#161617]">
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 overflow-hidden">
              {workspace === "library" ? <LibraryScreen /> : null}
              {workspace === "compare" ? <CompareScreen /> : null}
              {workspace === "lineage" ? <LineageScreen /> : null}
            </main>
            <Inspector />
          </div>
          <SelectionTray />
        </div>
      </div>
    </div>
  );
}

function isTypingTarget(event: KeyboardEvent) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable=true]"));
}
