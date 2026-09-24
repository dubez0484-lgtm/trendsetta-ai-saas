#!/bin/bash
# SessionStart hook: prepares Claude Code on the web sessions so lint,
# typecheck and build work immediately (mobile codespace setup).
set -euo pipefail

# Only run in remote (Claude Code on the web) sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# npm install (not ci) so the cached container state is reused between sessions.
npm install --no-audit --no-fund

# Seed local env from the template if missing. Real keys come from the
# cloud environment's variables, which override these placeholders.
if [ ! -f .env.local ] && [ -f .env.example ]; then
  cp .env.example .env.local
fi
