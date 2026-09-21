import type { RecipeFields } from "../shared/types";

export function formatRecipeText(recipe: RecipeFields) {
  const lines = [recipe.prompt || ""];
  if (recipe.negativePrompt) lines.push(`Negative prompt: ${recipe.negativePrompt}`);
  const params = [
    recipe.steps != null ? `Steps: ${recipe.steps}` : null,
    recipe.sampler ? `Sampler: ${recipe.sampler}` : null,
    recipe.cfg != null ? `CFG scale: ${recipe.cfg}` : null,
    recipe.seed ? `Seed: ${recipe.seed}` : null,
    recipe.size ? `Size: ${recipe.size}` : null,
    recipe.model ? `Model: ${recipe.model}` : null,
  ].filter((item): item is string => Boolean(item));
  if (params.length > 0) lines.push(params.join(", "));
  const text = lines.join("\n").trimEnd();
  return text ? `${text}\n` : "\n";
}

export function formatRecipeJson(recipe: RecipeFields) {
  const payload: Record<string, unknown> = {
    sasRecipe: 1,
    prompt: recipe.prompt,
    negativePrompt: recipe.negativePrompt,
  };
  if (recipe.seed) payload.seed = recipe.seed;
  if (recipe.steps != null) payload.steps = recipe.steps;
  if (recipe.cfg != null) payload.cfg = recipe.cfg;
  if (recipe.sampler) payload.sampler = recipe.sampler;
  if (recipe.model) payload.model = recipe.model;
  if (recipe.size) payload.size = recipe.size;
  return `${JSON.stringify(payload, null, 2)}\n`;
}
