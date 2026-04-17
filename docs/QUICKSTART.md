# Quickstart — 2 minutes

From zero to a live academic homepage at `<your-username>.github.io`. You need a LinkedIn profile, a Google Scholar profile, and a GitHub account. That's it.

## 1. Install the skill

See [`INSTALL.md`](INSTALL.md). If you already did `/plugin install personal-website-for-ai-researcher`, skip this.

## 2. Make sure your GitHub is ready

- You have a GitHub account — let's call your username `<username>`.
- You're logged in via `gh auth status` (the GitHub CLI). If not, `gh auth login`.
- You *do not* already have a repo named `<username>.github.io`. (If you do and it's unused, feel free to archive it — the skill can work with an empty repo.)

## 3. Make sure your Scholar profile is public

Open your Scholar profile and confirm:

- Its URL looks like `https://scholar.google.com/citations?user=XXXXXXX&hl=en`.
- It's set to public (gear icon → "Public profile"). The skill reads the page over plain HTTPS.

## 4. Open Claude Code in a new, empty folder

```bash
mkdir ~/my-homepage && cd ~/my-homepage
claude
```

## 5. Say this (fill in the brackets):

> Build me a personal homepage. I'm an AI researcher.
> - LinkedIn: `<your-linkedin-url>`
> - Scholar: `<your-scholar-url>`
> - GitHub username: `<username>`
> - I'll default to English-only and strict confidentiality.
> - Here's my CV: `<attach-pdf>` *(optional but highly recommended)*

The skill will reply with its clarification protocol. Confirm or override the defaults. It then sends a section-by-section plan; reply "yes" to the plan.

From that point, **do not interrupt**. The skill runs end-to-end — fetching, drafting, deploying, review loops, final deploy — without asking questions. A typical run takes 8–20 minutes depending on how much iteration the reviewer agent flags.

## 6. Get the live URL

When the skill finishes, it prints:

1. The live URL (`https://<username>.github.io/`).
2. A 2–3 line summary of what shipped.
3. A batched list of optional questions — Teaching Experience, Projects, Hobbies, any single-source items — that you can answer one line each if you want them added.

Click the URL. Your homepage is live.

## 7. Add updates later

Run the skill again in the same folder; tell it what changed. Or just edit the files directly — they're static HTML/CSS/JS and the whole site is ~1,500 lines of readable code.

Scholar stats update themselves daily via the GitHub Actions workflow the skill installed.

## Troubleshooting

**The skill won't start building because it says LinkedIn / Scholar is required.** — Supply them. The "required" fields aren't suggestions; the skill refuses to fake a page from your name alone.

**LinkedIn is blocked when the skill tries to fetch it.** — Expected. The skill has a four-tier fallback. If all four tiers fail, paste the relevant sections (About, Experience, Education) into the chat.

**GitHub Pages shows a 404 after the skill deploys.** — Pages takes 30–60 seconds to build after the first push. Refresh. If still 404 after two minutes, check: repo is public, repo name matches `<username>.github.io` exactly, Pages source is set to `main` branch.

**Scholar widget shows "offline" or zeros.** — The polite two-tier poll sometimes hits a CAPTCHA on the first run. The `data/scholar.json` file will be empty until the next successful daily run. You can force a refresh by triggering the workflow manually: GitHub → Actions → "Update Scholar data" → Run workflow.

**I want it bilingual.** — Tell the skill in step 5: "I want EN + 中" instead of "default to English only." The skill then mirrors every node with `data-en` / `data-zh` attributes.

**I want a different palette.** — Tell the skill in step 5: "I want it to look like `<reference-site>`." The skill will build it that way but flag the trade-off once so you can reconsider. Default monochrome exists because it's bulletproof.
