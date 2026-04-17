---
name: personal-website-for-ai-researcher
description: Build a monochrome, PhD-caliber personal homepage for an AI / ML researcher. Static single-page site, two-column layout with sticky sidebar, bilingual EN / 中 toggle, light / dark theme, live Google Scholar citation widget (polite two-tier daily poll). Deployable to GitHub Pages with zero build step. The user provides a LinkedIn URL (minimum), a Google Scholar URL, a GitHub account to deploy to, and ideally a resume PDF — the skill does the rest. Invoke when the user asks for an academic researcher homepage, a personal site for job-search / grad-school / faculty / industry-lab applications, a Jekyll-less alternative to al-folio, or a refresh of their existing Scholar-facing homepage.
---

# Personal Website for AI Researcher

Build a monochrome academic homepage that looks like it belongs on a
top AI lab's team page — the kind of site frontier-lab researchers,
PhDs and grad students actually use. Static HTML + CSS + vanilla JS,
GitHub Pages deploy, no framework, no build step.

The skill's entry point is deliberately simple: **the user hands over
a LinkedIn URL and a Scholar URL; ideally a resume PDF. You do the
rest.** Every phase below is about turning that input into a shipped
live site.

---

## When to invoke

- *"Help me build a personal homepage, I'm an ML / AI researcher."*
- *"Here's my LinkedIn — make me a Scholar-ish academic page."*
- *"I need a PhD-tier site for job search / grad school / faculty apps."*
- *"Refresh my existing GitHub Pages homepage."*

---

## Phase 1 · Clarification protocol (required before building)

**Users rarely know what to submit first.** The skill's job is to
proactively collect every required input through an explicit
clarification step. Don't infer from partial information, don't
guess defaults without confirming, and don't let the user pick-and-
choose which required fields to skip. Walk them through the
checklist.

### Declared fields

The skill has a closed set of declared fields. Every field has a
name, a type, whether it's required, and (for required-with-default
fields) the default the skill will propose.

| Field | Required? | Default | Notes |
|---|---|---|---|
| `language` | **required** | `English only` | Confirm with user; switch to `bilingual EN + 中` only if explicitly requested. |
| `linkedin_url` | **required** | — | Source of truth for roles, dates, bio. |
| `scholar_url` | **required** | — | Skill extracts the `user=...` ID → `<scholar-id>` for the live widget. |
| `github_username` | **required** | — | User-page URLs (`<github-username>.github.io`) require the repo name to match exactly — this is a GitHub rule. |
| `confidentiality` | **required** | `strict — public numbers only` | Offer the default + ask for overrides. Typical at frontier AI labs. |
| `resume_pdf` | strongly preferred | — | Not required, but LinkedIn alone misses dates, GPA, rank, publication metadata. Ask once. |
| `headshot` | optional | Pull from Scholar profile photo; if absent, inline SVG initials avatar. | Accept a direct file upload or an image URL. |
| `phone` | opt-in only | **hidden** | Do not put a phone on a public academic page unless the user explicitly asks. |
| `address` | opt-in only | **hidden** | Default is no physical address. One or two cities is usually all that appears (e.g., 📍 `<city-a>` · `<city-b>`). |
| `email` | derived | pulled from LinkedIn / CV | Only surface a second email if the user explicitly provides one. |

### Defaults policy

- Fields with a **default** (`language`, `confidentiality`): the
  skill proposes the default and confirms — the user can accept
  with a single "ok" or override.
- Fields with **no default** (`linkedin_url`, `scholar_url`,
  `github_username`): the skill **cannot proceed** until the
  user supplies them. Do not substitute guesses from a name.
- **Opt-in fields** (`phone`, `address`): never include them
  unless the user brings them up. Do not ask for them.
- **Deployment target** defaults to **GitHub Pages**. If the
  user wants a different host, they'll say so; don't ask.

### Existing-website input

If the user provides a URL to their **existing personal website**
(either as "refresh this" or "migrate this"), add that URL to the
source list alongside LinkedIn / CV / Scholar, and **extract every
factual item from it first** — bio paragraphs, role descriptions,
news entries, selected publications, honors, links. An existing
site is often the most up-to-date source.

- Fetch the existing site's HTML (plain HTTP → Playwright
  fallback, per the fetch policy).
- Extract: About text, News items, Publications list, Experience
  entries, Honors, Education, Contact.
- Feed all of it into the union rule below — treat the existing
  site as "one more source, possibly richer than LinkedIn".
- Do **not** copy the existing site's **design**. The skill's
  design is monochrome-academic by default; keep that.

### Design-style override

If the user provides a **specific design reference** — an image,
a URL of someone else's site, a Figma file, or an explicit style
description ("I want it to look like al-folio / Karpathy's page /
this-other-researcher's site") — follow the user's reference
instead of the skill's default monochrome palette.

The default *only* applies when the user has not expressed a
design preference. When they have, their preference wins —
*within reason*: the skill's architecture (static HTML, bilingual,
Scholar widget, two-agent review) is orthogonal to palette /
typography, so you can swap the aesthetic layer without rewriting
the structural rules.

