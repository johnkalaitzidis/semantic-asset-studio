import { useMemo } from "react";
import { create } from "zustand";
import { demoAssets } from "./demo/library";
import { assetMatchesTokens, displayRole, tokenizeQuery } from "./lib/studio";
import { assignLineage, stripLineage } from "./lib/lineage";
import type { AssetRecord, AssetSource, RecipeFields, ScanProgress, TaxonomyRole, WorkspaceId } from "./shared/types";

export const TUTORIAL_STORAGE_KEY = "sas.tutorial-complete";

type StudioStore = {
  workspace: WorkspaceId;
  assets: AssetRecord[];
  folder: string | null;
  usingDemo: boolean;
  scanning: boolean;
  progress: ScanProgress | null;
  query: string;
  tokens: string[];
  selectedIds: string[];
  inspectorId: string | null;
  trayOpen: boolean;
  trayHeight: number;
  roleFilters: TaxonomyRole[];
  sourceFilters: AssetSource[];
  modelFilters: string[];
  stagedOnly: boolean;
  selectionUndo: Array<{ selectedIds: string[]; inspectorId: string | null }>;
  setWorkspace: (workspace: WorkspaceId) => void;
  setQuery: (query: string) => void;
  removeToken: (token: string) => void;
  toggleSelected: (id: string) => void;
  setSelected: (ids: string[]) => void;
  unstageAssets: (ids: string[]) => void;
  undoSelection: () => void;
  setInspector: (id: string | null) => void;
  setTrayOpen: (open: boolean) => void;
  setTrayHeight: (height: number) => void;
  toggleRoleFilter: (role: TaxonomyRole) => void;
  toggleSourceFilter: (source: AssetSource) => void;
  toggleModelFilter: (model: string) => void;
  setStagedOnly: (stagedOnly: boolean) => void;
  clearFilters: () => void;
  loadDemo: () => void;
  setFolderAssets: (folder: string, assets: AssetRecord[]) => void;
  replaceFolderAssets: (assets: AssetRecord[]) => void;
  applyRecipe: (id: string, recipe: RecipeFields) => void;
  setScanning: (scanning: boolean, progress?: ScanProgress | null) => void;
  tutorialOpen: boolean;
  tutorialStep: number;
  openTutorial: () => void;
  closeTutorial: () => void;
  setTutorialStep: (step: number) => void;
};

