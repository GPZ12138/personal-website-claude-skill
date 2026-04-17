# Engineering Specification — AI Researcher Personal Homepage

## 1. Goals & non-goals

**Goals.**

- A static, single-page homepage that loads fast on any connection.
- Zero build step. What you see in the repo is what ships.
- Deployable to GitHub Pages out of the box.
- Live Google Scholar numbers visible on every page load, without a server.
- Bilingual (EN / 中) without a separate route.
- Light / dark theme that respects the OS preference.
- Works offline (from disk / `file://`) for the author to preview.

**Non-goals.**

- No SSR framework (Next, Astro, etc.).
- No CSS framework (Tailwind / Bootstrap). No build pipeline.
- No analytics, no trackers, no cookies except `localStorage` for theme + lang.
- No CMS; text lives in the HTML.

## 2. Runtime architecture

```
┌────────────────────────┐       ┌─────────────────────────┐
│  index.html            │<──────│  styles.css             │
│  (content + i18n data) │       │  (monochrome, 1 font)   │
└─────────┬──────────────┘       └─────────────────────────┘
          │
          │  fetch('data/scholar.json')   ◄── GitHub Actions cron (daily)
          ▼                                   writes this JSON
┌────────────────────────┐       ┌─────────────────────────┐
│  script.js             │       │  scripts/fetch_scholar  │
│  - theme toggle        │       │      .py                │
│  - lang toggle         │       │  uses `scholarly` to    │
│  - nav spy             │       │  read Scholar profile   │
│  - reveal on scroll    │       │  & write scholar.json   │
│  - renders stats chart │       └─────────────────────────┘
└────────────────────────┘
```

All three client files ship as-is. The Python script only runs on GitHub's
CI and never on the client.

## 3. File responsibilities

### `index.html`

- Semantic landmarks: `<header>`, `<aside>` (sidebar), `<main>`, `<footer>`.
- Sections (`<section id="...">`): `#about`, `#news`, `#publications`,
  `#experience`, `#honors`, `#education`, `#skills`, `#contact`.
- Every translatable node carries **both** `data-en` and `data-zh`.
  Nodes whose translation contains HTML (links, `<b>`) additionally set
  `data-en-html="true"`.
- The sidebar contains the canonical contact info. Do not duplicate in the main
  column except for the `#contact` section.

### `styles.css`

- Uses CSS custom properties declared on `:root`.
- Dark theme is a single `html[data-theme="dark"]` override block — only
  rewrites variables, no component-level dark selectors.
- Layout: CSS grid (`.page`), one two-column breakpoint at 960 px.
- No `@import`s; no preprocessor.
- Versioned via `?v=N` query on the HTML `<link>` to bust cache during
  development — bump on CSS change.

### `script.js`

- IIFE, no modules. ~250 LOC. No dependencies.
- Side effects, in order:
  1. Resolve and apply theme (`localStorage`, fallback to
     `prefers-color-scheme`).
  2. Resolve and apply language (`localStorage`, default `en`).
  3. Hook buttons `#themeToggle`, `#langToggle`.
  4. Sticky-header shadow on scroll, nav spy via `IntersectionObserver`.
  5. Reveal-on-scroll for sections/rows.
  6. `fetch('data/scholar.json?v=<ts>')` (`cache: no-store`), animate
     numbers and render the yearly-citation bar chart. On failure, keep the
     hardcoded fallback already in the DOM.

### `data/scholar.json`

- Source of truth for the live stats widget.
- Contract:

  ```jsonc
  {
    "name": "<researcher's full name>",
    "affiliation": "<primary affiliation>",
    "scholar_id": "<SCHOLAR_ID>",
    "total_citations": 0,          // int
    "h_index": 0,                  // int
    "i10_index": 0,                // int
    "publications_count": 0,       // int
    "per_year": { "<year>": 0 },   // Record<string, int>
    "last_updated": "ISO 8601 UTC",
    "source": "https://scholar.google.com/citations?user=<SCHOLAR_ID>",
    "note": "..."
  }
  ```

- Never contains zeros from a failed scrape — the updater merges with the
  previous snapshot and only updates `last_updated` on failure.

