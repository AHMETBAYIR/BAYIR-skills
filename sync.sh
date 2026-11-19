#!/usr/bin/env bash
# Compare the live skill folders with this repo, or copy changes back into it.
#
#   ./sync.sh                  # report drift only (safe, default)
#   ./sync.sh --write          # copy live -> repo
#   ./sync.sh --write deep-research
#
# NOTE: the repo is the published, platform-neutral version. A live folder may
# contain machine-specific edits (paths, local tools, NPU config). Read the
# diff before --write, and never commit a private path by accident.
#
# Sources are searched in this order: $HOME/.pi/agent/skills, $HOME/.agents/skills.
set -euo pipefail
cd "$(dirname "$0")"

WRITE=0
ARGS=()
for a in "$@"; do
  case "$a" in
    --write) WRITE=1 ;;
    -h|--help) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) ARGS+=("$a") ;;
  esac
done

SOURCES=("$HOME/.pi/agent/skills" "$HOME/.agents/skills")
EXCLUDES=(--exclude '__pycache__/' --exclude '*.pyc' --exclude '.DS_Store')
DIFF_EXCLUDES=(-x '__pycache__' -x '*.pyc' -x '.DS_Store')

if [ "${#ARGS[@]}" -gt 0 ]; then
  names=("${ARGS[@]}")
else
  names=()
  for d in skills/*/; do names+=("$(basename "$d")"); done
fi

drift=0
for name in "${names[@]}"; do
  [ -d "skills/$name" ] || { echo "skip  $name (not in repo)" >&2; continue; }
  src=""
  for s in "${SOURCES[@]}"; do
    [ -d "$s/$name" ] && { src="$s/$name"; break; }
  done
  if [ -z "$src" ]; then
    echo "local $name: no live copy (repo only)"
    continue
  fi
  if diff -rq "${DIFF_EXCLUDES[@]}" "$src" "skills/$name" >/dev/null 2>&1; then
    echo "clean $name"
    continue
  fi
  if [ "$WRITE" = "1" ]; then
    rsync -a --delete "${EXCLUDES[@]}" "$src/" "skills/$name/"
    echo "write $name <- $src"
  else
    drift=$((drift + 1))
    echo "drift $name  ($src)"
    diff -rq "${DIFF_EXCLUDES[@]}" "$src" "skills/$name" 2>/dev/null | sed 's/^/        /' | head -6
  fi
done

if [ "$WRITE" = "0" ] && [ "$drift" -gt 0 ]; then
  echo
  echo "$drift skill(s) differ. Review the diffs, then re-run with --write." >&2
fi