function toggleIn<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export const useStudio = create<StudioStore>((set, get) => ({
  workspace: "library",
  assets: demoAssets,
  folder: null,
  usingDemo: true,
  scanning: false,
  progress: null,
  query: "",
  tokens: [],
  selectedIds: ["demo-ancestry", "demo-branch-weapon", "demo-variant-cfg"],
  inspectorId: "demo-ancestry",
  trayOpen: true,
  trayHeight: 188,
  roleFilters: [],
  sourceFilters: [],
  modelFilters: [],
  stagedOnly: false,
  selectionUndo: [],
  setWorkspace: (workspace) => set({ workspace }),
  setQuery: (query) => set({ query, tokens: tokenizeQuery(query) }),
  removeToken: (token) => {
    const tokens = get().tokens.filter((item) => item !== token);
    set({ tokens, query: tokens.map((item) => (item.includes(" ") ? `"${item}"` : item)).join(" ") });
  },
  toggleSelected: (id) => {
    if (get().selectedIds.includes(id)) {
      get().unstageAssets([id]);
      return;
    }
    set({
      selectedIds: [...get().selectedIds, id],
      inspectorId: id,
    });
  },
  setSelected: (selectedIds) => set({ selectedIds }),
  unstageAssets: (ids) => {
    const remove = new Set(ids);
    const current = get().selectedIds;
    if (!current.some((id) => remove.has(id))) return;
    const selectionUndo = [
      ...get().selectionUndo.slice(-49),
      { selectedIds: [...current], inspectorId: get().inspectorId },
    ];
    const selectedIds = current.filter((id) => !remove.has(id));
    set({
      selectionUndo,
      selectedIds,
      inspectorId: selectedIds.includes(get().inspectorId ?? "")
        ? get().inspectorId
        : selectedIds.at(-1) ?? null,
    });
  },
  undoSelection: () => {
    const last = get().selectionUndo.at(-1);
    if (!last) return;
    set({
      selectionUndo: get().selectionUndo.slice(0, -1),
      selectedIds: last.selectedIds,
      inspectorId: last.inspectorId,
    });
  },
  setInspector: (inspectorId) => set({ inspectorId }),
  setTrayOpen: (trayOpen) => set({ trayOpen }),
  setTrayHeight: (trayHeight) => set({ trayHeight }),
  toggleRoleFilter: (role) => set({ roleFilters: toggleIn(get().roleFilters, role) }),
  toggleSourceFilter: (source) => set({ sourceFilters: toggleIn(get().sourceFilters, source) }),
  toggleModelFilter: (model) => set({ modelFilters: toggleIn(get().modelFilters, model) }),
  setStagedOnly: (stagedOnly) => set({ stagedOnly }),
  clearFilters: () => set({ roleFilters: [], sourceFilters: [], modelFilters: [], stagedOnly: false }),
  loadDemo: () =>
    set({
      assets: demoAssets,
      usingDemo: true,
      folder: null,
      selectedIds: ["demo-ancestry", "demo-branch-weapon", "demo-variant-cfg"],
      inspectorId: "demo-ancestry",
      selectionUndo: [],
    }),
  setFolderAssets: (folder, assets) => {
    const current = get();
    if (current.folder === folder && !current.usingDemo) {
      get().replaceFolderAssets(assets);
      return;
    }
    const preferred = assets
      .filter((asset) => /^kira_/i.test(asset.filename))
      .sort((a, b) => a.mtime - b.mtime);
    const staged = preferred.length >= 2 ? preferred : [];
    set({
      folder,
      assets,
      usingDemo: false,
      scanning: false,
      progress: null,
      selectedIds: staged.map((asset) => asset.id),
      inspectorId: staged[0]?.id ?? assets[0]?.id ?? null,
      selectionUndo: [],
    });
  },
  replaceFolderAssets: (assets) => {
    if (assets.length === 0) return;
    const current = get();
    const ids = new Set(assets.map((asset) => asset.id));
    const selectedIds = current.selectedIds.filter((id) => ids.has(id));
    const inspectorId =
      current.inspectorId && ids.has(current.inspectorId)
        ? current.inspectorId
        : (selectedIds.at(-1) ?? assets[0]?.id ?? null);
    set({
      assets,
      scanning: false,
      progress: null,
      selectedIds,
      inspectorId,
    });
  },
  applyRecipe: (id, recipe) => {
    const assets = get().assets.map((asset) =>
      asset.id === id
        ? {
            ...asset,
            prompt: recipe.prompt,
            negativePrompt: recipe.negativePrompt,
            seed: recipe.seed,
            steps: recipe.steps,
            cfg: recipe.cfg,
            sampler: recipe.sampler,
            model: recipe.model,
            size: recipe.size ?? asset.size,
          }
        : asset,
    );
    set({
      assets: assignLineage(assets.map(stripLineage)),
      inspectorId: id,
    });
  },
  setScanning: (scanning, progress = null) => set({ scanning, progress }),
  tutorialOpen: false,
  tutorialStep: 0,
  openTutorial: () => set({ tutorialOpen: true, tutorialStep: 0 }),
  closeTutorial: () => {
    try {
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "1");
    } catch {
      /* ignore quota / private mode */
    }
    set({ tutorialOpen: false });
  },
  setTutorialStep: (tutorialStep) => set({ tutorialStep }),
}));

export function useVisibleAssets() {
  const assets = useStudio((state) => state.assets);
  const tokens = useStudio((state) => state.tokens);
  const roleFilters = useStudio((state) => state.roleFilters);
  const sourceFilters = useStudio((state) => state.sourceFilters);
  const modelFilters = useStudio((state) => state.modelFilters);
  const stagedOnly = useStudio((state) => state.stagedOnly);
  const selectedIds = useStudio((state) => state.selectedIds);
  return useMemo(() => {
    const familySize = new Map<string, number>();
    for (const asset of assets) {
      familySize.set(asset.familyId, (familySize.get(asset.familyId) ?? 0) + 1);
    }
    return assets.filter((asset) => {
      if (!assetMatchesTokens(asset, tokens)) return false;
      if (stagedOnly && !selectedIds.includes(asset.id)) return false;
      if (sourceFilters.length > 0 && !sourceFilters.includes(asset.source)) return false;
      if (modelFilters.length > 0 && !modelFilters.includes(asset.model ?? "")) return false;
      if (roleFilters.length > 0) {
        const role = displayRole(asset, familySize.get(asset.familyId) ?? 1);
        if (!roleFilters.includes(role)) return false;
      }
      return true;
    });
  }, [assets, tokens, roleFilters, sourceFilters, modelFilters, stagedOnly, selectedIds]);
}

export function useSelectedAssets() {
  const assets = useStudio((state) => state.assets);
  const selectedIds = useStudio((state) => state.selectedIds);
  return useMemo(
    () =>
      selectedIds
        .map((id) => assets.find((asset) => asset.id === id))
        .filter((asset): asset is AssetRecord => Boolean(asset)),
    [assets, selectedIds],
  );
}

export function useFamilySizes() {
  const assets = useStudio((state) => state.assets);
  return useMemo(() => {
    const familySize = new Map<string, number>();
    for (const asset of assets) {
      familySize.set(asset.familyId, (familySize.get(asset.familyId) ?? 0) + 1);
    }
    return familySize;
  }, [assets]);
}
