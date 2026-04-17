#!/usr/bin/env bash
#
# Convert the Playwright-recorded webm into a GitHub-friendly GIF,
# then drop it at examples/screenshots/demo.gif.
#
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IN="$(ls -t "$HERE/recordings/"*.webm 2>/dev/null | head -1 || true)"
OUT="$HERE/../examples/screenshots/demo.gif"

if [ -z "$IN" ]; then
    echo "No .webm file found in $HERE/recordings/. Run record_demo.mjs first." >&2
    exit 1
fi

echo "Converting $IN → $OUT"

# Two-pass for nice palette:
PALETTE="$(mktemp -t demopalette.XXXX).png"
trap 'rm -f "$PALETTE"' EXIT

FPS="${FPS:-12}"
WIDTH="${WIDTH:-720}"

ffmpeg -y -loglevel error -i "$IN" \
    -vf "fps=${FPS},scale=${WIDTH}:-1:flags=lanczos,palettegen=stats_mode=diff:max_colors=128" \
    "$PALETTE"

ffmpeg -y -loglevel error -i "$IN" -i "$PALETTE" \
    -lavfi "fps=${FPS},scale=${WIDTH}:-1:flags=lanczos [v]; [v][1:v] paletteuse=dither=bayer:bayer_scale=5" \
    -loop 0 \
    "$OUT"

echo "Wrote $OUT"
du -h "$OUT"
