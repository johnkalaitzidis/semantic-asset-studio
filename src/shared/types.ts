export type AssetSource = "fooocus" | "a1111" | "comfy" | "unknown" | "demo";

export type TaxonomyRole = "ancestry" | "branch" | "variant" | "unlinked";

export type WorkspaceId = "library" | "compare" | "lineage";

export type AssetRecord = {
  id: string;
  path: string;
  filename: string;
  mtime: number;
  width?: number;
  height?: number;
  prompt: string;
  negativePrompt: string;
  seed?: string;
  steps?: number;
  cfg?: number;
  sampler?: string;
  model?: string;
  size?: string;
  source: AssetSource;
  familyId: string;
  parentId?: string;
  role: Exclude<TaxonomyRole, "unlinked">;
  thumbnailUrl?: string;
};

export type RecipeFields = {
  prompt: string;
  negativePrompt: string;
  seed?: string;
  steps?: number;
  cfg?: number;
  sampler?: string;
  model?: string;
  size?: string;
};

export type ScanProgress = {
  done: number;
  total: number;
  folder: string;
};

export type AppPersistState = {
  lastFolder: string | null;
};

export type SasApi = {
  pickFolder: () => Promise<string | null>;
  scanFolder: (folder: string) => Promise<AssetRecord[]>;
  getPersistedFolder: () => Promise<string | null>;
  getExampleLibrary: () => Promise<string | null>;
  revealInFolder: (filePath: string) => Promise<void>;
  windowControl: (action: "minimize" | "maximize" | "close") => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  writeRecipe: (imagePath: string, recipe: RecipeFields) => Promise<{ jsonPath: string; txtPath: string }>;
  onScanProgress: (handler: (progress: ScanProgress) => void) => () => void;
  onAssetsUpdated: (handler: (assets: AssetRecord[]) => void) => () => void;
};
