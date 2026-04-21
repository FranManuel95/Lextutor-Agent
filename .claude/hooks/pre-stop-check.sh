#!/bin/bash
# Stop hook: runs TypeScript type check before Claude finishes a task.
# Surfaces type errors so they're caught before committing.

set -uo pipefail

cd /home/user/Lextutor-Agent

# Only run if TypeScript files were likely modified (check git status)
CHANGED_TS=$(git diff --name-only HEAD 2>/dev/null | grep -E '\.(ts|tsx)$' | wc -l || echo "0")
STAGED_TS=$(git diff --cached --name-only 2>/dev/null | grep -E '\.(ts|tsx)$' | wc -l || echo "0")

if [[ "$CHANGED_TS" -eq 0 && "$STAGED_TS" -eq 0 ]]; then
  exit 0
fi

echo "[pre-stop] TypeScript check ($CHANGED_TS changed, $STAGED_TS staged TS files)..."

set +e
npx tsc --noEmit 2>&1 | head -60
TS_EXIT=${PIPESTATUS[0]}
set -e

if [[ $TS_EXIT -ne 0 ]]; then
  echo ""
  echo "[pre-stop] WARNING: TypeScript errors found above. Fix before committing."
fi

exit 0