If the user's requested style conflicts with a hard rule in this
skill (e.g., they want italics or colored venue badges) — build
it their way, but *flag the trade-off once* ("heads up: this is
why those rules exist") so they can make an informed choice.

### Source-merging rule (union, not intersection)

When LinkedIn, the CV, and anything else the user supplies
disagree or differ in coverage:

- **Take the union.** If an item appears in any source, include
  it. Do not drop items that are missing from one source — that
  source is probably just out of date.
- On conflicts, prefer the more specific / more recent value
  (e.g., month-level date over year-only; explicit end-date over
  "present").
- Include single-source items silently per the union rule;
  **batch** them into the end-of-work wrap-up message ("items
  I found only on Scholar: …; kept them — say 'drop X' if
  you'd rather not"). Per the execution-discipline rule, do
  **not** interrupt mid-work to ask about each one. Never
  silently drop.

Full details in Phase 5, "Merging inputs: take the union".

### How to fetch the source material

The skill will need to read the user's LinkedIn profile, Google
Scholar profile, and possibly a hosted resume. Use this
escalating fallback:

1. **Try a plain HTTP fetch first** — via the `WebFetch` tool,
   `curl`, or any built-in web-fetch agent. This is the cheapest
   path and works for Scholar, GitHub, and most personal-site
   URLs.

2. **If plain fetch fails** (authentication wall, JS-rendered
   page, HTTP 403 / 999 from LinkedIn, CAPTCHA, etc.): fall back
   to a **headless browser / Playwright-click** approach — the
   MCP Playwright tools, a `Playwright click` skill, or any
   browser-automation agent installed locally (e.g.,
   `npx playwright`). This is the insurance layer.

3. **If no headless-browser option is available**: check the
   rest of the local environment and installed Claude skills
   for anything that can fetch or search — other MCP servers,
   sibling skills named `search-*` / `fetch-*` / `web-*`, CLI
   tools like `w3m` or `pandoc`. Use whatever works.

4. **If all three tiers fail**: tell the user explicitly —
   *"I couldn't read your LinkedIn with the tools I have.
   Please either paste the relevant sections here, attach your
   CV PDF, or temporarily make the profile publicly viewable."*
   Do not silently guess from the user's name.

Keep raw fetched material in working memory; don't re-fetch the
same page multiple times within a single session.

### Clarification script

The skill must start every fresh session with a single
consolidated message along these lines (adapt wording to the
user's register):

> I'll use the `personal-website-for-ai-researcher` skill —
> monochrome two-column site, live Scholar widget, GitHub Pages
> deploy, zero build step.
>
> I need a few things before I write any code. Please paste /
> attach the ones below.
>
> **Required** (I can't build without these):
>
> 1. **LinkedIn URL** — the minimum source of truth for roles,
>    dates, and bio.
> 2. **Google Scholar URL** — I extract the `user=...` ID to wire
>    up the live citation widget.
> 3. **GitHub account to deploy to.** GitHub user pages require
>    the repo name to match your username exactly
>    (`<username>.github.io`).
>
> **Required, with a default** (say "ok to default" to accept):
>
> 4. **Language** — default is **English only**. Reply "bilingual"
>    if you want EN + 中.
> 5. **Confidentiality** — default is **strict**: only
>    publicly-released numbers and model names make the page.
>    Reply with anything you specifically want allowed or
>    prohibited.
>
> **Strongly preferred** (not required, but the page gets notably
> better with it):
>
> 6. **Resume / CV PDF.** LinkedIn alone misses exact dates, GPA,
>    ranks, and publication metadata.
>
> **Optional — only if you explicitly want them on the page**:
>
> 7. Phone number, physical address beyond a city, a second
>    email. By default none of these appear.
>
> Once you send 1–5 (and ideally 6), I'll reply with a section-
> by-section plan to confirm, *then* write code.

The skill must **not** begin building until:

- All three "no-default required" fields are supplied.
- The two "required-with-default" fields are either defaulted
  (explicit "ok") or overridden.
- A plan has been sent and the user has said yes to it.

### Execution discipline — do everything end-to-end, ask at the end

**This is the most important interaction rule in the skill.**
Users find mid-work interruptions annoying. The default execution
mode is:

1. **Phase 1 gathers the required inputs once.** You may ask
   clarification questions at this step (that's the whole point
   of the clarification protocol).
2. **Once you have the minimum required set** (LinkedIn + Scholar
   + GitHub + language default + confidentiality default), **you
   build the whole site end-to-end without interrupting.**
   Through fetching, drafting, deploying, review loops, and
   final deploy — zero questions to the user in between.
3. **All uncertainties get batched** into a single wrap-up
   message at the very end. "I built everything. Here's what I
   couldn't auto-populate: [X, Y, Z]. Want me to add any?"
4. **The only exception is a hard blocker**: if after reasonable
   retries *every* required input is inaccessible (LinkedIn
   blocked + no CV + Scholar blocked = nothing to work from),
   stop and tell the user. Never fake a site out of thin air.
   But note: **one source failing is not a blocker** — if
   LinkedIn works and Scholar doesn't, proceed with LinkedIn
   and note Scholar in the wrap-up.

What this rule overrides:
- **Union rule's "surface before including"** → silently include
  union items, and list all "found-in-only-one-source" cases in
  the end-of-work wrap-up instead.
- **Review-round flags** → the reviewer agent talks to the
  generator agent, not to the user. The user sees only the
  final PASS result.

### Wrap-up message format

When the work is finished (reviewer PASSed, site deployed and
verified), send **one** message to the user containing:

1. The live URL.
2. A 2–3 line summary of what shipped.
3. **A batched list of optional-section questions** covering
   anything the skill has *not yet included* because source
   material was missing. Typical candidates (see Phase 7 for
   the full section catalog):
   - Hobbies / additional personal info (if "Outside Work"
     wasn't populated from the CV)
   - Awards or grants you want to add beyond what was auto-
     detected
   - **Teaching Experience** (if any)
   - **Projects** (standalone, distinct from Publications)
4. Any single-source items the union rule pulled in that the
   user might want to review ("I found this paper on Scholar
   but not on your LinkedIn or CV — keep it?").

Frame each question as a toggle, not a homework assignment:
*"Want me to add Teaching Experience? If yes, paste the list;
if no, say 'skip'."*

Never finish with "should I continue?" — the work is done; the
question is only about additions.

### After the user replies

Summarize what you received, flag anything still missing, and
produce the section-by-section plan. Typical plan body:

> Sections I'll include:
>
> - **About** — 2–3 paragraphs, seeded from your LinkedIn bio
>   and CV headline.
> - **News** — recent papers / role changes / releases.
> - **Publications** — list from Scholar, with first-author
>   markers (`★`) applied **only** to papers where you are first
>   author.
> - **Experience** — roles with 1-line descriptions.
> - **Selected Honors & Grants** — filtered to top-tier items
>   only (see Phase 5 for the inclusion bar).
> - **Education** — `<bachelor>`, `<master>`, `<phd>` if
>   applicable.
> - **Skills** — brief, grouped by area.
> - **Outside Work** — optional closing section if you have
>   hobbies you want listed.
> - **Contact** — email + Scholar + LinkedIn + GitHub. No phone
>   / address by default.
>
> Anything to add, drop, or reorder?

Wait for explicit confirmation. Then build v1.

---

## Phase 2 · Placeholder conventions

Throughout this skill and its templates, placeholders use
`<angle-bracket>` tokens. When you generate the site, replace each
token with the user's actual value. Do **not** leave tokens visible
in the shipped HTML.

### Personal identifiers

| Token | Meaning |
|---|---|
| `<name>` | Full name (English). e.g. "Firstname Lastname" |
| `<name-zh>` | Chinese name, only if the user provides one |
| `<nickname>` | Optional — "(Nick)" between first and last |
| `<email>` | Primary email |
| `<phone>` | Phone, only if user explicitly asks for it |
| `<github-username>` | GitHub handle |
| `<linkedin-url>` | Full LinkedIn profile URL |
| `<scholar-id>` | Google Scholar `user=` parameter value |
| `<city-a>`, `<city-b>` | Up to two cities (home + current, or dual posts) |

### Structured sections

| Token | Meaning |
|---|---|
| `<organization>` | A past / current employer — can be **company**, **frontier AI lab**, **research lab**, **university research group**, **government institution**, **industry team / department**. Don't assume "company". |
| `<role>` | Job / study title |
| `<date-range>` | `YYYY.MM – YYYY.MM` (or `From YYYY.MM` if end unknown) |
| `<bachelor-university>` | Undergraduate institution |
| `<bachelor-major>` | e.g. `Industrial Design`, `Computer Science` |
| `<master-university>`, `<master-program>` | If applicable |
| `<phd-university>`, `<phd-program>` | If applicable |
| `<project-name>` | Public project / product / paper title |
| `<paper-title>` | Paper title |
| `<venue>` | e.g. `arXiv 2025`, `CHI '24`, `NeurIPS 2025` |

---

## Phase 3 · Architecture

```
repo/
├── index.html                single-page homepage; data-en/data-zh pairs
├── styles.css                monochrome grayscale, one font
├── script.js                 theme + lang + nav spy + reveal + scholar fetch
├── assets/
│   └── profile.jpg           headshot (from Scholar or user-supplied)
├── data/
│   └── scholar.json          last-synced Scholar snapshot (auto-updated by CI)
├── scripts/
│   ├── fetch_scholar.py      two-tier polite poll (lightweight + full scrape)
│   └── requirements.txt
├── .github/
│   └── workflows/
│       └── update-scholar.yml   daily cron, non-round minute
├── docs/                     OPTIONAL — only if user wants to document
│   ├── DESIGN_SPEC.md
│   └── ENGINEERING_SPEC.md
├── .gitignore                blocks resumes / CVs, .env, *.key
├── .nojekyll                 tells GitHub Pages to skip Jekyll
├── LICENSE                   MIT
└── README.md                 live URL at the top
```

**Zero build step.** What's in the repo ships. No npm, no webpack,
no Jekyll.

This skill intentionally does **not** include admin dashboards,
visit analytics, Cloudflare Workers, or password-gated areas. A
researcher homepage is a public academic page — if the user later
needs analytics, that's a separate concern.

---

## Phase 4 · Design principles (non-negotiable)

These are the rules most first-time readers push back on. Violating
them costs 20 minutes per round of rework. Hold firm.

### Monochrome only
- Pure grayscale palette. **No accent colors.** No arXiv red, no
  conference blue, no colored venue badges, no traffic-light dots.
- Seven gray steps from `#ffffff` → `#161616`. Any color on the
  page comes from the profile photo. Nothing else.

### One font only
- `Source Sans 3` (400 / 500 / 600 / 700). No monospace surprise,
  no serif headings, no secondary display font. If you catch
  yourself reaching for a monospace font for "metrics" or code-like
  tags — stop. Set `font-variant-numeric: tabular-nums` on numeric
  cells instead.

### No italics
- `em { font-style: normal; }` globally. Italics are hard to read
  at small sizes and users find them cosmetic noise.
- Emphasis is **weight only** — use `<b>` or `<strong>` at 600.

### No big dark blocks
- Venue pills, tags, "incoming" chips etc. must use a light-gray
  background (`--bg-mute`) with dark text + 1 px border. A solid
  black pill with white text on a white page reads as mourning.

### Emoji discipline — sparse, headings only
- **Emoji only appear on `<h2>` section headings**, one per
  heading max. They sit *before* the heading text, separated by
  a single space.
- **No emoji in body copy.** Not in paragraphs, not in
  publication titles, not in author lists, not in news items,
  not in honors bullets, not in contact strings. Body text is
  words.
- **Total page budget: ≈ one emoji per major section** (so
  about 8–10 on the whole page if all default sections are
  present). If you find yourself adding emoji anywhere else,
  stop — it's decorative noise.
- **Pick neutral academic-register glyphs**, not cute / childish
  / brand-specific ones. The reference set:
  👋 About · 🔥 News · 📚 Publications · 💼 Experience ·
  🏆 Honors · 🎓 Education · 🛠 Skills · 🌿 Outside Work ·
  📮 Contact
- **Do not use emoji as bullets**, as status indicators, or as
  decorative separators. The page is typographic; if a thing
  needs emphasis, use weight, not a sparkle.

### Objective, terse copy
- Every sentence is a fact. No cover-letter puff, no "passionate
  about". The closing "mission" line is fine, but one sentence,
  no adjectives.

### Consistent components
- Two gray boxes side-by-side must look **identical** — same bg,
  border, radius, padding, shadow. Readers pattern-match.

### Language-purity rule (every interface)

One rule, asymmetric — applies to every language version you build,
not just EN / 中:

**The English interface contains only English.** Any non-English
glyph on a page the user has set to English is a bug. The only
exception is a **professional term or proper noun that has no
English-language equivalent** — in that case use the term once,
parenthesized, and prefer the Romanized / Pinyin / English-gloss
form over the original script:
- OK: *"Rising Stars (talent program name)"* — transliterated /
  English-glossed, no CJK.
- OK: *"kaizen-style iteration"* — technical loanword in common
  English usage.
- Not OK: *"Rising Stars (新星计划)"* on the English page — CJK
  glyphs a foreign reader can't decode.

**Other-language interfaces (Chinese, Japanese, Korean, …)
may contain English** — for brand names, technical vocabulary,
paper titles, model names, and any term where the English
version is the canonical form used in the field:
- OK (on the Chinese page): *"GPT-4 Technical Report"*,
  *"post-training"*, *"verifiable RL"*.
- OK: proper nouns like *"Google"*, *"OpenAI"*,
  *"NeurIPS"*, *"arXiv"*.

This asymmetry reflects English's role as the technical lingua
franca of ML — readers of the Chinese page are overwhelmingly
bilingual on technical terms, readers of the English page are
not.

**General principle**: minimize language mixing; prefer
consistency. When you're about to insert a foreign-script token
into any interface, ask: *is this a professional term that has
no clean equivalent, or am I just defaulting to the source form
out of laziness?* If the latter, translate or transliterate.

### Bilingual parity — hard rules if building EN + 中

- English is canonical. Chinese mirrors it.
- All translatable nodes carry both `data-en` and `data-zh`
  attributes; the default visible HTML must match `data-en`.
- Chinese page uses full-width punctuation: `：，。` not `:,.`.
- When you toggle to the Chinese version, open every section and
  re-read it end-to-end — a half-translated page is worse than
  English-only. News items are the most commonly-forgotten
  coverage hole; check every `<li>`.

### Photo

#### Source priority (search in this order)

1. **LinkedIn profile photo.** First choice — it's the researcher's
   public professional identity. Attempt fetch via:
   - plain HTTP GET with a browser User-Agent (`curl -A "Mozilla/5.0 …"`)
   - if blocked (LinkedIn returns 999 / redirects to login wall):
     **retry 2–3 times** with varied UA / referer / fresh session,
     then fall back to
   - a **Playwright-CLI / headless-browser approach**
     (`npx playwright` + a small script that opens the public
     profile page and grabs the `<img class="profile-photo">` or
     the OpenGraph `og:image` meta), then
   - other available skills / MCP servers that can render pages.
2. **Google Scholar profile photo**, if the user has one:
   `https://scholar.googleusercontent.com/citations?view_op=medium_photo&user=<scholar-id>&citpid=<n>`
   (try `citpid` 1…6).
3. **User-supplied upload** — ask once if the scraping tiers fail.
4. **Fallback: inline SVG with the user's initials** — only if
   all of the above fail. Document this fact in your status update
   so the user can swap in a real photo later.

When you can't get a photo, **tell the user which tiers failed**
and offer them the upload path explicitly: *"LinkedIn returned a
login wall and Scholar doesn't have a profile photo — please
send me a photo file or a direct image URL, or say 'initials'
and I'll use a text avatar."*

#### Rendering rules — preserve aspect ratio, never stretch

- Displayed as a **176 × 176 circle**. CSS:
  ```css
  .avatar {
    width: 176px;
    height: 176px;
    border-radius: 50%;
    object-fit: cover;              /* CROP to fit, do not stretch */
    object-position: center 25%;    /* faces sit high in portraits */
  }
  ```
- `object-fit: cover` is **mandatory**. Without it, a portrait
  photo forced into a square gets squashed horizontally or
  stretched vertically — a dead giveaway of an amateur site.
- Never force both `width` and `height` in pixels on an `<img>`
  without a companion `object-fit` rule. Either use `object-fit`
  or set only one of the two dimensions and let the other be
  `auto`.
- **Also set the `width` and `height` HTML attributes** on the
  `<img>` tag (`width="176" height="176"`) to match the CSS —
  browsers use these to reserve layout space before the image
  loads, preventing a layout shift.
- Export the source image at **2× (352 × 352 px)** so high-DPI
  displays render it sharp. Compress with mozjpeg / squoosh to
  ≤ 50 KB.
- **Color, not grayscale.** It's the only piece of color on the
  page. Everything else being gray makes the photo pop naturally.
- The photo's **intrinsic aspect ratio matters less than the
  object-fit rule** — the skill always ends up with a circular
  176 px render regardless of whether the source is portrait,
  landscape, or square. But for best results, the source face
  should occupy roughly the central 60% of the image.

---

## Phase 5 · Content rules

### Inclusion bar: highest-standard-only

The researcher's CV may be long. The **homepage is not the CV**.
When selecting honors, grants, papers, and projects to include,
apply a strict filter:

- **Does this match the researcher's declared career direction?**
  (If the CV has design-award era entries but the site is now
  about LLM research, filter design awards out unless they're
  internationally top-tier.)
- **Does this represent a top-tier standard in its field?**
  Include: recognized international awards, top-tier conference /
  journal acceptances, competitive grants with real selection
  rates (`top <Y%`), first-authorship on a paper that matters,
  ranks like `1 / N`.
  Exclude: participation certificates, departmental prizes with no
  selectivity context, student-club roles unless leadership.
- **Is there a public signal of competitiveness?** If yes, surface
  it: `top <Y%`, `Rank N / M`, `Gold Prize`, `Champion`,
  cited-count on a widely-read paper.

Never pad to fill space. 4 top-tier honors beat 12 mixed-quality
ones.

### What to bold

- **Institutions readers will recognize by name alone** — top-tier
  universities, well-known AI labs, well-known research groups.
  (If the group name carries more signal than the parent lab,
  bold the group, not the parent.)
- **Project / paper names** that are public and recognizable.
- **Role hooks**: `core contributor`, `owned <capability>`,
  `first author`, `return offer`, `Incoming · Summer <year>`.
- **Metric numbers** in prose: citation counts, score deltas,
  rankings, percentile qualifiers (e.g., `Rank N / M`, `+X% on
  <benchmark>`, `top <Y%`).

### What not to bold

- Generic product / product-family codenames that readers outside
  the researcher's own lab won't recognize. Bold the organization,
  not every internal product.
- Individual collaborator / advisor names **unless** the whole
  section is about named collaborators. Singling out one name when
  no other person appears on the page reads as name-dropping. The
  legitimate exception: author lists in publication rows, which
  follow standard citation format.
- Generic job-title words: `intern`, `researcher`, `engineer`
  unless they qualify a specific role title.

### First-author marker on papers & projects

Standard convention: if the researcher is **first author** on a
paper, mark it with `★ first author` or an `★` in the venue pill.
If they are not first author, **do not** add any marker — the
reader will assume standard middle-author contribution, which is
the default.

Applying this selectively (only to first-author papers) is
honest and informative. Marking every entry with the author
position clutters the page.

### Confidentiality (frontier-lab work)

Common for researchers at industry AI labs. Defaults, unless the
user explicitly overrides:

- **Only public numbers.** Allowed: Technical Report numbers,
  citation counts, blog-post metrics, open-benchmark scores the
  company has announced. Disallowed: internal benchmark counts,
  internal win-rates, specific task-count targets, team size,
  tools not in the public README.
- **Scope over process.** Say "I owned the `<capability>` capability"
  (a public name) rather than describing the specific training
  mix, number of internal benchmarks, or pipeline details.
- **No pre-release model names.** If the company hasn't announced
  it, don't name it.
- **Ask before adding**: "this number / detail — can it appear on
  a public page?"

### Calibrating specificity by publication status

The level of detail to include depends on whether the work is
already public. Classify every entry before writing it:

**High-sensitivity (company work with no public release)**
- Internal company project, no paper, no blog, no press release,
  nothing the company has announced. The CV bullet may contain
  very specific numbers ("lifted X benchmark by Y points",
  "built Z task set of N thousand samples") — those are
  **internal**, treat them as trade / technical secrets by
  default.
- **Rule**: write in **vague, scope-only language**. Say the
  capability and the problem area; do not quote numbers. E.g.
  *"Contributed to post-training on `<model family>`; focus on
  verifiable RL and synthetic data."* — no specific metrics.
- If vague isn't possible without losing the point, ask the user
  explicitly. Never self-authorize a number.

**Medium-sensitivity (company work with a public release)**
- The company has a Technical Report, a blog post, or a press
  release that quotes some numbers. Those specific numbers are
  safe to quote on the page — attribute them to the public
  source (e.g., "public benchmark: `<benchmark>` `<old-score>` →
  `<new-score>` (then-SOTA), per the Technical Report"). Anything
  **not** in the public
  release stays vague.

**Low-sensitivity (lab / academic work with a paper)**
- Published paper, arXiv preprint, or public blog the researcher
  authored. All numbers that appear in the paper are fair game
  on the homepage. Quote specific deltas, benchmarks, rankings,
  ablation results. This is where the page gets to sound
  genuinely impressive.
- First-author paper? Mark it. Cited? Show the count.
  State-of-the-art at the time? Say so and add "(then-SOTA)".

**Decision heuristic when you're unsure**: if you can link
directly to a public URL that contains the number, you can use
the number. Otherwise, vague it.

**Default preference**: among valid phrasings, pick the one that
reads strongest. Don't hedge what's already public; don't leak
what isn't. "Covert confidence" — specific where allowed, vague
where required, never muted when you don't need to be.

### Describing agentic / research work precisely

When the user worked on agentic models, "deep research model" alone
is too vague. Say *what kind of agent it is*: e.g., `multi-turn
autonomous search-and-research agent for hard queries`, or
`tool-using coding agent for data-analytics tasks`. If the user
has results on a benchmark the reader may not recognize, add a
one-phrase annotation in parentheses: `GAIA (a hard-search
benchmark)`, `SWE-Bench (a software-engineering benchmark)`.

### Capability naming for post-training contributors

For researchers who "owned" a named capability within a larger
model release (common at frontier labs), use **`capability`**
(not "module", not "pipeline") — it parallels `tools`, `reasoning`
as capability verticals in post-training. **"Owned"** communicates
leadership without being self-promotional. For the compact
Experience list, `contributor to` + capability name may be safer /
less self-promotional; save `owned` for the longer About and
Publications sections.

---

## Phase 6 · The stylesheet (tokens)

See `templates/styles.tokens.css` for the full palette + core
rules. Key constraints:

```css
:root {
  --bg: #ffffff;  --bg-soft: #fafafa;  --bg-mute: #f1f1ee;
  --bg-deep: #e7e6e0;
  --text: #161616;  --text-body: #232323;  --text-dim: #555;
  --text-faint: #888;
  --border: #e2e2dd;  --border-strong: #c3c2bb;

  --ff: "Source Sans 3", -apple-system, BlinkMacSystemFont,
        "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

em { font-style: normal; }          /* italics banned */
b, strong { font-weight: 600; color: var(--text); }
```

### Layout

- `.page` is CSS grid, `grid-template-columns: var(--sidebar-w)
  minmax(0, 1fr)`, `gap: clamp(1.4rem, 2.5vw, 2.2rem)`.
- Below `960px` → single column.
- `.sidebar` is `position: sticky; top: calc(var(--header-h) + 0.8rem)`.
- `.content` has `min-width: 0` so long URLs don't push the grid
  wider than the viewport.

### Scrollable inner containers

The News list and Publications list each cap at
`max-height: 380–620px`, `overflow-y: auto`,
`border-left: 1px solid var(--border)`, with a 5 px thin
scrollbar. Rationale: dozens of news lines and 8+ publications
would otherwise push the whole page down. Letting them scroll
*inside* their container keeps above-the-fold density.

### Common CSS traps

1. **SVG sizing.** Inline SVGs without explicit `width` / `height`
   attributes may render at full intrinsic size. Always set both.
2. **Cache busting.** Every CSS / JS change bumps `?v=N` on the
   `<link>` / `<script>` tag. Without this, `file://` users and
   Pages CDN cache hits see stale styles.
3. **Grid overflow.** `.content { min-width: 0; }` is required.

### Responsive / cross-device adaptation

The page must look correct on every device class the user might
be seen from: laptop (macOS / Windows / Linux), desktop, tablet
(iPad, Android tablets), phone (iOS Safari, Android Chrome), at
any orientation, in both light and dark system themes, on both
standard and high-DPI displays. The design stays fluid; no
device-specific forks.

#### Viewport + base

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="color-scheme" content="light dark" />
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0e0e0f" media="(prefers-color-scheme: dark)" />
```

`viewport-fit=cover` unlocks iOS safe-area insets (notch / home
indicator). `color-scheme` lets the browser render system chrome
(form inputs, scrollbars) in dark mode. The `theme-color` meta
drives the mobile address-bar color per OS theme.

#### Breakpoints (mobile-first)

One breakpoint, one direction, fluid between:

- **< 720 px** — phone. Top nav hides (section headings are the
  only navigation), sidebar collapses above main, contact icon
  grid falls to 2 columns.
- **720 – 960 px** — phone-landscape / small tablet. Layout
  stays single-column but with wider gutters; nav shows.
- **≥ 960 px** — tablet / laptop / desktop. Two-column grid
  (sidebar 280 px sticky + main fluid). Everything else is
  `clamp()`-ed.

Use `clamp()` for everything that could be too small or too
big at extremes (font sizes, gaps, padding). Example from the
token file:

```css
--gap: clamp(1.4rem, 2.5vw, 2.2rem);
--px:  clamp(1rem, 2.2vw, 1.6rem);
```

Never set a fixed px width on the content column. Use
`minmax(0, 1fr)` inside the grid so long pub titles and URLs
don't push the page wider than the viewport.

#### Touch targets

Every interactive element (nav links, theme / language toggles,
contact icons, "expand" affordances) must hit **at least 40 × 40
px** at phone size. Android Material guideline is 48 px, iOS HIG
is 44 pt; 40 px is the lower bound you should never go under.

Hover states must degrade gracefully on touch-only devices.
Wrap hover rules in a capability query:

```css
@media (hover: hover) {
  .nav-primary a:hover { color: var(--text); }
}
```

On a touch-only screen, hover fires after tap and stays — the
`@media (hover: hover)` guard prevents that weird "stuck hover"
look.

#### Safe-area insets (iOS notch / home indicator)

Header and footer padding should respect `env(safe-area-inset-*)`:

```css
.site-header   { padding-top:    env(safe-area-inset-top); }
.site-footer   { padding-bottom: env(safe-area-inset-bottom); }
body           { padding-left:   env(safe-area-inset-left);
                 padding-right:  env(safe-area-inset-right); }
```

Otherwise the nav hides behind the notch on an iPhone in
landscape.

#### Typography across platforms

The font stack in `--ff` uses Source Sans 3 primarily, with
fallbacks in this order:

```
"Source Sans 3", -apple-system, BlinkMacSystemFont,
"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

- macOS / iOS → `-apple-system` (SF Pro)
- Windows → `Segoe UI`
- Android → `Roboto`
- Linux / misc → `Helvetica Neue` / `Arial`

Even if Google Fonts fails to load, every device falls to its
native system font — the design still reads clean. Never put a
single-platform font (like `SF Pro`) anywhere without a stack
behind it.

Ensure `-webkit-font-smoothing: antialiased;` + `-moz-osx-font-
smoothing: grayscale;` in `body` so macOS + iOS render the
250–500 weight range legibly.

#### High-DPI / retina

The headshot lives in `assets/profile.jpg`. Export it at **2×**
the displayed size (so 352 px if the display size is 176 px)
and compress with mozjpeg / squoosh to ≤ 50 KB. High-DPI
displays (retina, most modern phones + tablets, many Windows
laptops) will render it sharp; standard displays down-sample
automatically.

For any inline SVG (icons, favicon), vectors handle DPR
automatically — no extra work.

#### Sticky / scroll behavior on iOS Safari

- `position: sticky` works on iOS 13+. Ensure the parent has
  enough height or the sticky element will scroll out normally.
- iOS Safari has a 300 ms tap delay quirk on some pages; keep
  `touch-action: manipulation` or rely on the default (modern
  Safari has this fixed for sites with the right viewport meta).
- Momentum scroll on inner-scroll containers (News list,
  Publications list): set `-webkit-overflow-scrolling: touch;`
  on any `overflow: auto` region.

#### Orientation

The single-column ↔ two-column grid already handles the
landscape → portrait flip through breakpoints. No extra code.
Make sure the sticky sidebar's `max-height` doesn't exceed
`calc(100vh - <header-height> - 2rem)` so it doesn't clip the
last interest line on a short landscape viewport.

#### Reduced motion

All `transition` / `animation` must honor:

```css
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
  html { scroll-behavior: auto; }
}
```

Some iOS users keep this on permanently; a wiggly page fails
for them otherwise.

#### Testing matrix (manual, before ship)

At a minimum, view the deployed URL on:

- **macOS** — Safari (WebKit), Chrome (Blink), Firefox (Gecko).
- **Windows** — Chrome / Edge.
- **iOS** — Safari at iPhone SE width, iPhone Pro width, iPad
  portrait + landscape.
- **Android** — Chrome at a mid-range phone width (e.g., Pixel).

Chrome DevTools' device emulator catches most of this, but
always do **one real-device check on an iPhone** before calling
it done — iOS Safari has distinctive behaviors (safe-area,
sticky quirks, form input zoom) that emulators miss.

---

## Phase 7 · HTML structure

### Sidebar order (from top)

1. Photo (`<img class="avatar">`, 176 × 176, `object-fit: cover`).
2. Name (`<h1 class="profile-name">`, 1.22 rem / 600).
3. Affiliation (2 short lines).
4. **Stats box** — `<citations> · <h-index> · <papers>` with
   captions. This is what a reader sees in the first 5 seconds.
5. **Incoming box** (if applicable — same visual style as stats
   box: same bg, border, radius, padding). 2 lines max.
6. **Contact grid** — 3 columns × 2 rows of **stacked cards**. Each
   card is a distinct bordered tile with the icon centered on top
   (≈ 22 × 22 px) and a short label centered below (≈ 0.8 rem).
   Card padding ~14 × 6 px, min-height ~74 px, 6 px rounded
   corners, 8 px gap between cards. Subtle hover: translate-y
   −1 px + slight bg tint, no color shift beyond the palette.
   The 6 default cells (fill what the user has, in this order):
   `Email`, `Scholar`, `LinkedIn`, `GitHub`, `Papers`
   (internal anchor to `#publications`), `Honors` (internal
   anchor to `#honors`). Use real brand SVGs for the external
   services; simple line / solid SVGs for the internal ones
   (document, star). Icons are grayscale — no brand colors.
   Location (one line, center-aligned, small caption) goes
   immediately **below** the grid, not inside it.
7. Research interests (comma-separated short `.pi-body`).

### Main content order — default + optional sections

**Default sections** (in this order):

```
About → News → Publications (with yearly citation chart)
     → Experience → Selected Honors & Grants → Education
     → Skills → Outside Work → Contact → Footer
```

**Optional sections** — include only if the source material
actually supports one, and insert at the indicated anchor:

| Section | Insert after | Include when |
|---|---|---|
| **Projects** (standalone, not papers) | Publications | The user has notable open-source projects, shipped products, reproductions, or demos that are distinct from their papers. Don't duplicate what's already in Publications. |
| **Teaching Experience** | Experience | The user has TA'd, lectured, taught a course or workshop, or mentored at an organized program. |
| **Talks & Invited Lectures** | Teaching Experience (or Publications if no Teaching) | The user has keynote / invited / conference talks worth naming. |
| **Service** | Honors | Program-committee memberships, reviewing, organizing workshops, open-source maintenance roles. |
| **Press / Media** | Honors | Articles about their work in recognized outlets. Not a news-roll. |

### Section-selection rule

Per Phase 1's execution-discipline rule: **silently include an
optional section if source material exists; silently omit it if
not.** Don't ask the user mid-work whether to add Teaching. At
the wrap-up message, list which optional sections you included
and which ones you couldn't auto-populate — that's the time to
ask.

### Rules inside optional sections

- **Projects** follows the Publications' card shape (venue-style
  pill on the left: e.g., `2025 · OSS` or `2024 · Product`;
  title + one-line description + links on the right). Bold the
  researcher's role if not sole author.
- **Teaching Experience** uses the `.exp` card shape — date
  range + role (e.g., `TA, <course name>`) + institution, plus
  a one-line description. No bullet list inside.
- **Talks** is a compact `.news`-style list — `YYYY.MM · Venue:
  Talk title [→slides if linked]`.
- **Service** is a flat `.honors`-style bullet list.
- **Press** is `.news`-style with an outlet badge (e.g.,
  `WIRED 2025`, `Nature 2024`).

Skip any default or optional section the user has nothing for.
A short, truthful page beats a padded one.

### Bilingual attribute pattern

Every translatable node has both:

```html
<p data-en-html="true"
   data-en='I work on <b>post-training</b> ...'
   data-zh='我做<b>后训练</b> ...'>
  I work on <b>post-training</b> ...
</p>
```

- `data-en-html="true"` signals to `script.js` that these
  attributes contain HTML (links, `<b>`) and should be set via
  `innerHTML`. Without that flag, JS uses `textContent` (safe for
  simple strings).
- The default visible HTML must match `data-en` exactly —
  otherwise pre-JS readers and search-engine crawlers see a
  different page than post-JS readers.

### Publication row format

```html
<li class="pub">
  <div class="pub-venue">arXiv 2025 ★</div>    <!-- ★ only if first author -->
  <div class="pub-body">
    <p class="pub-title">
      <a href="<link>"><paper-title></a>
    </p>
    <p class="pub-authors">
      <authors-with-<b>self-bolded</b>> · <venue-italicized> ·
      <span class="pub-cite"><citations> citations</span>
    </p>
    <p class="pub-note">
      <!-- Optional: 1-2 line description of the researcher's role -->
    </p>
    <p class="pub-links">[arXiv] [GitHub] [Page]</p>
  </div>
</li>
```

### Navigation

```html
<header class="site-header" id="site-header">
  <div class="header-inner">
    <a href="#top" class="home-link"><name></a>
    <nav class="nav-primary">
      <a href="#about">About</a>
      <a href="#news">News</a>
      <a href="#publications">Publications</a>
      <a href="#experience">Experience</a>
      <a href="#honors">Honors</a>
      <a href="#education">Education</a>
    </nav>
    <div class="header-tools">
      <button class="lang-toggle" id="langToggle">
        <span class="lt-label">EN</span>
      </button>
      <button class="theme-toggle" id="themeToggle">
        <span class="tt-light">☀</span><span class="tt-dark">☾</span>
      </button>
    </div>
  </div>
</header>
```

Skills / Outside Work / Contact are deliberately **not** in
primary nav — the nav lists the 6 things that matter to an
academic reader.

---

## Phase 8 · Script (theme + lang + scholar fetch + nav spy)

Single IIFE, ~200 LOC, no modules, no dependencies. Behaviors:

1. **Theme.** `localStorage` key, default from
   `prefers-color-scheme`. Toggle flips `data-theme` on `<html>`.
2. **Language.** `localStorage` key, default `en`. Toggle walks
   every `[data-en][data-zh]` and swaps `textContent` or
   `innerHTML` (if `data-en-html="true"`). Updates `lang` attr on
   `<html>`.
3. **Nav spy.** `IntersectionObserver` with
   `rootMargin: "-30% 0px -55% 0px"`. Underlines the nav link
   whose section is in the middle of the viewport.
4. **Reveal-on-scroll.** Adds `.reveal` then `.is-visible` via a
   second `IntersectionObserver`. Respects
   `prefers-reduced-motion`.
5. **Scholar fetch.** On every page load:
   ```js
   fetch('data/scholar.json?v=' + Date.now(), { cache: 'no-store' })
     .then(r => r.json())
     .then(data => {
       animateNumber(sideTotalEl, data.total_citations);
       animateNumber(sideHEl,     data.h_index);
       animateNumber(sidePubsEl,  data.publications_count);
       renderChart(data.per_year);   // recent 4 years as gray bars
     })
     .catch(() => setStatus('offline'));
   ```

Cache-bust query on the JSON fetch is non-negotiable — Pages' CDN
caches aggressively.

---

## Phase 9 · Live Google Scholar — two-tier polite poll

Google Scholar aggressively rate-limits GitHub Actions IP ranges.
The naive strategy (every 6 hours, unconditional full scrape) will
eventually eat a CAPTCHA. Use a polite two-tier strategy instead.

### Tier 1 — lightweight check (daily)

One plain HTTPS GET of the public profile page with a normal
desktop Safari User-Agent, parsing one number (total citations)
out of the HTML. Indistinguishable from a human refreshing the
page. See `templates/fetch_scholar.py` for the full code.

### Tier 2 — full scrape (only when changed or forced)

Use `scholarly` + `ProxyGenerator().FreeProxies()`. Returns
`total_citations`, `h_index`, `i10_index`, `publications_count`,
`cites_per_year`.

### Glue

```python
current = quick_total_citations(SCHOLAR_ID)
existing = load_existing()

if not force and current == existing.get("total_citations"):
    existing["last_check"] = utc_now_iso()
    write_out(existing)          # no-op day
    return 0

# Count moved OR forced → Tier 2
try:
    scraped = full_scrape(SCHOLAR_ID)
except Exception:
    existing["last_check"] = utc_now_iso()    # keep old snapshot
    write_out(existing)
    return 0

write_out(merge_with_fallback(scraped, existing))
```

### Schedule

```yaml
on:
  schedule:
    - cron: "17 3 * * *"      # daily at a non-round minute
  workflow_dispatch:
    inputs:
      force:
        description: "Force full scrape even if count unchanged."
        type: boolean
        default: false
```

Non-round minute avoids the top-of-hour bot-traffic peak that
Scholar rate-limits hardest.

### Data contract

`data/scholar.json`:

```jsonc
{
  "name": "<name>",
  "scholar_id": "<scholar-id>",
  "total_citations": 0,
  "h_index": 0,
  "i10_index": 0,
  "publications_count": 0,
  "per_year": { "<year>": 0 },
  "last_updated": "ISO 8601 UTC",    // last successful full scrape
  "last_check":   "ISO 8601 UTC",    // last Tier-1 check (may be no-op)
  "last_check_method": "quick | full | quick-failed-heavy-failed"
}
```

On any error, the updater preserves the previous snapshot and
only bumps `last_check` — the front-end never flickers to zero.

---

## Phase 10 · Deployment

### Default target: GitHub Pages under the user's own account

**Default deployment**: GitHub Pages (`<github-username>.github.io`),
using the user's own GitHub account. This is assumed everywhere —
repo structure, `.nojekyll`, the Pages API calls, the
Scholar-sync workflow, and the force-push discipline all target
GitHub. Ask the user to confirm their GitHub username; do not ask
whether to use GitHub Pages.

### If the user has a different deployment requirement

If the user explicitly asks for a different host (Netlify /
Vercel / Cloudflare Pages / self-hosted), follow their
instructions. The static files port cleanly — the portability
checklist:

- `index.html`, `styles.css`, `script.js`, `assets/` are
  framework-free and host-agnostic.
- `data/scholar.json` + the GitHub Actions workflow assumes
  `github-actions[bot]` can push to the repo. On Netlify /
  Vercel you'll need to port the daily sync to their
  scheduled-functions equivalent (Netlify Scheduled Functions,
  Vercel Cron). On self-hosted, a plain cron job calling
  `python3 scripts/fetch_scholar.py && git push` works.
- `.nojekyll` is a GitHub-Pages-specific sentinel — safe to
  leave in place but has no effect elsewhere.

### GitHub Pages (user site)

- Repo name **must** match `<github-username>.github.io` exactly.
  Project pages (`<github-username>.github.io/<repo>/`) also work
  but have an uglier URL.
- Free account + public repo required. Make it public via:
  ```bash
  gh repo edit <github-username>/<github-username>.github.io \
    --visibility public \
    --accept-visibility-change-consequences
  ```
- Push `main` branch, then:
  ```bash
  gh api -X PATCH repos/<github-username>/<github-username>.github.io \
    -f default_branch=main
  gh api -X POST repos/<github-username>/<github-username>.github.io/pages \
    -f "source[branch]=main" -f "source[path]=/"
  ```
- `.nojekyll` sentinel at root prevents Jekyll processing.
- Typical build time: 30–60 seconds after push.

### Commit discipline

- Authored as the user, never as the AI. Default to whatever
  `git config user.name / user.email` yields.
- **Do not** add `Co-Authored-By: <AI>` lines or any AI
  attribution in commit bodies. Users consistently care about
  this.
- Commit messages: imperative mood, factual, small scope.

### Force-push discipline

When rewriting history (e.g., to purge a CV PDF that was pushed
by mistake):

- Use `git filter-repo --invert-paths --path <file>` — it rewrites
  and cleans up far better than `filter-branch`.
- `filter-repo` **removes** remotes by design. Re-add them after.
- Force push with `--force-with-lease` (not bare `--force`) to
  avoid trampling concurrent CI commits.

### Hiding files after the fact

The user will eventually say *"oh wait, that shouldn't be
public."* Standard procedure:

1. Move the file to a local backup outside the repo.
2. Remove references from current HTML / README.
3. Add the filename pattern to `.gitignore`.
4. `git filter-repo --invert-paths --path <filename>` — strips
   from all history.
5. Re-add remotes, force push.
6. Verify with `curl -sI https://<site>/<file>` → 404 and
   `gh search/code q=filename:<file>` → 0 results.

---

## Phase 11 · Two-agent review protocol (mandatory)

Don't ship v1. Every version you think is done has at least three
things the user will flag. Use a **formal two-agent protocol**:
one agent generates, one agent reviews, and **the site is not
considered done until the reviewer returns PASS**.

### Roles

- **Generator agent** — writes / edits the HTML, CSS, JS, data
  files, and workflow files. Takes the user's inputs + the
  reviewer's feedback and produces the next version.
- **Reviewer agent** — reads the live deployed site and the
  source files, scores against the rubric below, and returns
  either **PASS** (ship it) or **a list of concrete fixable
  flags**. Must not rewrite code itself — its only outputs are
  PASS or a flag list.

The top-level orchestrator (the main Claude turn) dispatches
both as subagents via the `Agent` tool, relays flags from the
reviewer to the generator, and only declares the site finished
after the reviewer emits **PASS** on a version deployed to the
live URL.

### Loop

1. **Generator** builds v1 from the user's Phase-1 inputs.
   Deploys to the live URL.
2. **Reviewer** reads the live site + source. Returns PASS or a
   flag list (see rubric below).
3. If flags: orchestrator hands the flag list to the generator;
   generator applies fixes, bumps `?v=N`, deploys v2.
4. Reviewer reads v2. Returns PASS or next flag list.
5. Loop steps 3–4 until reviewer returns PASS. **Minimum three
   review cycles** even if the reviewer wants to PASS earlier —
   three cycles catches things that don't surface on a first
   read.
6. After PASS + minimum 3 cycles: declare done. Announce the
   live URL to the user.

### Reviewer rubric

The reviewer must explicitly check each of these and flag any
failure with a `file:line` reference + one-line rationale + a
proposed small edit:

**Design / palette**
- Any hex color outside the `:root` token table?
- Any `font-family` line besides the `--ff` token?
- `em { font-style: normal; }` actually in effect?
- Any emoji outside `<h2>` section headings, or more than one
  per heading?

**Content / tone**
- Any Chinese / non-English glyphs on the English page (except a
  single parenthesized professional term)?
- Pre-JS default HTML byte-equal to `data-en`?
- Any `arXiv:xxx` IDs in parens (should be inline link text)?
- Any collaborator names singled out outside author lists?
- First-author `★` applied only where actually first author?
- Honors list passes the highest-standard filter?
- Confidentiality respected (no internal metrics / pre-release
  names that aren't in a public source)?

**Markup / JS**
- Every SVG has explicit `width="N" height="N"`?
- Every `<li>` in `.news` has both `data-en` and `data-zh` (if
  bilingual)?
- `?v=N` bumped on latest CSS / JS change?

**Data integrity**
- `data/scholar.json` has current `total_citations`, `h_index`,
  `per_year` with recent years, `last_updated`?
- First-party numbers match what's visible in the sidebar
  stats block?

**Responsiveness / cross-device**
- `viewport-fit=cover` + `color-scheme` + `theme-color` meta
  tags present?
- At `< 720 px`, layout collapses cleanly; nav hides; no
  horizontal scroll?
- Hover rules guarded by `@media (hover: hover)`?
- `env(safe-area-inset-*)` respected?
- Headshot rendered with `object-fit: cover`, no stretching?

**Deployment**
- Live URL returns 200; `assets/profile.jpg` returns 200;
  stylesheet URL returns 200?
- Commits authored by user, not AI? Commit bodies free of AI
  attribution?
- No resume / CV PDF pushed to the public repo?

### PASS criteria

Reviewer returns `PASS` only when **all rubric items are
satisfied** on the deployed version. Anything partial is a flag
list, not a PASS.

### Playwright-driven verification (encouraged, not required)

If the reviewer has a Playwright / browser-automation tool
available, use it to:
- screenshot the page at phone / tablet / desktop widths;
- verify language and theme toggles actually swap content /
  colors;
- catch layout bugs that the DOM inspector misses (icons
  exploding to full size, elements that claim to be hidden but
  still render, inputs covered by absolutely-positioned buttons).

Without Playwright, `curl` + DOM inspection covers most rubric
items but misses visual regressions. Strongly prefer having a
Playwright agent if the orchestrator can spawn one.

---

## Phase 12 · Key files — canonical templates

Working copies of every non-trivial file live under `templates/`
next to this `SKILL.md`. Adapt (name, Scholar ID, palette if
requested) — don't paste verbatim.

### `.gitignore`

```
# Private / sensitive — never commit
*.env
*.env.*
*.key
*.pem
.DS_Store

# Resume / CV PDFs — keep locally, don't publish
*_Resume_*.pdf
*_resume_*.pdf
*_CV_*.pdf
resume.pdf
cv.pdf

# Editor / OS
.vscode/
.idea/
*.swp
/tmp/
```

### Required meta tags

```html
<meta name="robots" content="index, follow" />
<meta name="description" content="Personal homepage of <name> — <one-line research-focus sentence>." />
<meta name="author" content="<name>" />
<meta property="og:type"  content="profile" />
<meta property="og:title" content="<name>" />
<meta property="og:image" content="assets/profile.jpg" />
```

### Favicon (no external asset needed)

Inline SVG data URI with the user's initials:

```html
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ctext y='23' font-size='20' font-weight='700' font-family='Helvetica,Arial,sans-serif'%3E<initials>%3C/text%3E%3C/svg%3E" />
```

---

## Phase 13 · Pre-ship checklist

- [ ] No hex color outside `:root` token table.
- [ ] No `font-family` line besides the one `--ff` token.
- [ ] `em { font-style: normal; }` in CSS.
- [ ] Every `<h2>` has `data-en` + `data-zh` (if bilingual).
- [ ] Every `<li>` in `.news` has `data-en` + `data-zh` — the
      most commonly-forgotten coverage hole.
- [ ] Pre-JS default HTML **byte-equal** to the `data-en` value.
- [ ] Every SVG has explicit `width="N" height="N"` attributes.
- [ ] `?v=N` bumped on every CSS / JS change.
- [ ] `data/scholar.json` has `total_citations`, `per_year` with
      recent years, `last_updated` ISO 8601.
- [ ] First-author markers applied only where true.
- [ ] Honors list passes the "highest-standard" filter (§ Phase 5).
- [ ] Commits authored by user, not AI. Commit bodies don't
      mention AI tools.
- [ ] No resume / CV PDF pushed to the public repo.
- [ ] README top has live URL.
- [ ] Run through the page in both EN and 中 (if bilingual).
      Flip to dark mode, do it again.
- [ ] Live site returns 200; profile.jpg returns 200; stylesheet
      query-stringed URL returns 200.

### Language purity

- [ ] **English interface** — `grep -P '[^\x00-\x7F]'` over the
      rendered HTML of the English view returns zero lines.
      (Any non-ASCII glyph on the English page is a bug unless
      it's a parenthesized professional term with no clean
      English equivalent, and even then, prefer Romanized form.)
- [ ] **Other-language interface** — English is allowed for
      proper nouns, model names, paper titles, and technical
      vocabulary; free-form Chinese / Japanese / etc. copy is
      fluent native, not machine-translated-feeling.
- [ ] No mixed-language "lorem ipsum" remnants. A half-translated
      section is worse than English-only.

### Emoji budget

- [ ] Emoji only appear on `<h2>` headings; zero in body copy,
      zero in publication / news / honors lines.
- [ ] Total page emoji count ≈ one per major section (8–10 on
      a full-default page). If more, prune.
- [ ] All emoji are from the neutral academic set (👋 🔥 📚 💼
      🏆 🎓 🛠 🌿 📮). No cute / branded / status-light glyphs.

### Cross-device

- [ ] `<meta name="viewport" content="... viewport-fit=cover">`
      is present.
- [ ] `color-scheme: light dark` meta tag set; dark `theme-color`
      also declared.
- [ ] One CSS breakpoint at `960 px` (two-column → one-column)
      verified by resizing the viewport in DevTools.
- [ ] At `< 720 px`, top nav hides, sidebar moves above main,
      the contact grid reflows to 2 columns, and no text touches
      the viewport edge.
- [ ] Every interactive element ≥ 40 × 40 px at phone size.
- [ ] Hover styles guarded by `@media (hover: hover)` so they
      don't "stick" on touch-only devices.
- [ ] `env(safe-area-inset-*)` respected in header + footer +
      body padding (checked on an iPhone, not just an emulator).
- [ ] Font stack falls back cleanly to `-apple-system`,
      `Segoe UI`, `Roboto` when Google Fonts is blocked.
- [ ] `prefers-reduced-motion` disables all transitions /
      animations.
- [ ] Tested manually on macOS Safari, iOS Safari (iPhone +
      iPad), Android Chrome, and at minimum one Windows browser
      (Chrome or Edge). Real-device check on iOS is mandatory —
      emulators miss its quirks.

---

## Invocation example

User says:
*"Help me build a personal homepage, I'm an AI researcher."*

The skill replies with the **clarification script from Phase 1**
— one message, declared fields enumerated, defaults proposed for
the two required-with-default fields, and a clear "I can't
proceed without items 1–3" boundary.

After the user responds, the skill:

1. Confirms what it received and names anything missing.
2. Sends the section-by-section plan.
3. Waits for explicit "yes" on the plan.
4. Writes v1, deploys, iterates through review rounds
   (Phases 3–13).

Do **not** try to produce a 1500-line HTML file in one shot before
seeing the user's feedback on palette / tone / content. First
`git push` has *something* viewable (ugly is fine); every
subsequent push is a directed fix.

---

## See also (in this skill's folder)

- `templates/styles.tokens.css` — drop-in palette + core rules
- `templates/fetch_scholar.py` — two-tier polite Scholar scraper
- `templates/requirements.txt` — pip deps for the scraper
- `templates/update-scholar.yml` — GitHub Actions workflow
- `templates/DESIGN_SPEC.md` — design-principles reference doc
- `templates/ENGINEERING_SPEC.md` — architecture-contracts reference

---

## License

This skill (the `SKILL.md`, `README.md`, and everything in
`templates/`) is released under the MIT License. Adapt, re-share,
build sites for yourself and others.
