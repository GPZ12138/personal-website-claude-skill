# Contributing

PRs welcome. This skill is a distilled taste profile for what a top-lab academic homepage looks like — every design rule exists because something went wrong on a previous build.

## Before proposing a rule change

Read the rationale paragraph next to the rule in `skills/personal-website-for-ai-researcher/SKILL.md`. If the rule looks wrong to you at first glance, that is the exact reaction the rule is there to override — please read the `Why` before opening the PR.

If after reading the rationale you still think the rule is wrong, open an issue first and make the case in writing. Some rules are opinion; some are load-bearing.

## Bug reports

Open an issue using the **Bug** template. Include:

- The input you gave the skill (LinkedIn URL, Scholar URL, GitHub username — redact as needed).
- The output it produced (paste the generated file, or link to the deployed URL).
- What was wrong (what you expected vs what you got).
- The Claude Code version and OS.

## Feature requests

Open an issue using the **Feature** template. One feature per issue. Describe the user flow end-to-end, not just the capability.

Priority goes to features that generalize across many researchers. Features that only apply to a single lab's style get lower priority than features every PhD needs.

## Workflow

1. Fork the repo.
2. Create a feature branch.
3. Make your changes.
4. Test by installing your fork as a local skill and running it end-to-end against at least one real researcher profile.
5. Open a PR. Describe what changed and why.

## Commit discipline

- Commits are authored as the human contributor. No AI attribution in commit bodies.
- Imperative mood, factual, small scope.
- One logical change per commit.

## Testing

There is no automated test suite — the skill's output is a deployed website, and the review protocol in Phase 11 of `SKILL.md` is its test harness. When you change a rule, demonstrate the before/after on a real site in your PR description.

The only CI check is frontmatter validation on `SKILL.md` (name, description, type, correct YAML structure).

## Licensing

By submitting a PR, you agree that your contribution is licensed under the MIT License, consistent with the rest of the project.
