import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import exifr from "exifr";
import type { AssetRecord, AssetSource, RecipeFields } from "../src/shared/types";
import { formatRecipeJson, formatRecipeText } from "../src/lib/recipe";

export const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function hashString(value: string) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function toNumber(value: string | undefined) {
  if (!value) return undefined;
  const n = Number.parseFloat(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function parseKeyValues(line: string) {
  const result: Record<string, string> = {};
  for (const part of line.split(/,(?![^(]*\))/)) {
    const index = part.indexOf(":");
    if (index < 0) continue;
    result[part.slice(0, index).trim()] = part.slice(index + 1).trim();
  }
  return result;
}

type ParsedRecipe = {
  prompt: string;
  negativePrompt: string;
  steps?: number;
  cfg?: number;
  seed?: string;
  sampler?: string;
  model?: string;
  size?: string;
  width?: number;
  height?: number;
};

export function parseGenerationText(text: string): ParsedRecipe {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r/g, "").trim();
  const lines = normalized.split("\n");
  const promptLines: string[] = [];
  let negative = "";
  let paramsLine = "";
  let mode: "prompt" | "negative" | "params" = "prompt";

  for (const line of lines) {
    if (/^negative prompt:/i.test(line)) {
      mode = "negative";
      negative = line.replace(/^negative prompt:\s*/i, "");
      continue;
    }
    if (/^(steps|sampler|cfg scale|guidance scale|seed)\s*:/i.test(line)) {
      mode = "params";
      paramsLine = line;
      continue;
    }
    if (mode === "prompt") promptLines.push(line);
    else if (mode === "negative") negative += ` ${line}`;
    else paramsLine += `, ${line}`;
  }

  const kv = parseKeyValues(paramsLine);
  const size = kv.Size || kv.size;
  const [width, height] = (size ?? "").split("x").map((v) => Number.parseInt(v, 10));

  return {
    prompt: promptLines.join("\n").trim(),
    negativePrompt: negative.trim(),
    steps: toNumber(kv.Steps),
    cfg: toNumber(kv["CFG scale"] || kv["Guidance scale"] || kv["CFG Scale"] || kv.Guidance),
    seed: kv.Seed || kv.seed,
    sampler: kv.Sampler || kv.sampler,
    model: kv.Model || kv.model,
    size,
    width: Number.isFinite(width) ? width : undefined,
    height: Number.isFinite(height) ? height : undefined,
  };
}

function extractComfyPrompt(raw: unknown): string {
  if (!raw) return "";
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const texts: string[] = [];
    const visit = (node: unknown) => {
      if (!node || typeof node !== "object") return;
      const record = node as Record<string, unknown>;
      for (const [key, value] of Object.entries(record)) {
        if (typeof value === "string" && /text|prompt|wildcard/i.test(key) && value.length > 8) {
          texts.push(value);
        } else {
          visit(value);
        }
      }
    };
    visit(parsed);
    return texts.sort((a, b) => b.length - a.length)[0] ?? "";
  } catch {
    return typeof raw === "string" ? raw : "";
  }
}

function detectSource(filename: string, keys: string[], promptJson: boolean, parameterText: string): AssetSource {
  const lower = filename.toLowerCase();
  if (promptJson) return "comfy";
  if (lower.includes("fooocus") || keys.some((k) => /fooocus/i.test(k))) return "fooocus";
  if (
    /negative prompt:|cfg scale:/i.test(parameterText) ||
    keys.some((k) => /parameters|cfg scale|negative prompt/i.test(k))
  ) {
    return "a1111";
  }
  return "unknown";
}

