#!/bin/bash
# PostToolUse hook: runs ESLint --fix on edited TypeScript/JavaScript files.
# Receives JSON on stdin with tool_input.file_path.

set -uo pipefail

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

if [[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx|mjs|cjs)$ ]]; then
  exit 0
fi

if [[ ! -f "$FILE_PATH" ]]; then
  exit 0
fi

cd /home/user/Lextutor-Agent

echo "[lint-on-edit] Linting: $FILE_PATH"
npx eslint --fix "$FILE_PATH" 2>&1 | head -40 || true

exit 0
