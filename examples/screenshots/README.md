# Screenshots

All captures in this directory were generated from the live, deployed site [gpz12138.github.io](https://gpz12138.github.io) — which was itself built end-to-end by the `personal-website-for-ai-researcher` skill in a single Claude Code rollout from one resume PDF.

| File | Size | Notes |
|---|---|---|
| `demo.gif` | ~9 MB | 720 px wide, 12 fps scroll-through |
| `desktop-light.png` | 1440×900 @ 2× | Default light mode |
| `desktop-dark.png` | 1440×900 @ 2× | Dark mode, same layout |
| `mobile-portrait.png` | 390×844 @ 2× | iPhone-width breakpoint |

## To regenerate

```bash
cd scripts
npm install              # installs playwright locally
npx playwright install chromium
node record_demo.mjs     # → PNGs + scripts/recordings/*.webm
bash webm2gif.sh         # → demo.gif
```

Environment overrides for the GIF step:

```bash
FPS=10 WIDTH=600 bash webm2gif.sh    # smaller file
FPS=20 WIDTH=960 bash webm2gif.sh    # smoother / larger
```
