#!/bin/bash
# Full-text search across the warship dossiers. Prints file:line: text.
# Usage: scripts/lookup.sh "16-inch"   |   scripts/lookup.sh "powder hoist" --nation japan
set -e
cd "$(dirname "$0")/.."
term="$1"; shift || true
scope="warships"
if [ "$1" = "--nation" ] && [ -n "$2" ]; then scope="warships/$2"; fi
if [ -z "$term" ]; then echo "usage: scripts/lookup.sh \"<term>\" [--nation <slug>]"; exit 1; fi
if command -v rg >/dev/null 2>&1; then
  rg -n -i --glob '*.md' --glob '!INDEX.md' "$term" "$scope"
else
  grep -rn -i --include='*.md' --exclude='INDEX.md' "$term" "$scope"
fi
