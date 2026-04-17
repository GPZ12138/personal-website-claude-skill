# Demo site — "Alex Morgan"

**This is a fabricated demonstration of what the `personal-website-for-ai-researcher` skill produces.** Nothing in it corresponds to a real person.

- **Name, affiliations, publications, benchmarks, honors — all invented.**
- The avatar is a monochrome geometric identicon, not a real photo.
- The Scholar JSON is hand-written and does not sync to a real Google Scholar profile.
- Links to `example.com` / `#` are deliberate placeholders.

## Why a fabricated persona

So the demo doesn't depend on — or leak — anyone's real identity. The example in the main `README.md` references the screenshots generated from this directory; if the project grows, contributors can add their own real examples to `examples/community/` without me needing to ship a personal page here.

## Running this demo locally

```bash
cd examples/demo-site
python3 -m http.server 8080
# visit http://localhost:8080
```

## Regenerating the README assets

The top-level `scripts/record_demo.mjs` points at this directory (via `http://localhost:8080`) to produce:

- `examples/screenshots/demo.gif`
- `examples/screenshots/desktop-light.png`
- `examples/screenshots/desktop-dark.png`
- `examples/screenshots/mobile-portrait.png`

See the top-level `scripts/` folder for the exact commands.
