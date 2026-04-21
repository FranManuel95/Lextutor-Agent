# Lextutor Agent — EstudianteElite

AI-powered legal tutoring platform for Spanish law students. Next.js 14 full-stack app with dual AI cloud architecture.

## Dev Commands

```bash
npm run dev      # Dev server (4GB memory)
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # Type check only
supabase start   # Local Supabase (API: 54321, DB: 54322)
supabase db reset # Reset + re-run migrations
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router + TypeScript 5 strict |
| UI | TailwindCSS + Shadcn/UI (30+ Radix components) |
| Database | Supabase (PostgreSQL 17, RLS, Auth, Storage) |
| AI Primary | Google Gemini (Gemini 2.0 Flash, 1.5 Flash) |
| AI Secondary | OpenAI (GPT-5.2 reasoning, GPT-4o JSON) |
| State | Zustand |
| Validation | Zod |
| Email | Resend |

## Project Structure

```
src/
  app/
    (auth)/         # Login, register — public routes
    (dashboard)/    # chat/, exam/, exams/, quiz/, progress/ — protected
    admin/          # rag/, users/ — role-gated (ADMIN only)
    api/            # API routes (chat, exam, quiz, rag, audio, me, auth)
  components/
    ui/             # Shadcn primitives — DO NOT modify directly
    layout/         # App shell, sidebar, navigation
    infographics/   # Charts, reports, PDF components
  features/
    chat/           # Chat-specific UI components
  hooks/            # use-chat-stream, use-toast, use-typewriter
  lib/              # Business logic
    ai-service.ts       # Main AI orchestrator (23KB) — routing logic here
    ai-service-gpt52.ts # GPT-5.2 Responses API
    ai-service-stream.ts # Streaming implementation
    rateLimit.ts        # Rate limiting
    supabase.ts         # Supabase client init
  server/
    security/       # RBAC checks, admin requirement middleware
  store/
    useAppStore.ts  # Zustand global store
  middleware.ts     # Auth middleware — protects all dashboard + admin routes
supabase/
  config.toml       # Local Supabase config
  migrations/       # 22 SQL migrations (Jan–Feb 2026)
```

## AI Architecture

**Toggle provider**: `AI_PROVIDER=gemini` (default) or `AI_PROVIDER=openai`

| Task | Model | Reason |
|------|-------|--------|
| Chat (reasoning) | GPT-5.2 | Deep chain-of-thought |
| Chat (fast) | Gemini 2.0 Flash | Cost ~€9/mo |
| Exam grading | Gemini 2.0 Flash | Rubric evaluation |
| Quiz/Exam generation | GPT-4o (JSON mode) | Structured output |
| Audio transcription | Gemini (native WebM) | Lower latency |
| RAG indexing | Dual: Google File Search + OpenAI Vector Store | Both providers need their own RAG |

## Security Rules — MANDATORY

- All API routes must validate Supabase session server-side
- Admin routes require `requireAdmin()` from `src/server/security/`
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never expose client-side
- All DB queries go through Supabase RLS — never bypass with service role in user-facing routes
- Security headers configured in `next.config.mjs` (X-Frame-Options, CSP, etc.)
- Rate limiting on all AI endpoints via `src/lib/rateLimit.ts`
- Input validation with Zod on all API route handlers
- No `console.log` with user data in production

## Code Standards

- TypeScript strict mode — `any` is forbidden
- Server Components by default — use `"use client"` only when required (event handlers, hooks, browser APIs)
- Shadcn/UI for all new components — do not build from scratch
- Tailwind for all styling — no CSS modules, no inline styles
- Zod schema for every API route input
- Error boundaries on all major route segments
- Accessible markup: ARIA labels, semantic HTML, keyboard navigation

## Database Patterns

- Local: `postgresql://postgres:postgres@localhost:54322/postgres`
- RLS enabled on all tables — always test with anon and authenticated roles
- Migrations in `supabase/migrations/` — never edit production schema directly
- Use Supabase MCP (`dbhub`) for queries during development

## Environment Variables

See `.env.example`. Critical:

```
AI_PROVIDER=gemini|openai
GEMINI_API_KEY
GEMINI_FILESEARCH_STORE_ID   # Google File Search store for RAG
OPENAI_API_KEY
OPENAI_ASSISTANT_ID          # Pre-configured Assistant with File Search
OPENAI_VECTOR_STORE_ID       # Vector Store for RAG documents
OPENAI_MODEL                 # Model for quiz/exam generation (e.g. gpt-4o)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY    # Server-side ONLY
RESEND_API_KEY
```

## MCP Servers Available

| MCP | Purpose |
|-----|---------|
| `context7` | Up-to-date Next.js/Tailwind/Shadcn docs — use `use context7` in prompts |
| `playwright` | E2E testing, browser automation, UI validation |
| `dbhub` | Query local Supabase PostgreSQL during development |
| `figma` | Official Figma MCP (OAuth) — reads designs, extracts tokens and components |
| `eslint` | Lint code directly from Claude context |
| `github` | PRs, issues, code review |
| `canva` | Generate and edit design assets (already connected) |

## Design Tools & Workflow

### Claude Design (claude.ai/design) — web only, no API/MCP
Available for Pro/Max/Team/Enterprise. Workflow:
1. Ir a **claude.ai/design** → describir la UI en chat (Claude Opus 4.7)
2. Claude lee tu GitHub repo URL y aplica tu design system automáticamente
3. Refinar con chat, edición inline, o sliders generados por Claude
4. Exportar: **PDF, PPTX, HTML/ZIP, Canva, URL interna**
5. Para construir el código: exportar como "Handoff to Claude Code" desde la UI → Claude Code recibe el bundle con diseño + reasoning e implementa los componentes

### Figma MCP (OAuth) — primera vez
Al usar el MCP `figma` por primera vez, Claude Code abrirá el navegador automáticamente para autenticarte con tu cuenta Figma. Sin API key. Bug conocido: el token OAuth a veces no persiste en `~/.claude.json` — si falla, re-autenticar con `/mcp` → select figma → Authenticate.

### Canva MCP — ya conectado
Genera assets, gestiona brand kits, exporta diseños directamente desde Claude.

## Automated Pipeline (Hooks)

- **PreToolUse (Edit/Write)** → Blocks writes to `.env`, `.pem`, `.key` and credential files
- **PostToolUse (Edit/Write)** → ESLint `--fix` on edited `.ts/.tsx/.js/.jsx` files
- **Stop** → TypeScript `tsc --noEmit` only when TS files changed

## Formatting

- **Prettier** configured in `.prettierrc` with `prettier-plugin-tailwindcss`
- `npm run format` — format all `src/**` files
- `npm run format:check` — CI check (no writes)

## Git Workflow

- Working branch: `claude/setup-dev-environment-0P2vM`
- Always push to designated branch: `git push -u origin <branch>`
- Retry push up to 4 times with exponential backoff on network errors
