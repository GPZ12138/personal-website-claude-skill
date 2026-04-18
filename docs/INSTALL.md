# Install

Three paths, pick the one that matches how you already use Claude Code.

## Compatibility

The skill is a plain `SKILL.md` + `templates/` folder. Each runtime expects it at a different path; the table below maps each one and links to the exact installer command.

| Runtime | Install via | Skill path it reads | Notes |
|---|---|---|---|
| **Claude Code** | `/plugin marketplace add` (see Path 1 below) | `~/.claude/skills/` (managed by the plugin system) | First-class. The recommended path for almost everyone. |
| **`claude -p` (Claude CLI)** | `install.sh` (Path 2) | `~/.claude/skills/` | Inherits whatever the standard skills folder contains. |
| **NanoClaw** (ECC's REPL) | `./scripts/install-claw-family.sh nanoclaw` | `<cwd>/skills/<name>/SKILL.md` (project-relative) | This repo is already laid out that way. Run NanoClaw from the repo root. |
| **Hermes** (ECC's operator shell) | `./scripts/install-claw-family.sh hermes` | `~/.hermes/skills/ecc-imports/` | Symlinks into Hermes's ecc-imports loader. Requires `~/.hermes/` to exist. |
| **OpenClaw** (multi-channel agent) | `./scripts/install-claw-family.sh openclaw` | `~/.claude/skills/` (via claude-bridge) | **Read the security advisory below before using.** |

### NanoClaw — full invocation

```bash
git clone https://github.com/gpz12138/personal-website-claude-skill.git
cd personal-website-claude-skill
./scripts/install-claw-family.sh nanoclaw     # prints invocation, no FS changes
```

Then run NanoClaw from the repo root in either form:

```bash
# (a) boot REPL with the skill auto-loaded as system context
CLAW_SKILLS=personal-website-for-ai-researcher claw

# (b) boot empty, load on demand
claw
> /load personal-website-for-ai-researcher
```

### Hermes — full invocation

```bash
./scripts/install-claw-family.sh hermes
# → symlinks ~/.hermes/skills/ecc-imports/personal-website-for-ai-researcher
ls -l ~/.hermes/skills/ecc-imports/personal-website-for-ai-researcher
# → should resolve to this repo
```

Hermes will pick the skill up via its `ecc-imports` loader on next start. From a Hermes session:

> *"Use the personal-website-for-ai-researcher skill — LinkedIn `<...>`, GitHub `<...>`, Scholar `<...>`."*

### OpenClaw — security advisory before installing

> ⚠ **OpenClaw security advisory**
>
> ECC's published security review of OpenClaw — *"OpenClaw 的隐藏危险"* (The Hidden Dangers of OpenClaw) — documents:
>
> - **41.7% of ClawdHub community skills have critical vulnerabilities** (independent audit by Koi Security).
> - OpenClaw's multi-channel architecture (Telegram + Discord + WhatsApp + email + browser + filesystem) **maximizes prompt-injection attack surface by design**.
> - ECC's official recommendation is to **migrate away from OpenClaw**, not deploy new skills onto it.
>
> Reference: `docs/HERMES-OPENCLAW-MIGRATION.md` in the ECC marketplace.
>
> **This skill itself is read-only** (it writes static HTML and pushes to a public GitHub Pages repo). The direct risk surface is small. The **ambient risk** — *other* ClawdHub skills running alongside it inside the same OpenClaw process — is not.
>
> If you proceed anyway:
>
> 1. Audit every other ClawdHub skill in your OpenClaw setup. Prefer locally-authored or hand-reviewed skills only.
> 2. Do **not** connect OpenClaw to channels that receive untrusted input (public Discord servers, X DMs, public Telegram bots).
> 3. Prefer **NanoClaw** or **Claude Code** for production work.

To install anyway:

```bash
./scripts/install-claw-family.sh openclaw     # interactive — prompts to confirm
```

The script symlinks the skill into `~/.claude/skills/` (the path most claude-bridge implementations consume). If your OpenClaw setup uses a different skill loader, copy `skills/personal-website-for-ai-researcher/` into wherever your bridge expects.

## Path 1 — Claude Code plugin (recommended)

Makes the skill discoverable across every session without touching your filesystem. Inside Claude Code:

```
/plugin marketplace add gpz12138/personal-website-claude-skill
/plugin install personal-website-for-ai-researcher
```

Verify:

```
/plugin list
```

You should see `personal-website-for-ai-researcher` in the enabled list.

To update later:

```
/plugin marketplace update personal-website-claude-skill
/plugin install personal-website-for-ai-researcher
```

To uninstall:

```
/plugin uninstall personal-website-for-ai-researcher
/plugin marketplace remove personal-website-claude-skill
```

## Path 2 — User-global skill via install.sh

Clones the repo under `~/.claude-skills-src/` and symlinks the skill into `~/.claude/skills/`. Works in every Claude Code session on this machine.

```bash
curl -fsSL https://raw.githubusercontent.com/gpz12138/personal-website-claude-skill/main/install.sh | bash
```

The script is idempotent — running it again pulls the latest and re-links.

Verify:

```bash
ls -l ~/.claude/skills/personal-website-for-ai-researcher
```

You should see a symlink pointing to `~/.claude-skills-src/personal-website-claude-skill/skills/personal-website-for-ai-researcher`.

To update:

```bash
git -C ~/.claude-skills-src/personal-website-claude-skill pull
```

To uninstall:

```bash
rm ~/.claude/skills/personal-website-for-ai-researcher
rm -rf ~/.claude-skills-src/personal-website-claude-skill
```

## Path 3 — Manual install per project

Commit the skill into a specific project's `.claude/skills/` — useful if you want a skill pinned to a repo.

```bash
cd /path/to/your/project
mkdir -p .claude/skills
git clone --depth 1 https://github.com/gpz12138/personal-website-claude-skill.git /tmp/skill-src
cp -r /tmp/skill-src/skills/personal-website-for-ai-researcher .claude/skills/
rm -rf /tmp/skill-src
```

Then commit `.claude/skills/personal-website-for-ai-researcher/` so collaborators on this project get the skill automatically on `git clone`.

## Verify the skill works

Open Claude Code in any empty folder and say:

> *"List the skills you have available."*

You should see `personal-website-for-ai-researcher` with its description. Now say:

> *"Use the `personal-website-for-ai-researcher` skill. My LinkedIn is …, my Scholar is …, my GitHub is …"*

The skill will respond with its clarification script. That confirms it's wired up correctly.

## Troubleshooting

**`/plugin` command not found** — you need a recent Claude Code version. Run `claude --version`; update if outdated.

**Skill doesn't appear in `/plugin list`** — plugin marketplace additions are per-Claude-Code-install. If you use Claude Code on multiple machines, re-run `/plugin marketplace add` on each.

**Skill appears but isn't auto-invoked** — skill auto-invocation is based on the `description` field matching your prompt. If Claude doesn't pick it up from a vague prompt, name it explicitly: *"Use the `personal-website-for-ai-researcher` skill."*

**`curl | bash` fails on enterprise-locked machines** — fall back to Path 3 (manual clone) or ask your admin to whitelist `raw.githubusercontent.com`.

**LinkedIn / Scholar fetch fails during a build** — this is expected on some networks. The skill escalates through four fallback tiers before giving up; see `skills/personal-website-for-ai-researcher/SKILL.md` Phase 1 for the full fetch-fallback policy. Worst case, you paste the relevant sections into the chat.
