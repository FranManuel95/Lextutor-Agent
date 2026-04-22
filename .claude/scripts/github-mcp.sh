#!/usr/bin/env bash
# Loads GITHUB_PERSONAL_ACCESS_TOKEN from .env.local (gitignored) before
# launching the GitHub MCP server so credentials never end up in settings.json.
#
# Setup (one-time):
#   1. Create a PAT at https://github.com/settings/tokens/new
#      Scopes needed: repo, workflow, read:org
#   2. echo "GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxx" >> .env.local
#   3. Restart your Claude Code session (reloads MCP servers)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

if [ -f "${PROJECT_ROOT}/.env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${PROJECT_ROOT}/.env.local"
  set +a
fi

if [ -z "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]; then
  echo "ERROR: GITHUB_PERSONAL_ACCESS_TOKEN not set." >&2
  echo "Add it to .env.local: GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxx" >&2
  echo "Create one at: https://github.com/settings/tokens/new (scopes: repo, workflow, read:org)" >&2
  exit 1
fi

exec npx -y @modelcontextprotocol/server-github "${@}"
