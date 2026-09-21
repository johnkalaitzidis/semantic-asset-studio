import { contextBridge, ipcRenderer } from "electron";
import type { AssetRecord, SasApi, ScanProgress } from "../src/shared/types";

const api: SasApi = {
  pickFolder: () => ipcRenderer.invoke("sas:pick-folder"),
  scanFolder: (folder: string) => ipcRenderer.invoke("sas:scan-folder", folder),
  getPersistedFolder: () => ipcRenderer.invoke("sas:get-folder"),
  getExampleLibrary: () => ipcRenderer.invoke("sas:example-library"),
  revealInFolder: (filePath: string) => ipcRenderer.invoke("sas:reveal", filePath),
  windowControl: (action) => ipcRenderer.invoke("sas:window", action),
  openExternal: (url) => ipcRenderer.invoke("sas:open-url", url),
  writeRecipe: (imagePath, recipe) => ipcRenderer.invoke("sas:write-recipe", imagePath, recipe),
  onScanProgress: (handler) => {
    const listen = (_event: unknown, progress: ScanProgress) => handler(progress);
    ipcRenderer.on("sas:scan-progress", listen);
    return () => ipcRenderer.removeListener("sas:scan-progress", listen);
  },
  onAssetsUpdated: (handler) => {
    const listen = (_event: unknown, assets: AssetRecord[]) => handler(assets);
    ipcRenderer.on("sas:assets-updated", listen);
    return () => ipcRenderer.removeListener("sas:assets-updated", listen);
  },
};

contextBridge.exposeInMainWorld("sas", api);
