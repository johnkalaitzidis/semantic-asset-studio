import type { AssetRecord, TaxonomyRole } from "../shared/types";
import { formatRecipeText } from "./recipe";

export function tokenizeQuery(query: string) {
  return [...query.matchAll(/"[^"]+"|[^\s]+/g)]
    .map((match) => match[0].replaceAll('"', "").trim())
    .filter(Boolean);
}

export function assetMatchesTokens(asset: AssetRecord, tokens: string[]) {
  if (tokens.length === 0) return true;
  const haystack = [
    asset.prompt,
    asset.negativePrompt,
    asset.filename,
    asset.model,
    asset.sampler,
    asset.seed,
    asset.source,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return tokens.every((token) => haystack.includes(token.toLowerCase()));
}

export type TrayGroup = {
  familyId: string;
  items: AssetRecord[];
  unlinked: boolean;
};

export function buildTrayGroups(selected: AssetRecord[]): TrayGroup[] {
  const byFamily = new Map<string, AssetRecord[]>();
  for (const asset of selected) {
    const list = byFamily.get(asset.familyId) ?? [];
    list.push(asset);
    byFamily.set(asset.familyId, list);
  }

  const related: TrayGroup[] = [];
  const unlinked: AssetRecord[] = [];
  const familyCount = byFamily.size;

  for (const [familyId, items] of byFamily) {
    const ordered = [...items].sort((a, b) => a.mtime - b.mtime);
    if (familyCount > 1 && items.length === 1) unlinked.push(...ordered);
    else related.push({ familyId, items: ordered, unlinked: false });
  }

  related.sort((a, b) => b.items.length - a.items.length);
  if (unlinked.length > 0) {
    related.push({ familyId: "unlinked", items: unlinked, unlinked: true });
  }
  return related;
}

export function trayRoleFor(asset: AssetRecord, group: TrayGroup): TaxonomyRole {
  if (group.unlinked) return "unlinked";
  return asset.role;
}

export type DiffToken = {
  text: string;
  kind: "same" | "add" | "remove";
};

function tokenizePrompt(prompt: string) {
  return prompt.split(/(\s+|,)/).filter((part) => part.length > 0);
}

export function diffPrompts(from: string, to: string) {
  const a = tokenizePrompt(from);
  const b = tokenizePrompt(to);
  const lcs = longestCommonSubsequence(a, b);
  const fromTokens: DiffToken[] = [];
  const toTokens: DiffToken[] = [];
  let i = 0;
  let j = 0;
  for (const word of lcs) {
    while (i < a.length && a[i] !== word) {
      fromTokens.push({ text: a[i], kind: "remove" });
      i += 1;
    }
    while (j < b.length && b[j] !== word) {
      toTokens.push({ text: b[j], kind: "add" });
      j += 1;
    }
    fromTokens.push({ text: word, kind: "same" });
    toTokens.push({ text: word, kind: "same" });
    i += 1;
    j += 1;
  }
  while (i < a.length) {
    fromTokens.push({ text: a[i], kind: "remove" });
    i += 1;
  }
  while (j < b.length) {
    toTokens.push({ text: b[j], kind: "add" });
    j += 1;
  }
  return { fromTokens, toTokens };
}

function longestCommonSubsequence(a: string[], b: string[]) {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const sequence: string[] = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      sequence.push(a[i - 1]);
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) i -= 1;
    else j -= 1;
  }
  return sequence.reverse();
}

export function summarizePromptDiff(from: string, to: string) {
  const { fromTokens, toTokens } = diffPrompts(from, to);
  const compact = (tokens: DiffToken[]) =>
    tokens
      .filter((token) => token.text.trim() && token.text !== ",")
      .map((token) => token.text);
  return {
    removed: compact(fromTokens.filter((token) => token.kind === "remove")),
    added: compact(toTokens.filter((token) => token.kind === "add")),
  };
}

export function numericDrift(base: AssetRecord, other: AssetRecord) {
  const fields = [
    { key: "cfg", label: "Guidance Scale", a: base.cfg, b: other.cfg },
    { key: "steps", label: "Steps", a: base.steps, b: other.steps },
    { key: "seed", label: "Seed", a: base.seed, b: other.seed },
    { key: "sampler", label: "Sampler", a: base.sampler, b: other.sampler },
    { key: "model", label: "Model", a: base.model, b: other.model },
  ] as const;
  return fields.map((field) => ({
    ...field,
    changed: String(field.a ?? "—") !== String(field.b ?? "—"),
  }));
}

export function lineageTrack(asset: AssetRecord): "foundation" | "refinement" {
  if (asset.role === "variant") return "refinement";
  if (asset.role === "ancestry") return "foundation";
  if (/smile|expression|looking slightly/i.test(asset.prompt)) return "refinement";
  return "foundation";
}

export function assetImageSrc(asset: AssetRecord) {
  if (asset.thumbnailUrl) return asset.thumbnailUrl;
  if (asset.path.startsWith("demo://")) return "";
  return `sas://local/file?path=${encodeURIComponent(asset.path)}&thumb=1`;
}

export function assetFullSrc(asset: AssetRecord) {
  if (asset.thumbnailUrl) return asset.thumbnailUrl;
  if (asset.path.startsWith("demo://")) return "";
  return `sas://local/file?path=${encodeURIComponent(asset.path)}`;
}

export function sourceLabel(source: string) {
  if (source === "a1111") return "Automatic1111";
  if (source === "fooocus") return "Fooocus";
  if (source === "comfy") return "ComfyUI";
  if (source === "demo") return "Demo";
  return "Unknown";
}

export function displayRole(asset: AssetRecord, familySize: number): TaxonomyRole {
  if (familySize <= 1) return "unlinked";
  return asset.role;
}

export function recipeText(asset: AssetRecord) {
  return formatRecipeText(asset).trim();
}
