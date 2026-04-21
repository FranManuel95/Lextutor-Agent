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
OPENAI_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY    # Server-side ONLY
RESEND_API_KEY
FIGMA_API_KEY                # For Figma MCP
```

## MCP Servers Available

| MCP | Purpose |
|-----|---------|
| `context7` | Up-to-date Next.js/Tailwind/Shadcn docs — use `use context7` in prompts |
| `playwright` | E2E testing, browser automation, UI validation |
| `dbhub` | Query local Supabase PostgreSQL during development |
| `figma` | Read Figma designs, extract tokens, sync components |
| `eslint` | Lint code directly from Claude context |
| `github` | PRs, issues, code review |
| `canva` | Generate and edit design assets (already connected) |

## Design Tools

- **Claude Design** (anthropic.com) — Generate UI prototypes, slides, mockups via chat
- **Canva MCP** — Already connected: generate-design, get-assets, list-brand-kits, export-design
- **Figma MCP** — Read production Figma files (requires FIGMA_API_KEY)

## Automated Pipeline (Hooks)

- **PostToolUse (Edit/Write)** → ESLint + auto-fix on edited `.ts/.tsx` files
- **Stop** → TypeScript `tsc --noEmit` check before finishing any task

## Git Workflow

- Working branch: `claude/setup-dev-environment-0P2vM`
- Always push to designated branch: `git push -u origin <branch>`
- Retry push up to 4 times with exponential backoff on network errors
