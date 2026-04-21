#!/bin/bash
# SessionStart hook: muestra el estado del entorno al inicio de cada sesión de Claude Code.

set -uo pipefail

cd /home/user/Lextutor-Agent

echo "╔══════════════════════════════════════════════╗"
echo "║        EstudianteElite — Session Start       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Git branch y estado
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
echo "📌 Branch: $BRANCH"
if [[ "$DIRTY" -gt 0 ]]; then
  echo "⚠️  $DIRTY fichero(s) sin commitear"
else
  echo "✅ Working tree limpio"
fi

# Último commit
LAST_COMMIT=$(git log --oneline -1 2>/dev/null || echo "sin commits")
echo "📝 Último commit: $LAST_COMMIT"
echo ""

# Verificar .env
if [[ -f ".env" ]]; then
  echo "✅ .env presente"
else
  echo "❌ .env NO encontrado — copia .env.example y configura las vars"
fi

# Verificar node_modules
if [[ -d "node_modules" ]]; then
  echo "✅ node_modules instalado"
else
  echo "❌ node_modules ausente — ejecuta: npm install"
fi

echo ""
echo "━━━ Comandos rápidos ━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  npm run dev        → servidor de desarrollo"
echo "  npm run test       → tests en watch"
echo "  npm run storybook  → catálogo de componentes"
echo "  supabase start     → base de datos local"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit 0
