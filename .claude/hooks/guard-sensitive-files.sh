#!/bin/bash
# PreToolUse hook: blocks writes to sensitive files (.env, secrets, keys).
# Returns exit code 2 to block the tool call and show a message to Claude.

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

BASENAME=$(basename "$FILE_PATH")

BLOCKED_PATTERNS=(
  "^\.env$"
  "^\.env\.local$"
  "^\.env\.production$"
  "^\.env\.staging$"
  "\.pem$"
  "\.key$"
  "id_rsa"
  "id_ed25519"
  "credentials\.json$"
  "service-account.*\.json$"
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if [[ "$BASENAME" =~ $pattern ]]; then
    echo "[guard] BLOCKED: Writing to sensitive file '$FILE_PATH' requires explicit user confirmation."
    echo "[guard] If this is intentional, the user must approve this action directly."
    exit 2
  fi
done

exit 0
