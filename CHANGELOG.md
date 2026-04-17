# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-04-16

Initial public release.

### Added
- `personal-website-for-ai-researcher` skill with 13-phase instructions (`skills/personal-website-for-ai-researcher/SKILL.md`).
- Six drop-in templates:
  - `styles.tokens.css` — monochrome palette + core rules
  - `fetch_scholar.py` — two-tier polite Scholar scraper
  - `requirements.txt` — pip dependencies for the scraper
  - `update-scholar.yml` — GitHub Actions daily-sync workflow
  - `DESIGN_SPEC.md` — design principles reference
  - `ENGINEERING_SPEC.md` — architecture contracts reference
- Claude Code plugin manifest (`.claude-plugin/plugin.json`).
- Self-hosted plugin marketplace (`.claude-plugin/marketplace.json`) — installable with one `/plugin marketplace add` command.
- One-line installer script (`install.sh`).
- CI workflow linting the SKILL.md frontmatter (`.github/workflows/lint-skill.yml`).
- Issue templates for bug reports and feature requests.
- Example screenshots and demo GIF generated from [gpz12138.github.io](https://gpz12138.github.io).
