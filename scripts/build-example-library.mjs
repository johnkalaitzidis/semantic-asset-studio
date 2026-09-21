import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve("AI generated Characters");
const destRoot = path.resolve("example-library");

const negative = "blurry, extra fingers, watermark, lowres, deformed, text artifacts";

function a1111({
  prompt,
  steps,
  cfg,
  seed,
  sampler = "Euler a",
  model,
  size = "832x1216",
}) {
  return `${prompt}
Negative prompt: ${negative}
Steps: ${steps}, Sampler: ${sampler}, CFG scale: ${cfg}, Seed: ${seed}, Size: ${size}, Model: ${model}`;
}

const entries = [
  {
    src: "21ac04c5-1156-4430-844b-9350eeb63f7d.jpeg",
    dest: "neon-district/kira_ancestry_tactical.jpeg",
    meta: a1111({
      prompt:
        "cyberpunk woman, neon night city, pale skin, dark braids, shaved side, purple eyes, leather tactical jacket, glowing C patch, utility belt, cinematic rim light",
      steps: 30,
      cfg: 7,
      seed: "207441",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "b5224f7026847a56a5d1ebfcd6eef2a1.jpg",
    dest: "neon-district/kira_variant_mech_arm.jpg",
    meta: a1111({
      prompt:
        "cyberpunk woman, neon night city, pale skin, dark braids, shaved side, purple eyes, leather tactical jacket, glowing C patch, utility belt, cinematic rim light",
      steps: 40,
      cfg: 4,
      seed: "207441",
      sampler: "DPM++ 2M",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "196a0c1f-c928-4706-a074-ad8312e44bda.jpeg",
    dest: "neon-district/kira_branch_ck207.jpeg",
    meta: a1111({
      prompt:
        "cyberpunk woman, neon night city, pale skin, dark high ponytail, glowing red eyes, cyan circuit tattoos, tactical collar display 207, CK arm module, cinematic rim light",
      steps: 30,
      cfg: 7,
      seed: "207441",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "e108aa0412c6ac391936cb7271e839d9.jpg",
    dest: "neon-district/kira_branch_pigtails.jpg",
    meta: a1111({
      prompt:
        "cyberpunk woman, neon night city, pink pigtails, black biker jacket, rain-slick street, LUCK neon sign, wrist computer, cinematic rim light",
      steps: 28,
      cfg: 6.5,
      seed: "207441",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "du_q90_m1.jpg",
    dest: "neon-district/kira_branch_mint.jpg",
    meta: a1111({
      prompt:
        "cyberpunk woman, neon night city, mint green hair, silver techwear jacket, black pleated skirt, MINT ID badge, dusk skyline, cinematic rim light",
      steps: 32,
      cfg: 7,
      seed: "207441",
      model: "realisticVision-v6",
    }),
  },
  {
    src: "0afd1851-9c02-4e71-944b-86b5e9151380.jpeg",
    dest: "pink-city/hina_ancestry_glasses.jpeg",
    meta: a1111({
      prompt:
        "anime girl, long neon pink hair, hime cut, round gold glasses, city skyline reflection in lenses, black turtleneck, star earrings, bokeh night",
      steps: 30,
      cfg: 7,
      seed: "884201",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "11f63720-62e4-4159-7372-54b3a04dd600.png",
    dest: "pink-city/hina_branch_angel.png",
    meta: a1111({
      prompt:
        "anime girl, short bubblegum pink hair, odango buns, peace sign, black hoodie, white tennis skirt, halo, small white wings, sunny sky",
      steps: 30,
      cfg: 7,
      seed: "884201",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "041f4589-944a-44a5-b6c4-603199b05e00.png",
    dest: "aurelia/aurelia_ancestry_garden.png",
    meta: a1111({
      prompt:
        "anime girl, long blonde hair, side braid with white ribbons, white sundress, garden twilight, lens flare, profile view, serene lighting",
      steps: 32,
      cfg: 6,
      seed: "441829",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "67aed9cd-0e73-49dd-e27c-f6ccc7532c00.png",
    dest: "aurelia/aurelia_branch_ornate.png",
    meta: a1111({
      prompt:
        "anime girl, windswept blonde hair, gold flower hairpiece, ornate white and gold fantasy dress, liquid ink splashes, dramatic lighting",
      steps: 36,
      cfg: 7.5,
      seed: "441829",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "a72c85b7-fe3b-4322-bb7d-eb4c94b739a1.jpeg",
    dest: "moonlight-river/yume_ancestry_boat.jpeg",
    meta: a1111({
      prompt:
        "night river, woman in dark kimono, hair buns, wooden boat, pagoda, cherry blossoms, full moon, ink wash atmosphere, sage green",
      steps: 28,
      cfg: 5.5,
      seed: "990011",
      model: "animaPencil-XL",
      size: "768x1152",
    }),
  },
  {
    src: "G256RQJ19JXBP0S4H70RAHP6Z0.jpg",
    dest: "moonlight-river/yume_branch_pagoda.jpg",
    meta: a1111({
      prompt:
        "night lake, woman in flowing robe on rocky shore, pagoda on cliff, giant full moon, pine and sakura, watercolor japanese aesthetic",
      steps: 30,
      cfg: 6,
      seed: "990011",
      model: "animaPencil-XL",
      size: "768x1152",
    }),
  },
  {
    src: "4075f594-e58b-4d8a-b152-b04583de9e00.png",
    dest: "urban-slice/nori_ancestry_winter.png",
    meta: a1111({
      prompt:
        "anime girl, short black hair, looking over shoulder, black fur-hood winter coat, crowded tokyo street, shop banners, daylight",
      steps: 30,
      cfg: 7,
      seed: "112233",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "4222acf8921d6f4ff986a324a7650b65.jpg",
    dest: "urban-slice/nori_branch_portrait.jpg",
    meta: a1111({
      prompt:
        "anime girl, messy black hair, hands in hair, white ruffled blouse, seigaiha wave pattern background, pensive expression",
      steps: 28,
      cfg: 7,
      seed: "112233",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "98125847-17fc-4c6d-9c70-c193db6bc242.jpeg",
    dest: "urban-slice/nori_branch_wheatfield.jpeg",
    meta: a1111({
      prompt:
        "anime girl, short black hair, white shirt rolled sleeves, backpack, satchel, golden wheat field, towering purple storm clouds",
      steps: 34,
      cfg: 7,
      seed: "112233",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "725c0b69-6ce4-4829-b3d2-8ce36e8a7777.png",
    dest: "wayco-ops/rex_ancestry_street.png",
    meta: a1111({
      prompt:
        "cyberpunk man, beard, red neon glasses, WAYCO jacket patch, over-ear headphones, neon pink cyan street bokeh, night portrait",
      steps: 30,
      cfg: 7,
      seed: "778899",
      model: "realisticVision-v6",
    }),
  },
  {
    src: "e368e9324bea0c684ce8bbafd67ff998.png",
    dest: "wayco-ops/rex_branch_cockpit.png",
    meta: a1111({
      prompt:
        "cyberpunk man, white visor helmet, red glow, hooded parka, cockpit interior, handheld device, cyan ceiling light, cinematic",
      steps: 32,
      cfg: 6,
      seed: "778899",
      model: "realisticVision-v6",
    }),
  },
  {
    src: "10b82e20-6db1-4dce-b1ce-5ed6702fea00.png",
    dest: "wayco-ops/rex_branch_rooftop.png",
    meta: a1111({
      prompt:
        "anime man, messy black hair, black coat, rooftop railing, autumn city sunset, golden hour, contemplative profile",
      steps: 30,
      cfg: 7,
      seed: "778899",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "220b633a-f3f5-47d7-4f82-c94ea7446600.png",
    dest: "unlinked/sora_control_room.png",
    meta: a1111({
      prompt:
        "anime girl, navy twin tails, blue highlights, techwear jacket, glowing chest emblem, futuristic control room, orange monitors",
      steps: 30,
      cfg: 7,
      seed: "330001",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "593a662731ad192bf046baed8b702213.jpg",
    dest: "unlinked/seraph_gold_eyes.jpg",
    meta: a1111({
      prompt:
        "close-up anime portrait, white silver hair, luminous gold eyes, round glasses, black glove shushing pose, black feathers, gold sparks",
      steps: 40,
      cfg: 8,
      seed: "550012",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "84e77f88-b497-4de2-aab7-a1b8ec1e5e00.png",
    dest: "unlinked/hana_flower_field.png",
    meta: a1111({
      prompt:
        "anime girl, very long black hair, amber eyes, white dress, yellow wildflowers, looking over shoulder, bright summer sky",
      steps: 30,
      cfg: 6,
      seed: "660044",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "c713f141-b501-4db4-8827-fd55b1f9ec79.png",
    dest: "unlinked/riven_urban_sword.png",
    meta: a1111({
      prompt:
        "anime girl, short black hair crimson tips, sitting against tiled wall, straight sword, red wraps, olive bomber jacket, combat boots",
      steps: 32,
      cfg: 7,
      seed: "770055",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "e3f71d9c-752e-455c-a64a-4a3604296e3c.jpeg",
    dest: "unlinked/shiro_peony_kimono.jpeg",
    meta: a1111({
      prompt:
        "anime portrait, long white hair, green eyes, red peonies, black floral kimono, magenta background, high contrast graphic style",
      steps: 28,
      cfg: 7,
      seed: "880066",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "12f3fb46-701a-4ad2-b4cc-d944f1ef6bb0.jpeg",
    dest: "unlinked/outpost_diorama.jpeg",
    meta: a1111({
      prompt:
        "sci-fi planetary outpost diorama, orange rocky terrain, retro CRT station, tiny explorers, multi-moon sky, tilt-shift miniature",
      steps: 30,
      cfg: 5,
      seed: "101001",
      model: "animaPencil-XL",
      size: "768x1152",
    }),
  },
  {
    src: "8a35abbf-5472-45b2-ba9d-4a114895935b.jpeg",
    dest: "unlinked/crimson_canyon.jpeg",
    meta: a1111({
      prompt:
        "dystopian canyon street, glowing red sky, lava stream, ruined neon, one-point perspective, hostile sci-fi wasteland",
      steps: 26,
      cfg: 6,
      seed: "101002",
      model: "animaPencil-XL",
      size: "768x1152",
    }),
  },
  {
    src: "e02a1941-5930-488e-9ed8-f2bbcb1c67da.jpeg",
    dest: "unlinked/flooded_canal.jpeg",
    meta: a1111({
      prompt:
        "flooded ivy street, wooden houses, lily pads, lone rowboat, god rays, golden hour, nature reclaimed canal",
      steps: 28,
      cfg: 5.5,
      seed: "101003",
      model: "animaPencil-XL",
      size: "768x1152",
    }),
  },
];

await fs.rm(destRoot, { recursive: true, force: true });

let index = 0;
for (const entry of entries) {
  const from = path.join(root, entry.src);
  const to = path.join(destRoot, entry.dest);
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
  const stamped = Math.floor(Date.parse("2026-03-12T10:00:00Z") / 1000) + index * 90;
  await fs.utimes(to, stamped, stamped);
  const sidecar = to.replace(/\.[^.]+$/, ".txt");
  await fs.writeFile(sidecar, entry.meta, "utf8");
  console.log(entry.dest);
  index += 1;
}

const seedRoot = path.resolve("seed-assets");
const extras = [
  {
    src: "kira/kira_branch_katana.png",
    dest: "neon-district/kira_branch_katana.png",
    meta: a1111({
      prompt:
        "cyberpunk woman, neon night city, pale skin, dark braids, shaved side, purple eyes, leather tactical jacket, glowing C patch, utility belt, cinematic rim light, holding a katana, leather scabbard",
      steps: 30,
      cfg: 7,
      seed: "207441",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "kira/kira_branch_winter.png",
    dest: "neon-district/kira_branch_winter.png",
    meta: a1111({
      prompt:
        "cyberpunk woman, neon night city, pale skin, dark braids, shaved side, purple eyes, winter coat, fur hood, snow atmosphere, breath vapor, cinematic rim light",
      steps: 32,
      cfg: 7,
      seed: "207441",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "kira/kira_branch_smile.png",
    dest: "neon-district/kira_branch_smile.png",
    meta: a1111({
      prompt:
        "cyberpunk woman, neon night city, pale skin, dark braids, shaved side, purple eyes, leather tactical jacket, glowing C patch, utility belt, cinematic rim light, gentle smile, looking slightly left",
      steps: 30,
      cfg: 7,
      seed: "207441",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "kira/kira_branch_hoodie.png",
    dest: "neon-district/kira_branch_hoodie.png",
    meta: a1111({
      prompt:
        "cyberpunk woman, neon night city, pale skin, dark braids, shaved side, purple eyes, red hoodie, casual streetwear, cinematic rim light",
      steps: 30,
      cfg: 7,
      seed: "207441",
      model: "animaPencil-XL",
    }),
  },
  {
    src: "kira/kira_branch_rooftop.png",
    dest: "neon-district/kira_branch_rooftop.png",
    meta: a1111({
      prompt:
        "cyberpunk woman, neon night city, pale skin, dark braids, shaved side, purple eyes, leather tactical jacket, glowing C patch, utility belt, cinematic rim light, rooftop, golden hour, city skyline below",
      steps: 30,
      cfg: 7.5,
      seed: "207441",
      model: "animaPencil-XL",
    }),
  },
];

for (const entry of extras) {
  const from = path.join(seedRoot, entry.src);
  const to = path.join(destRoot, entry.dest);
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
  const stamped = Math.floor(Date.parse("2026-03-12T10:00:00Z") / 1000) + index * 90;
  await fs.utimes(to, stamped, stamped);
  await fs.writeFile(to.replace(/\.[^.]+$/, ".txt"), entry.meta, "utf8");
  console.log(entry.dest);
  index += 1;
}

await fs.writeFile(
  path.join(destRoot, "README.txt"),
  "Example generation library for Semantic Asset Studio.\nEach image has a matching .txt sidecar in Automatic1111 parameter format.\nFamilies share a seed; branches change prompt tokens; variants keep the prompt and shift CFG/steps.\n",
  "utf8",
);

console.log(`Wrote ${entries.length + extras.length} assets to ${destRoot}`);