### `scripts/fetch_scholar.py`

- Reads the profile for `SCHOLAR_ID` (env var, **required** — no default).
- Uses free proxies to reduce the chance of Scholar blocking CI runners.
- Writes the JSON atomically. On any exception, preserves the previous
  snapshot and bumps only `last_updated`.

### `.github/workflows/update-scholar.yml`

- Triggers: daily cron (`17 3 * * *`, UTC), manual dispatch with optional
  `force` input, push to any file
  in `scripts/` or this workflow.
- Steps: checkout → setup-python 3.11 → pip install → run script →
  commit + push if JSON changed.
- Needs `contents: write` permission; concurrency set to `update-scholar`.

## 4. Contracts between files

| From              | To                      | Contract                                         |
|-------------------|-------------------------|--------------------------------------------------|
| `index.html`      | `styles.css`            | Class names and component nesting are public API — edit both together. |
| `index.html`      | `script.js`             | Element IDs: `#site-header`, `#themeToggle`, `#langToggle`, `#impactStatus`, `#impactBars`, `#impactUpdated`, `#sideTotal`, `#sideH`, `#sidePubs`. |
| `data/scholar.json` | `script.js`          | Shape per §3; additive keys are safe, renames are breaking. |
| `fetch_scholar.py` | `data/scholar.json`   | Must round-trip through `merge_with_fallback` so zero-values never overwrite good ones. |
| Workflow          | Repo                   | Commits authored by `github-actions[bot]`; commit message is `chore(data): refresh Google Scholar snapshot`. |

## 5. Deployment

- **Target.** GitHub Pages, `main` branch, root of repo.
- **No Jekyll.** A `.nojekyll` sentinel file prevents default Jekyll
  processing (important because of `_`-prefixed names and JSON files).
- **Cache.** Pages serves static files with ~10 min CDN cache; the app
  adds `?v=N` query strings to CSS and JS links to force refresh on deploy.

## 6. Testing checklist

Manual, pre-deploy:

- [ ] Opens at `file://` without errors (no console errors except for the
      expected `CORS`-blocked Scholar fetch fallback path).
- [ ] Opens under `python3 -m http.server`, Scholar chart animates in and
      status flips to **live**.
- [ ] Dark mode toggle round-trips and persists.
- [ ] Language toggle round-trips and persists; Chinese reads cleanly (no
      stray English punctuation; no stray Chinese on the English page).
- [ ] All outbound links open new tabs with `rel="noopener"`.
- [ ] Keyboard-only navigation reaches every interactive element.
- [ ] Prefers-reduced-motion disables fades.
- [ ] Mobile (≤ 720 px): sidebar collapses above main; nav links hide into
      scroll-anchored sections; tap targets ≥ 40 px.

## 7. Accessibility

- Single `<h1>` per page (the profile name).
- Section headings `<h2>`; never skip levels.
- Skip link at top ("Skip to content").
- All interactive controls have `aria-label` or visible text.
- Color contrast meets WCAG AA in both themes.

## 8. Update playbook

- **Add a news item.** Prepend an `<li>` to `#news` with a `.ndate` chip.
- **Add a publication.** Append to `.pub-list` with the shared `.pub` grid
  pattern (venue chip on the left, body on the right).
- **Change the headshot.** Drop a new `assets/profile.jpg` — keep a portrait
  aspect ratio; CSS crops to a circle.
- **Change institution emphasis.** Only the orgs listed in `DESIGN_SPEC.md`
  §7 are bold. Adding a new bold term = update the spec first.
- **Change palette.** Edit the tokens in `:root` and the dark override in
  `styles.css`. Do not sprinkle hex values into component rules.

## 9. Known trade-offs

- Scholar scraping is fragile by nature — `scholarly` + free proxies is a
  best-effort arrangement; failures degrade to stale but-not-wrong data.
- `data-en-html` rewrites `innerHTML`. Content authors must not put
  user-controlled text into those attributes. (All content is authored by
  the page owner; this is noted only for clarity.)
- Language toggle is instant but re-parses the dataset each click. At
  current size (~60 translatable nodes), cost is negligible.