function overlayRecipe(base: ParsedRecipe, overlay: ParsedRecipe, mode: "replace" | "fill"): ParsedRecipe {
  if (mode === "replace") {
    return {
      prompt: overlay.prompt,
      negativePrompt: overlay.negativePrompt,
      steps: overlay.steps,
      cfg: overlay.cfg,
      seed: overlay.seed,
      sampler: overlay.sampler,
      model: overlay.model,
      size: overlay.size ?? base.size,
      width: overlay.width ?? base.width,
      height: overlay.height ?? base.height,
    };
  }
  return {
    prompt: overlay.prompt || base.prompt,
    negativePrompt: overlay.negativePrompt || base.negativePrompt,
    steps: overlay.steps ?? base.steps,
    cfg: overlay.cfg ?? base.cfg,
    seed: overlay.seed || base.seed,
    sampler: overlay.sampler || base.sampler,
    model: overlay.model || base.model,
    size: overlay.size || base.size,
    width: overlay.width ?? base.width,
    height: overlay.height ?? base.height,
  };
}

function parseSidecarJson(text: string): { recipe: ParsedRecipe; authoritative: boolean } | null {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const data = JSON.parse(trimmed) as Record<string, unknown>;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const size = typeof data.size === "string" ? data.size : undefined;
    const [width, height] = (size ?? "").split("x").map((value) => Number.parseInt(value, 10));
    const recipe: ParsedRecipe = {
      prompt: typeof data.prompt === "string" ? data.prompt : "",
      negativePrompt: typeof data.negativePrompt === "string" ? data.negativePrompt : "",
      steps: typeof data.steps === "number" ? data.steps : toNumber(typeof data.steps === "string" ? data.steps : undefined),
      cfg: typeof data.cfg === "number" ? data.cfg : toNumber(typeof data.cfg === "string" ? data.cfg : undefined),
      seed: data.seed != null && String(data.seed).trim() ? String(data.seed) : undefined,
      sampler: typeof data.sampler === "string" ? data.sampler : undefined,
      model: typeof data.model === "string" ? data.model : undefined,
      size,
      width: Number.isFinite(width) ? width : undefined,
      height: Number.isFinite(height) ? height : undefined,
    };
    const authoritative = data.sasRecipe === 1 || data.sasRecipe === true;
    if (!authoritative && data.prompt == null && data.seed == null) return null;
    return { recipe, authoritative: authoritative || data.prompt != null || data.seed != null };
  } catch {
    return null;
  }
}

async function readSidecarOverlay(filePath: string): Promise<{ recipe: ParsedRecipe; authoritative: boolean } | null> {
  const base = filePath.replace(/\.[^.]+$/, "");
  const jsonCandidates = [`${base}.json`, `${filePath}.json`];
  for (const candidate of jsonCandidates) {
    try {
      const text = await fs.readFile(candidate, "utf8");
      const parsed = parseSidecarJson(text);
      if (parsed) return parsed;
    } catch {
      /* ignore missing sidecar */
    }
  }
  const txtCandidates = [`${filePath}.txt`, `${base}.txt`];
  for (const candidate of txtCandidates) {
    try {
      const text = await fs.readFile(candidate, "utf8");
      if (text.trim()) return { recipe: parseGenerationText(text), authoritative: false };
    } catch {
      /* ignore missing sidecar */
    }
  }
  return null;
}

function asFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function sanitizeRecipe(raw: unknown): RecipeFields {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Invalid recipe");
  }
  const record = raw as Record<string, unknown>;
  const seed = typeof record.seed === "string" ? record.seed.trim() : record.seed != null ? String(record.seed).trim() : "";
  return {
    prompt: typeof record.prompt === "string" ? record.prompt : "",
    negativePrompt: typeof record.negativePrompt === "string" ? record.negativePrompt : "",
    seed: seed || undefined,
    steps: asFiniteNumber(record.steps),
    cfg: asFiniteNumber(record.cfg),
    sampler: typeof record.sampler === "string" && record.sampler.trim() ? record.sampler.trim() : undefined,
    model: typeof record.model === "string" && record.model.trim() ? record.model.trim() : undefined,
    size: typeof record.size === "string" && record.size.trim() ? record.size.trim() : undefined,
  };
}

