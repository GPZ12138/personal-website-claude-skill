#!/usr/bin/env bash
#
# One-line installer for the `personal-website-for-ai-researcher` Claude Code skill.
#
#   curl -fsSL https://raw.githubusercontent.com/gpz12138/awesome-personal-website-skills/main/install.sh | bash
#
# Installs as a user-global skill under ~/.claude/skills so every Claude Code
# session on this machine can invoke it.
#

set -euo pipefail

REPO_URL="https://github.com/gpz12138/awesome-personal-website-skills.git"
SKILL_NAME="personal-website-for-ai-researcher"
SRC_DIR="$HOME/.claude-skills-src/awesome-personal-website-skills"
DEST_DIR="$HOME/.claude/skills/$SKILL_NAME"

info()  { printf "\033[1;34m==>\033[0m %s\n" "$*"; }
ok()    { printf "\033[1;32m✓\033[0m %s\n" "$*"; }
warn()  { printf "\033[1;33m!\033[0m %s\n" "$*"; }
err()   { printf "\033[1;31m✗\033[0m %s\n" "$*" >&2; }

require() {
    if ! command -v "$1" >/dev/null 2>&1; then
        err "Required command not found: $1"
        exit 1
    fi
}

require git

info "Cloning $REPO_URL to $SRC_DIR"
mkdir -p "$(dirname "$SRC_DIR")"
if [ -d "$SRC_DIR/.git" ]; then
    info "Repo already cloned — pulling latest"
    git -C "$SRC_DIR" pull --ff-only
else
    git clone --depth 1 "$REPO_URL" "$SRC_DIR"
fi
ok "Source ready at $SRC_DIR"

info "Linking skill into $DEST_DIR"
mkdir -p "$HOME/.claude/skills"

if [ -e "$DEST_DIR" ] || [ -L "$DEST_DIR" ]; then
    warn "Target already exists — backing up to $DEST_DIR.backup"
    rm -rf "$DEST_DIR.backup"
    mv "$DEST_DIR" "$DEST_DIR.backup"
fi

ln -s "$SRC_DIR/skills/$SKILL_NAME" "$DEST_DIR"
ok "Linked: $DEST_DIR -> $SRC_DIR/skills/$SKILL_NAME"

cat <<'BANNER'

───────────────────────────────────────────────────────────────
  Installed.

  Open Claude Code in any folder and say:

      "Build me a personal homepage, I'm an AI researcher.
       LinkedIn: <your-linkedin-url>
       Scholar:  <your-scholar-url>
       GitHub:   <your-github-username>"

  The skill will take it from there.

  Docs:  https://github.com/gpz12138/awesome-personal-website-skills
───────────────────────────────────────────────────────────────
BANNER
