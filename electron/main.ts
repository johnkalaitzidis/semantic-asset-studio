import { app, BrowserWindow, dialog, ipcMain, protocol, net, nativeImage, shell } from "electron";
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL, fileURLToPath } from "node:url";
import { watch, type FSWatcher } from "chokidar";
import { IMAGE_EXT, parseImageFile, sanitizeRecipe, walkImages, writeRecipeSidecars } from "./ingest";
import { assignLineage } from "../src/lib/lineage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!app.isPackaged) {
  app.commandLine.appendSwitch("remote-debugging-port", "9222");
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "sas",
    privileges: {
      standard: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      secure: true,
    },
  },
]);

let mainWindow: BrowserWindow | null = null;
let folderWatcher: FSWatcher | null = null;
let scanToken = 0;

function statePath() {
  return path.join(app.getPath("userData"), "studio-state.json");
}

async function readPersistedFolder() {
  try {
    const raw = await fs.promises.readFile(statePath(), "utf8");
    const lastFolder = (JSON.parse(raw) as { lastFolder?: string }).lastFolder ?? null;
    if (!lastFolder) return null;
    await fs.promises.access(lastFolder);
    return lastFolder;
  } catch {
    return null;
  }
}

async function writePersistedFolder(folder: string | null) {
  await fs.promises.mkdir(path.dirname(statePath()), { recursive: true });
  await fs.promises.writeFile(statePath(), JSON.stringify({ lastFolder: folder }, null, 2));
}

function preloadPath() {
  const candidates = [
    path.join(__dirname, "preload.cjs"),
    path.join(__dirname, "preload.js"),
    path.join(__dirname, "preload.mjs"),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

function appIconPath() {
  const candidates = [
    path.join(process.resourcesPath, "icon.png"),
    path.join(__dirname, "../build/icon.ico"),
    path.join(__dirname, "../build/icon.png"),
    path.join(process.cwd(), "build/icon.ico"),
    path.join(process.cwd(), "build/icon.png"),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function createWindow() {
  const icon = appIconPath();
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#1C1C1E",
    show: false,
    autoHideMenuBar: true,
    icon,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#1c1c1e",
      symbolColor: "#f5f5f7",
      height: 51,
    },
    webPreferences: {
      preload: preloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("console-message", (_event, _level, message, line, sourceId) => {
    if (message.includes("error") || message.includes("Error")) {
      console.error(`[renderer] ${message} (${sourceId}:${line})`);
    }
  });
  mainWindow.once("ready-to-show", () => {
    void mainWindow?.setTitleBarOverlay({
      color: "#1c1c1e",
      symbolColor: "#f5f5f7",
      height: 51,
    });
    mainWindow?.show();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function scanFolder(folder: string) {
  const token = ++scanToken;
  const files = await walkImages(folder);
  const parsed = [];
  for (let i = 0; i < files.length; i += 8) {
    if (token !== scanToken) return null;
    const slice = files.slice(i, i + 8);
    const batch = await Promise.all(slice.map(async (file) => parseImageFile(file)));
    parsed.push(...batch);
    mainWindow?.webContents.send("sas:scan-progress", {
      done: Math.min(i + slice.length, files.length),
      total: files.length,
      folder,
    });
  }
  if (token !== scanToken) return null;
  return assignLineage(parsed);
}

function isImagePath(filePath: string) {
  return IMAGE_EXT.has(path.extname(filePath).toLowerCase());
}

function watchFolder(folder: string) {
  void folderWatcher?.close();
  folderWatcher = watch(folder, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 800, pollInterval: 200 },
    depth: 6,
    ignored: (watchPath) => {
      const ext = path.extname(watchPath).toLowerCase();
      if (!ext) return false;
      return !IMAGE_EXT.has(ext);
    },
  });
  let timer: NodeJS.Timeout | null = null;
  const rescan = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void scanFolder(folder).then((assets) => {
        if (!assets) return;
        mainWindow?.webContents.send("sas:assets-updated", assets);
      });
    }, 600);
  };
  const onImageEvent = (filePath: string) => {
    if (!isImagePath(filePath)) return;
    rescan();
  };
  folderWatcher.on("add", onImageEvent);
  folderWatcher.on("change", onImageEvent);
  folderWatcher.on("unlink", onImageEvent);
}

app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("studio.semanticasset.app");
  }
  protocol.handle("sas", async (request) => {
    const url = new URL(request.url);
    const filePath = url.searchParams.get("path");
    const thumb = url.searchParams.get("thumb") === "1";
    if (!filePath) return new Response("Missing path", { status: 400 });
    try {
      if (thumb) {
        const image = nativeImage.createFromPath(filePath);
        if (image.isEmpty()) return net.fetch(pathToFileURL(filePath).href);
        const resized = image.resize({ width: 360, quality: "better" });
        return new Response(resized.toPNG(), { headers: { "content-type": "image/png" } });
      }
      return net.fetch(pathToFileURL(filePath).href);
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });

  ipcMain.handle("sas:pick-folder", async () => {
    const result = await dialog.showOpenDialog({
      title: "Choose a generation folder",
      properties: ["openDirectory"],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const folder = result.filePaths[0];
    await writePersistedFolder(folder);
    return folder;
  });

  ipcMain.handle("sas:scan-folder", async (_event, folder: string) => {
    watchFolder(folder);
    await writePersistedFolder(folder);
    return (await scanFolder(folder)) ?? [];
  });

  ipcMain.handle("sas:example-library", async () => {
    const dir = app.isPackaged
      ? path.join(process.resourcesPath, "example-library")
      : path.join(process.cwd(), "example-library");
    try {
      await fs.promises.access(dir);
      return dir;
    } catch {
      return null;
    }
  });

  ipcMain.handle("sas:get-folder", () => readPersistedFolder());

  ipcMain.handle("sas:reveal", async (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle("sas:open-url", async (_event, url: string) => {
    if (typeof url !== "string" || !/^https:\/\//i.test(url)) return;
    await shell.openExternal(url);
  });

  ipcMain.handle("sas:write-recipe", async (_event, imagePath: string, recipe: unknown) => {
    if (typeof imagePath !== "string" || imagePath.length === 0) {
      throw new Error("Invalid path");
    }
    return writeRecipeSidecars(imagePath, sanitizeRecipe(recipe));
  });

  ipcMain.handle("sas:window", (_event, action: "minimize" | "maximize" | "close") => {
    if (!mainWindow) return;
    if (action === "minimize") mainWindow.minimize();
    if (action === "maximize") {
      if (mainWindow.isMaximized()) mainWindow.unmaximize();
      else mainWindow.maximize();
    }
    if (action === "close") mainWindow.close();
  });

  createWindow();
});

app.on("window-all-closed", () => {
  void folderWatcher?.close();
  app.quit();
});
