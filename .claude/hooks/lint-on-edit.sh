#!/bin/bash
# PostToolUse hook: runs ESLint --fix on edited TypeScript/JavaScript files.
# Receives JSON on stdin with tool_input.file_path.

set -euo pipefail

INPUT=$(cat)

FILE_PATH=$(python3 -c "
import json, sys
try:
    data = json.loads('''$INPUT''' if '''$INPUT''' else '{}')
    fp = data.get('tool_input', {}).get('file_path', '')
    print(fp)
except Exception:
    print('')
" 2>/dev/null || echo "")

# Fallback: try reading file_path directly from JSON via basic parsing
if [[ -z "$FILE_PATH" ]]; then
  FILE_PATH=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")
fi

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
