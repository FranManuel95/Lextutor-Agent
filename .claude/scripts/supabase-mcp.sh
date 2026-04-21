#!/usr/bin/env bash
# Loads SUPABASE_ACCESS_TOKEN from .env.local (gitignored) before launching
# the Supabase MCP server so credentials never end up in settings.json.
#
# Setup:
#   echo "SUPABASE_ACCESS_TOKEN=sbp_xxxx" >> .env.local
#   (get token at https://supabase.com/dashboard/account/tokens)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

if [ -f "${PROJECT_ROOT}/.env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${PROJECT_ROOT}/.env.local"
  set +a
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "ERROR: SUPABASE_ACCESS_TOKEN not set." >&2
  echo "Add it to .env.local: SUPABASE_ACCESS_TOKEN=sbp_xxxx" >&2
  echo "Get a token at: https://supabase.com/dashboard/account/tokens" >&2
  exit 1
fi

exec npx -y @supabase/mcp-server-supabase@latest "${@}"
