#!/usr/bin/env bash
# Copy live skill folders back into this repo, so edits made in place can be committed.
#
#   ./sync.sh                      # sync every skill in skills/
#   ./sync.sh deep-research        # sync only the named ones
#
# Sources are searched in this order: $HOME/.pi/agent/skills, $HOME/.agents/skills.
set -euo pipefail
cd "$(dirname "$0")"

SOURCES=("$HOME/.pi/agent/skills" "$HOME/.agents/skills")
EXCLUDES=(--exclude '__pycache__/' --exclude '*.pyc' --exclude '.DS_Store')

if [ "$#" -gt 0 ]; then
  names=("$@")
else
  names=()
  for d in skills/*/; do names+=("$(basename "$d")"); done
fi

status=0
for name in "${names[@]}"; do
  [ -d "skills/$name" ] || { echo "skip  $name (not in repo)" >&2; status=1; continue; }
  found=0
  for src in "${SOURCES[@]}"; do
    if [ -d "$src/$name" ]; then
      rsync -a --delete "${EXCLUDES[@]}" "$src/$name/" "skills/$name/"
      echo "sync  $name <- $src"
      found=1
    fi
  done
  [ "$found" -eq 1 ] || { echo "miss  $name (no live copy in ${SOURCES[*]})" >&2; status=1; }
done

echo
echo "Review with: git status --short"
exit "$status"
