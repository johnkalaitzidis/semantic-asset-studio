import type { AssetRecord } from "../shared/types";

function svgThumb(opts: {
  sky: string;
  sky2: string;
  hair: string;
  skin: string;
  cloth: string;
  accent: string;
  title: string;
  accessory?: "none" | "sword" | "coat" | "smile";
}) {
  const accessory =
    opts.accessory === "sword"
      ? `<rect x="292" y="210" width="10" height="210" rx="3" fill="${opts.accent}"/><rect x="278" y="198" width="38" height="14" rx="3" fill="#d9d4c8"/>`
      : opts.accessory === "coat"
        ? `<path d="M92 340 C120 290 280 290 308 340 L330 560 L70 560 Z" fill="${opts.accent}" opacity=".9"/>`
        : "";
  const mouth =
    opts.accessory === "smile"
      ? `<path d="M176 262 C190 276 210 276 224 262" fill="none" stroke="#c45c62" stroke-width="6" stroke-linecap="round"/>`
      : `<path d="M184 266 H216" fill="none" stroke="#c45c62" stroke-width="5" stroke-linecap="round"/>`;

  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${opts.sky}"/>
        <stop offset="100%" stop-color="${opts.sky2}"/>
      </linearGradient>
    </defs>
    <rect width="400" height="560" fill="url(#g)"/>
    <ellipse cx="200" cy="430" rx="130" ry="36" fill="#000" opacity=".18"/>
    <rect x="132" y="318" width="136" height="180" rx="48" fill="${opts.cloth}"/>
    ${accessory}
    <circle cx="200" cy="208" r="78" fill="${opts.skin}"/>
    <path d="M118 214 C128 108 272 100 284 220 C250 150 150 150 118 214Z" fill="${opts.hair}"/>
    <circle cx="176" cy="214" r="7" fill="#2b241f"/>
    <circle cx="224" cy="214" r="7" fill="#2b241f"/>
    ${mouth}
    <text x="24" y="40" fill="white" font-size="13" font-family="ui-sans-serif, system-ui" opacity=".72">${opts.title}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

const ancestryPrompt =
  "anime girl, long dark hair, studio lighting, character sheet, clean lineart, looking at viewer, detailed eyes, soft rim light";

export const demoAssets: AssetRecord[] = [
  {
    id: "demo-ancestry",
    path: "demo://mira-base",
    filename: "mira_base_seed441829.png",
    mtime: Date.parse("2026-03-12T10:00:00"),
    prompt: ancestryPrompt,
    negativePrompt: "blurry, extra fingers, watermark, lowres",
    seed: "441829",
    steps: 30,
    cfg: 7,
    sampler: "Euler a",
    model: "animaPencil-XL",
    size: "832x1216",
    width: 832,
    height: 1216,
    source: "demo",
    familyId: "seed:441829",
    role: "ancestry",
    thumbnailUrl: svgThumb({
      sky: "#8fb7d6",
      sky2: "#44546c",
      hair: "#241910",
      skin: "#f0cfb6",
      cloth: "#5b6e8a",
      accent: "#d9c4a3",
      title: "Ancestry",
    }),
  },
  {
    id: "demo-branch-weapon",
    path: "demo://mira-katana",
    filename: "mira_katana_seed441829.png",
    mtime: Date.parse("2026-03-12T10:18:00"),
    prompt: `${ancestryPrompt}, holding a katana, leather scabbard`,
    negativePrompt: "blurry, extra fingers, watermark, lowres",
    seed: "441829",
    steps: 30,
    cfg: 7,
    sampler: "Euler a",
    model: "animaPencil-XL",
    size: "832x1216",
    source: "demo",
    familyId: "seed:441829",
    parentId: "demo-ancestry",
    role: "branch",
    thumbnailUrl: svgThumb({
      sky: "#7ea0c4",
      sky2: "#334258",
      hair: "#241910",
      skin: "#f0cfb6",
      cloth: "#4d5d74",
      accent: "#c9d0d8",
      title: "Branch",
      accessory: "sword",
    }),
  },
  {
    id: "demo-branch-winter",
    path: "demo://mira-winter",
    filename: "mira_wintercoat_seed441829.png",
    mtime: Date.parse("2026-03-12T10:26:00"),
    prompt: `${ancestryPrompt}, winter coat, snow atmosphere, breath vapor`,
    negativePrompt: "blurry, extra fingers, watermark, lowres",
    seed: "441829",
    steps: 32,
    cfg: 7,
    sampler: "Euler a",
    model: "animaPencil-XL",
    size: "832x1216",
    source: "demo",
    familyId: "seed:441829",
    parentId: "demo-ancestry",
    role: "branch",
    thumbnailUrl: svgThumb({
      sky: "#c5d5e4",
      sky2: "#6d8094",
      hair: "#241910",
      skin: "#f0cfb6",
      cloth: "#ece7df",
      accent: "#b9c7d4",
      title: "Branch",
      accessory: "coat",
    }),
  },
  {
    id: "demo-variant-cfg",
    path: "demo://mira-cfg4",
    filename: "mira_base_cfg4_seed441829.png",
    mtime: Date.parse("2026-03-12T11:02:00"),
    prompt: ancestryPrompt,
    negativePrompt: "blurry, extra fingers, watermark, lowres",
    seed: "441829",
    steps: 30,
    cfg: 4,
    sampler: "Euler a",
    model: "animaPencil-XL",
    size: "832x1216",
    source: "demo",
    familyId: "seed:441829",
    parentId: "demo-ancestry",
    role: "variant",
    thumbnailUrl: svgThumb({
      sky: "#9cc0dc",
      sky2: "#51657c",
      hair: "#2a1d12",
      skin: "#f3d3ba",
      cloth: "#6a7c96",
      accent: "#d9c4a3",
      title: "Variant",
    }),
  },
  {
    id: "demo-variant-steps",
    path: "demo://mira-steps40",
    filename: "mira_base_steps40_seed441829.png",
    mtime: Date.parse("2026-03-12T11:10:00"),
    prompt: ancestryPrompt,
    negativePrompt: "blurry, extra fingers, watermark, lowres",
    seed: "441829",
    steps: 40,
    cfg: 7,
    sampler: "Euler a",
    model: "animaPencil-XL",
    size: "832x1216",
    source: "demo",
    familyId: "seed:441829",
    parentId: "demo-variant-cfg",
    role: "variant",
    thumbnailUrl: svgThumb({
      sky: "#87b0d2",
      sky2: "#3e5168",
      hair: "#1f160f",
      skin: "#eec9b0",
      cloth: "#53657e",
      accent: "#d9c4a3",
      title: "Variant",
    }),
  },
  {
    id: "demo-branch-smile",
    path: "demo://mira-smile",
    filename: "mira_smile_seed441829.png",
    mtime: Date.parse("2026-03-12T12:40:00"),
    prompt: `${ancestryPrompt}, gentle smile, looking slightly left`,
    negativePrompt: "blurry, extra fingers, watermark, lowres",
    seed: "441829",
    steps: 30,
    cfg: 7.5,
    sampler: "DPM++ 2M",
    model: "animaPencil-XL",
    size: "832x1216",
    source: "demo",
    familyId: "seed:441829",
    parentId: "demo-ancestry",
    role: "branch",
    thumbnailUrl: svgThumb({
      sky: "#f0c7b0",
      sky2: "#8a5d5a",
      hair: "#241910",
      skin: "#f0cfb6",
      cloth: "#7a4e4a",
      accent: "#e8d5c4",
      title: "Branch",
      accessory: "smile",
    }),
  },
  {
    id: "demo-unlinked",
    path: "demo://shrine",
    filename: "shrine_night_seed99811.png",
    mtime: Date.parse("2026-03-10T16:12:00"),
    prompt: "night shrine, stone lanterns, cherry blossom petals, cinematic wide shot, fog",
    negativePrompt: "people, text, watermark",
    seed: "99811",
    steps: 28,
    cfg: 6,
    sampler: "Euler a",
    model: "animaPencil-XL",
    size: "1216x832",
    source: "demo",
    familyId: "seed:99811",
    role: "ancestry",
    thumbnailUrl: svgThumb({
      sky: "#1a1630",
      sky2: "#4a3a58",
      hair: "#6d5a78",
      skin: "#9d8eaa",
      cloth: "#2c2438",
      accent: "#e7b7c8",
      title: "Unlinked",
    }),
  },
];
