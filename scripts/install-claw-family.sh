#!/usr/bin/env bash
#
# install-claw-family.sh — install this skill into Claw-family agent runtimes.
#
# Supported targets:
#   nanoclaw     ECC's session-aware REPL built on `claude -p`         [recommended]
#   hermes       ECC's operator shell (Telegram / CLI / TUI front door) [recommended]
#   openclaw     Multi-channel agent platform                           [SECURITY-WARNED]
#
# Usage:
#   ./scripts/install-claw-family.sh nanoclaw
#   ./scripts/install-claw-family.sh hermes
#   ./scripts/install-claw-family.sh openclaw     # prompts for confirmation
#

set -euo pipefail

TARGET="${1:-}"
SKILL_NAME="personal-website-claude-skill"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_SRC="$REPO_ROOT/skills/$SKILL_NAME"

info()  { printf "\033[1;34m==>\033[0m %s\n" "$*"; }
ok()    { printf "\033[1;32m✓\033[0m %s\n" "$*"; }
warn()  { printf "\033[1;33m!\033[0m %s\n" "$*"; }
err()   { printf "\033[1;31m✗\033[0m %s\n" "$*" >&2; }

if [ ! -d "$SKILL_SRC" ]; then
    err "Skill source not found at $SKILL_SRC"
    err "Run this script from the repo, e.g.:"
    err "  cd personal-website-claude-skill && ./scripts/install-claw-family.sh <target>"
    exit 1
fi

usage() {
    cat <<'USAGE'
Usage: install-claw-family.sh <nanoclaw|hermes|openclaw>

  nanoclaw    Verify NanoClaw can find the skill (nothing to install — the
              repo is already laid out the way NanoClaw expects). Prints the
              two invocation forms (env var + /load).

  hermes      Symlink the skill into ~/.hermes/skills/ecc-imports/. Hermes's
              ecc-imports loader will pick it up on next start.

  openclaw    Symlink into ~/.claude/skills/ as a fallback path that some
              OpenClaw bridges read. PROMPTS for confirmation because of
              ECC's documented OpenClaw security concerns (see below).

USAGE
}

if [ -z "$TARGET" ] || [ "$TARGET" = "-h" ] || [ "$TARGET" = "--help" ]; then
    usage
    exit 0
fi

case "$TARGET" in

    nanoclaw)
        info "NanoClaw target"
        if ! command -v claw >/dev/null 2>&1; then
            warn "'claw' command not on PATH. NanoClaw may not be installed."
            warn "If you have ECC's claw.js but no PATH entry, run it directly:"
            warn "  node /path/to/marketplaces/ecc/scripts/claw.js"
        fi
        ok "Skill already lives at the path NanoClaw expects:"
        echo "    $SKILL_SRC"
        echo
        ok "Invoke from this repo's root in either of two ways:"
        echo
        echo "  # Boot REPL with the skill auto-loaded as system context"
        echo "  CLAW_SKILLS=$SKILL_NAME claw"
        echo
        echo "  # Or boot empty, then load on demand inside the REPL"
        echo "  claw"
        echo "  /load $SKILL_NAME"
        echo
        ok "No filesystem changes made."
        ;;

    hermes)
        info "Hermes target"
        if [ ! -d "$HOME/.hermes" ]; then
            warn "Hermes not detected at \$HOME/.hermes."
            warn "Install Hermes first per ECC's HERMES-SETUP.md, then re-run."
            exit 1
        fi
        DEST_DIR="$HOME/.hermes/skills/ecc-imports"
        DEST="$DEST_DIR/$SKILL_NAME"
        mkdir -p "$DEST_DIR"
        if [ -e "$DEST" ] || [ -L "$DEST" ]; then
            warn "Existing entry at $DEST — backing up to $DEST.backup"
            rm -rf "$DEST.backup"
            mv "$DEST" "$DEST.backup"
        fi
        ln -s "$SKILL_SRC" "$DEST"
        ok "Symlinked: $DEST -> $SKILL_SRC"
        echo
        ok "Hermes's ecc-imports loader will pick this up on next start."
        echo "  Confirm with:  ls -l $DEST"
        ;;

    openclaw)
        cat <<'WARN'

────────────────────────────────────────────────────────────────────────────
  ⚠   OPENCLAW SECURITY ADVISORY                                          ⚠
────────────────────────────────────────────────────────────────────────────

  ECC's own published security review of OpenClaw — "OpenClaw 的隐藏危险"
  (The Hidden Dangers of OpenClaw) — documents that:

    - 41.7% of ClawdHub community skills have critical vulnerabilities
      (per an independent audit by Koi Security).
    - OpenClaw's multi-channel architecture (Telegram + Discord + WhatsApp
      + email + browser + filesystem) maximizes prompt-injection attack
      surface by design.
    - ECC's official recommendation is to MIGRATE AWAY from OpenClaw, not
      to install new skills onto it.

  Reference: docs/HERMES-OPENCLAW-MIGRATION.md in the ECC marketplace.

  This skill is read-only (it only writes static HTML / pushes to a public
  GitHub Pages repo), so the direct risk surface is limited. The ambient
  risk surface — other ClawdHub skills running alongside it inside the same
  OpenClaw process — is not.

  If you proceed:
    - Audit every other ClawdHub skill you have loaded.
    - Do NOT connect OpenClaw to channels that receive untrusted input
      (public Discord, X DMs, public Telegram bots).
    - Prefer NanoClaw or Claude Code for production runs.

────────────────────────────────────────────────────────────────────────────

Continue with the OpenClaw install? [y/N]
WARN
        read -r reply
        case "$reply" in
            y|Y|yes|YES) ;;
            *) info "Aborted."; exit 1 ;;
        esac

        # OpenClaw has no documented public skill format spec. The most
        # reliable bridge is to land the skill at the standard Claude path
        # and rely on the OpenClaw side's claude-bridge / SDK loader to
        # discover it.
        DEST_DIR="$HOME/.claude/skills"
        DEST="$DEST_DIR/$SKILL_NAME"
        mkdir -p "$DEST_DIR"
        if [ -e "$DEST" ] || [ -L "$DEST" ]; then
            warn "Existing entry at $DEST — backing up to $DEST.backup"
            rm -rf "$DEST.backup"
            mv "$DEST" "$DEST.backup"
        fi
        ln -s "$SKILL_SRC" "$DEST"
        ok "Symlinked: $DEST -> $SKILL_SRC"
        echo
        warn "Re-read the security advisory above before connecting any"
        warn "untrusted channel to this OpenClaw instance."
        ;;

    *)
        err "Unknown target: $TARGET"
        echo
        usage
        exit 1
        ;;

esac
