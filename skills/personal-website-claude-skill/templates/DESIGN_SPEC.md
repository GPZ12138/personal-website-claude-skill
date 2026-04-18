# Design Specification — AI Researcher Personal Homepage

> The site exists to communicate two things in under five seconds:
> **who the researcher is** (name, photo, affiliation) and **why that
> matters** (current or incoming role, live citation impact, selected
> research). Everything else is subordinate to that goal.

## 1. Design principles

1. **Content > decoration.** The page is a résumé, not a portfolio of visuals.
   Typography and rhythm carry the design; chrome is minimal.
2. **One font, one palette.** Source Sans 3 throughout. No monospace surprise,
   no second typeface. Pure gray palette (black → white through 6 gray
   steps). No accent color.
3. **Consistent components.** If two things are both "boxes", they look
   identical. If two things mean the same (a metric, a tag, a link), they share
   exact styling. Visual weight follows semantic importance.
4. **Objective, terse copy.** Say what was done; don't amplify. No italics
   (they are hard to read at small sizes); emphasis is via weight.
5. **Bilingual parity.** English is canonical. Chinese version exists for
   readers who prefer it, but English is never contaminated with Chinese.
   (Chinese page may contain English proper nouns — product names, lab
   names, technical terms — that have no better translation.)

## 2. Color palette

Grays only — no hue (except via real photographic content).

| Token             | Light            | Dark              | Use                                       |
|-------------------|------------------|-------------------|-------------------------------------------|
| `--bg`            | `#ffffff`        | `#0e0e0f`         | page background                           |
| `--bg-soft`       | `#fafafa`        | `#151516`         | subtle surface (cards on hover, etc.)     |
| `--bg-mute`       | `#f1f1ee`        | `#1c1c1d`         | box fills (stats, incoming, venue chip)   |
| `--bg-deep`       | `#e7e6e0`        | `#222224`         | bar-track base                            |
| `--text`          | `#161616`        | `#ededec`         | headlines, name, emphasized body          |
| `--text-body`     | `#232323`        | `#d6d6d4`         | default body copy                         |
| `--text-dim`      | `#555555`        | `#a1a19d`         | captions, metadata                        |
| `--text-faint`    | `#888888`        | `#70706d`         | footnotes, timestamps                     |
| `--border`        | `#e2e2dd`        | `#2a2a2c`         | hairlines                                 |
| `--border-strong` | `#c3c2bb`        | `#3c3c3f`         | hover hairlines, scroll thumb             |

**No other colors.** The only hues on the page come from the profile photo.

## 3. Typography

- Family: **Source Sans 3** (400 / 500 / 600 / 700). No fallback to a
  different-looking font once loaded.
- Sizes (root = 16px):
  - Body: `1rem` / `1.6`
  - Section h2: `1.35rem` / 600
  - Profile name: `1.22rem` / 600
  - Publication title: `1rem` / 600
  - News item: `0.93rem`
  - Captions / dates: `0.72 – 0.85rem`, `--text-faint`
  - Stat numbers: `1.35rem` / 700 (tabular numeric)
- No italics. `em` is overridden to `font-style: normal`.
- Emphasis is weight (`<b>` / `<strong>` / 600) only.

## 4. Layout

- Two-column desktop grid: **280 px sticky sidebar** + flexible main column,
  max page width **1200 px**.
- Single column below 960 px.
- Generous but not wasteful whitespace: `--gap: clamp(1.4rem, 2.5vw, 2.2rem)`.
- Sticky site header (56 px) with name, nav, language + theme toggles.

### Sidebar order (top → bottom)

1. Photo (176 × 176, circular, color, real photograph)
2. Name (+ Chinese under name when language = 中文)
3. Affiliation (2 short lines)
4. **Stats box**: `<citations> · <h-index> · <papers>` + "live · Google Scholar"
5. **Incoming box** (same style as stats): 2 lines, `<org> / <role-program>`
6. Contact grid: 3 columns × 2 rows of **stacked cards** —
   icon centered on top, label centered below. Default cells:
   Email · Scholar · LinkedIn / GitHub · Papers (#publications) ·
   Honors (#honors). Each card ~74 px tall, 6 px rounded, 8 px
   gap, 1 px border, subtle hover translate-y. Location sits
   **below** the grid as a small centered caption
   ("📍 `<city-A> · <city-B>`"), not inside it.
7. Research-interest chip line

**The stats and incoming boxes are visually identical** (same bg, border,
radius, padding) — they are peers in the hierarchy.

### Main column order

About → News → Publications (with yearly-citation chart) → Experience →
Honors → Education → Skills → Contact → Footer.

## 5. Components

- **Section**: title with 1 px bottom hairline; left-aligned; no icons,
  only emoji in the heading.
- **News row**: `2026.04` date chip (gray) + inline text. Date chips use
  `--bg-mute` and a 1 px `--border`, never black.
- **Publication row**: venue chip (`arXiv 2024 ★`) on the left (light gray,
  same chip style as news dates), title + authors + meta on the right.
- **Experience entry**: card with `--bg-soft` bg and a 2 px `--text-dim`
  left accent. Dates in small gray text.
- **Citation-by-year bars**: bar fill in `--text-dim`; current year in
  `--text`. No color.
- **Buttons / toggles**: 1 px border, rounded, monochrome hover states.

## 6. Interaction

- Scroll: nav links receive an underline when their section is in view.
- Theme toggle: smooth state swap, persisted via `localStorage`.
- Language toggle: swaps `data-en` / `data-zh` text attributes in place, no
  page reload. Persisted.
- Reveal-on-scroll: subtle 8 px translate + fade (respects
  `prefers-reduced-motion`).

## 7. Content hierarchy rules

What gets bold:

- **Institutions readers will recognize on name alone**: top-tier
  universities, top industry AI labs, well-known research groups.
  (If the group name is more recognizable / more relevant than the
  lab as a whole, bold the group, not the parent lab.)
- **Project names**: open-source releases, paper titles for
  first-authored work, specific benchmarks with results, named
  capabilities / modules the researcher owned.
- **Role hooks**: "core contributor", "owned X capability",
  "first author", "return offer", "Incoming · Summer <year>".
- **Metric numbers** in prose: citation counts, score deltas,
  rankings, percentile qualifiers.

What is *not* bold:

- Generic product / product-family names that readers outside the
  researcher's own lab won't recognize. (Bold the company, not the
  specific internal codename.) Generic job-title words like
  "intern", "researcher", "engineer".
- Other individuals' names (never single out collaborators when no other
  name appears on the page).

## 8. Photo

- Source: public Google Scholar profile photo (color, portrait).
- Cropped to a circle, 176 × 176 displayed, `object-position: center 25%` so
  the face sits in the visible area.
- No grayscale filter. The profile photo is the page's one piece of non-gray
  content.

## 9. Don'ts

- No italics.
- No second typeface (no monospace chips, no serif accents).
- No colored badges (no arXiv red, no IROS blue, etc.).
- No solid black blocks or black pill tags — too visually heavy.
- No Chinese text on the English page.
- No names of individual collaborators sprinkled in body copy.
