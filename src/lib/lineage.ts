import type { AssetRecord, RecipeFields } from "../shared/types";

export function normalizePrompt(prompt: string) {
  return prompt
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s,]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function stripLineage(asset: AssetRecord): Omit<AssetRecord, "familyId" | "role" | "parentId"> {
  return {
    id: asset.id,
    path: asset.path,
    filename: asset.filename,
    mtime: asset.mtime,
    width: asset.width,
    height: asset.height,
    prompt: asset.prompt,
    negativePrompt: asset.negativePrompt,
    seed: asset.seed,
    steps: asset.steps,
    cfg: asset.cfg,
    sampler: asset.sampler,
    model: asset.model,
    size: asset.size,
    source: asset.source,
    thumbnailUrl: asset.thumbnailUrl,
  };
}

export function assignLineage(assets: Array<Omit<AssetRecord, "familyId" | "role" | "parentId">>): AssetRecord[] {
  const families = new Map<string, typeof assets>();

  for (const asset of assets) {
    const familyId =
      asset.seed && asset.seed !== "-1" && asset.seed !== "0"
        ? `seed:${asset.seed}`
        : asset.prompt
          ? `prompt:${hashString(normalizePrompt(asset.prompt).split(/\s+/).slice(0, 14).join(" "))}`
          : `file:${asset.id}`;
    const list = families.get(familyId) ?? [];
    list.push(asset);
    families.set(familyId, list);
  }

  const result: AssetRecord[] = [];
  for (const [familyId, members] of families) {
    const ordered = [...members].sort((a, b) => a.mtime - b.mtime);
    const ancestryPrompt = normalizePrompt(ordered[0]?.prompt ?? "");
    const ancestryId = ordered[0]?.id;
    for (const [index, member] of ordered.entries()) {
      const samePrompt = normalizePrompt(member.prompt) === ancestryPrompt;
      const role = index === 0 ? "ancestry" : samePrompt ? "variant" : "branch";
      result.push({
        ...member,
        familyId,
        role,
        parentId: index === 0 ? undefined : ancestryId,
      });
    }
  }
  return result.sort((a, b) => b.mtime - a.mtime);
}

export function previewLineage(assets: AssetRecord[], id: string, recipe: RecipeFields): AssetRecord[] {
  return assignLineage(
    assets.map((asset) => {
      const rest = stripLineage(asset);
      if (asset.id !== id) return rest;
      return {
        ...rest,
        prompt: recipe.prompt,
        negativePrompt: recipe.negativePrompt,
        seed: recipe.seed,
        steps: recipe.steps,
        cfg: recipe.cfg,
        sampler: recipe.sampler,
        model: recipe.model,
        size: recipe.size ?? rest.size,
      };
    }),
  );
}
