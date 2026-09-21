# Semantic Asset Studio

Desktop studio for **character images you already generated** — not a generator. Open a Fooocus, Automatic1111, or ComfyUI folder and the app reads prompt, seed, CFG, sampler, and model from PNG metadata and sidecar files.

It groups related looks into a family: **Ancestry** (earliest file), **Variant** (same prompt, different settings), **Branch** (prompt changed), and **Unlinked** (no relatives yet).

![Semantic Asset Studio](build/icon.png)

## Install (Windows)

Download a release build (do not commit the `.exe` files into git — they are ~120 MB):

| File | What it is |
| --- | --- |
| `Semantic Asset Studio-Setup-0.1.0.exe` | Installer: shortcuts, Start Menu, uninstall |
| `Semantic Asset Studio-Portable-0.1.0.exe` | Run without installing |

After a local pack, those files land in `release/`.

## Run from source

Needs **Node.js 20+**.

```bash
npm install
npm run dev
```

The app opens on the **example library** in `example-library/` (25 character images with prompt/seed sidecars). Use **Open Folder** to scan your own outputs.

## Features

- **Library** — grid, token search, taxonomy filters, Selection Tray
- **Compare** — side-by-side prompt diffs (red removed / green added) and cyan numeric drift
- **Lineage** — family map from the tray
- **Inspector** — edit missing recipes; **Save recipe** writes `.txt` and `.json` next to the image
- Reads PNG metadata, sidecar `.txt` / `.json`, and Fooocus `log.html`

Shortcuts: `Ctrl+F` search, `Ctrl+1/2/3` Library / Compare / Lineage, `Ctrl+S` save recipe, `Esc` clear search.

## Build Windows apps

```bash
npm run dist:win
```

That typechecks, builds the UI, then uses [electron-builder](https://www.electron.build/) to produce the Setup installer and the portable `.exe` in `release/`.

## Upload to GitHub

1. **Do not commit** `node_modules`, `release/`, `dist/`, `AI generated Characters/`, or `seed-assets/`. `.gitignore` already excludes them.
2. Create a repo, then commit and push the source (example library stays in the tree so clones can run immediately):

```bash
git add .
git status
git commit -m "Initial public release of Semantic Asset Studio."
git branch -M main
git remote add origin https://github.com/YOUR_USER/semantic-asset-studio.git
git push -u origin main
```

3. Put the `.exe` files on a **GitHub Release**, not in the repo. GitHub rejects files over 100 MB in the tree; Releases allow larger assets.

   Tagging `v0.1.0` runs `.github/workflows/release.yml`, which builds Windows binaries and attaches them to the release.

```bash
git tag v0.1.0
git push origin v0.1.0
```

## License

MIT. See [LICENSE](LICENSE).