export async function writeRecipeSidecars(imagePath: string, recipe: RecipeFields) {
  const resolved = path.resolve(imagePath);
  const ext = path.extname(resolved).toLowerCase();
  if (!IMAGE_EXT.has(ext)) throw new Error("Not an image file");
  const stat = await fs.stat(resolved);
  if (!stat.isFile()) throw new Error("Not an image file");
  const base = resolved.slice(0, resolved.length - ext.length);
  const jsonPath = `${base}.json`;
  const txtPath = `${base}.txt`;
  await fs.writeFile(jsonPath, formatRecipeJson(recipe), "utf8");
  await fs.writeFile(txtPath, formatRecipeText(recipe), "utf8");
  return { jsonPath, txtPath };
}

async function readFooocusLog(filePath: string) {
  const dir = path.dirname(filePath);
  const logPath = path.join(dir, "log.html");
  try {
    const html = await fs.readFile(logPath, "utf8");
    const stem = path.basename(filePath);
    const escaped = stem.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const block = html.match(new RegExp(`${escaped}[\\s\\S]{0,2500}`, "i"));
    if (!block) return "";
    return block[0]
      .replace(/<[^>]+>/g, "\n")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&");
  } catch {
    return "";
  }
}

export async function walkImages(root: string) {
  const files: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) files.push(full);
    }
  }
  return files;
}

export async function parseImageFile(filePath: string): Promise<Omit<AssetRecord, "familyId" | "role" | "parentId">> {
  const stat = await fs.stat(filePath);
  const buffer = await fs.readFile(filePath);
  let meta: Record<string, unknown> = {};
  try {
    meta = (await exifr.parse(buffer, {
      tiff: true,
      xmp: true,
      icc: false,
      iptc: true,
      jfif: true,
      ihdr: true,
      mergeOutput: true,
    })) as Record<string, unknown> ?? {};
  } catch {
    meta = {};
  }

  const keys = Object.keys(meta);
  const promptField = meta.prompt ?? meta.Prompt;
  const isComfy = typeof promptField === "object" || (typeof promptField === "string" && promptField.trim().startsWith("{"));
  const parameterText = [
    meta.parameters,
    meta.Parameters,
    meta.Comment,
    meta.comment,
    meta.UserComment,
    meta.Description,
    meta.ImageDescription,
    typeof promptField === "string" && !isComfy ? promptField : "",
  ]
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .join("\n");

  let parsed = parameterText ? parseGenerationText(parameterText) : {
    prompt: "",
    negativePrompt: "",
    steps: undefined,
    cfg: undefined,
    seed: undefined,
    sampler: undefined,
    model: undefined,
    size: undefined,
    width: undefined,
    height: undefined,
  };

  const sidecar = await readSidecarOverlay(filePath);
  if (sidecar) {
    parsed = overlayRecipe(parsed, sidecar.recipe, sidecar.authoritative ? "replace" : "fill");
  }

  if (!sidecar?.authoritative && !parsed.prompt && isComfy) {
    parsed = { ...parsed, prompt: extractComfyPrompt(promptField) };
  }

  if (!sidecar?.authoritative && !parsed.prompt) {
    const logText = await readFooocusLog(filePath);
    if (logText) parsed = overlayRecipe(parsed, parseGenerationText(logText), "fill");
  }

  const width = parsed.width ?? (typeof meta.ImageWidth === "number" ? meta.ImageWidth : undefined);
  const height = parsed.height ?? (typeof meta.ImageHeight === "number" ? meta.ImageHeight : undefined);
  const sourceHint = [parameterText, sidecar ? formatRecipeText(sidecar.recipe) : ""].join("\n");
  const source = detectSource(filePath, keys, Boolean(isComfy), sourceHint);

  return {
    id: hashString(filePath),
    path: filePath,
    filename: path.basename(filePath),
    mtime: stat.mtimeMs,
    width,
    height,
    prompt: parsed.prompt,
    negativePrompt: parsed.negativePrompt,
    seed: parsed.seed,
    steps: parsed.steps,
    cfg: parsed.cfg,
    sampler: parsed.sampler,
    model: parsed.model,
    size: parsed.size ?? (width && height ? `${width}x${height}` : undefined),
    source,
  };
}
