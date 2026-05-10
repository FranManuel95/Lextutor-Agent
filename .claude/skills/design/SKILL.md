---
name: design
description: Design system, theming, and visual polish for the Lextutor (EstudianteElite) app. Use when working on UI consistency, light/dark themes, color tokens, typography, spacing, or any task that says "design", "tema", "estilo", "look", "diseño", "premium", "abogacía", "parchment". Enforces the dual-theme architecture (Premium Legal Parchment light + Deep Navy dark) and prevents hardcoded colors that break theme switching.
---

# Lextutor Design System

EstudianteElite is a Spanish legal-tutoring platform. Visual identity = **classic premium law firm**: serious, scholarly, expensive-feeling. Two themes share that voice in different registers.

## The two themes

### Light — Premium Legal Parchment
Inspiration: bound legal volumes, vellum/parchment, embossed gold leaf, espresso leather. Warm, scholarly, never sterile.

### Dark — Midnight Counsel
Inspiration: marble courtroom at night, deep navy, brass fixtures. Authoritative, focused.

The **sidebar always stays dark** in both themes — that's the law-firm-website pattern (dark navigation, light content).

## Token contract

All colors live in `src/app/globals.css` as **space-separated RGB** CSS variables, mapped in `tailwind.config.ts` as `rgb(var(--token) / <alpha-value>)`. NEVER add a new color outside this system.

| Token | Role | Light value | Dark value |
|---|---|---|---|
| `--gem-onyx` | App background | `250 248 245` (#FAF8F5 parchment) | `2 6 23` (#020617 navy) |
| `--gem-slate` | Secondary surface | `240 234 226` (#F0EAE2 beige) | `15 23 42` (#0F172A) |
| `--gem-mist` | Card / input bg | `255 255 255` (white) | `30 41 59` (#1E293B) |
| `--gem-offwhite` | Primary text | `28 25 23` (#1C1917 charcoal) | `248 250 252` (off-white) |
| `--gem-muted` | Secondary text | `87 83 78` (#57534E warm gray) | `148 163 184` (slate-400) |
| `--gem-border` | Borders / dividers | `212 201 188` (#D4C9BC warm) | `30 41 59` (#1E293B) |
| `--gem-blue` | Info accent | `30 64 175` (#1E40AF deep navy) | `59 130 246` (blue-500) |
| `--law-gold` | Brand accent | `160 114 18` (#A07212 amber) | `253 191 17` (#FDBF11 bright) |
| `--law-dark` | Anchor / sidebar | `28 25 23` (charcoal) | `2 6 23` (navy) |
| `--law-accent` | Subtle border alt | `212 201 188` | `30 41 59` |

`law-amber` (#b45309) is intentionally static — it's a brand mark.

## The forbidden colors

NEVER ship these — they are theme-blind and will look wrong in one mode:

- `bg-[#...]` `text-[#...]` `border-[#...]` (arbitrary hex)
- `bg-gray-*` `bg-slate-*` `bg-zinc-*` `bg-neutral-*` `bg-stone-*` (or `text-`/`border-` versions)
- `text-white` `text-black` `bg-white` `bg-black`
- Tailwind named colors (`bg-blue-500`, `text-amber-700`, etc.) outside the brand palette
- Inline `style={{ color: '#...' }}`

**Single exception**: the sidebar (`src/features/chat/components/chat-sidebar.tsx`) intentionally uses `bg-[#020617]` and similar — it stays dark in both themes by design.

When you need a color the tokens don't cover, ADD A TOKEN — don't reach for `gray-400`.

## Workflow when touching UI

1. **Before editing**, identify the role: background, surface, text, muted text, border, accent, brand.
2. **Pick the token** from the table above. If no token fits the role, add one to globals.css + tailwind.config.ts BEFORE writing the component.
3. **Use opacity modifiers** for hover/disabled states: `bg-gem-mist/80`, `text-gem-offwhite/60`.
4. **After editing**, grep your file for forbidden patterns:
   ```bash
   rg "(bg|text|border)-\[#|(bg|text|border)-(gray|slate|zinc|neutral|stone|white|black)" <file>
   ```
5. **Visually verify both themes** before committing. The Playwright MCP can take screenshots in both modes.

## Typography

- Body: Inter (`font-sans`, `var(--font-inter)`)
- Display / scholarly: Crimson Pro (`font-serif`, `var(--font-crimson)`) — use for legal headings, document titles, infographic content
- Hierarchy: stick to `text-xs` (11px) → `text-sm` (14px) → `text-base` (16px) → `text-lg` → `text-xl` → `text-2xl`. Don't invent sizes.

## Light theme component patterns

- **Cards**: `bg-gem-mist border border-gem-border` — white card on parchment, subtle warm border. Avoid pure-black shadows; use `shadow-sm` or none.
- **Inputs**: `bg-gem-mist border border-gem-border text-gem-offwhite placeholder:text-gem-muted focus:ring-law-gold`
- **Primary buttons**: `bg-law-gold text-white hover:bg-law-gold/90` (gold = action)
- **Secondary buttons**: `bg-gem-slate text-gem-offwhite hover:bg-gem-slate/80`
- **Ghost buttons**: `text-gem-offwhite hover:bg-gem-slate`
- **Dividers**: `border-gem-border` (warm, never pure black)
- **Muted labels / metadata**: `text-gem-muted`
- **Body text**: `text-gem-offwhite`
- **Links**: `text-gem-blue underline-offset-2 hover:underline`

## Dark theme component patterns

- **Cards**: `bg-gem-mist border border-gem-border` (becomes #1E293B card on #020617 bg)
- **Same semantic tokens, different values** — that's the whole point of the system.

## Hover / focus / disabled

- Hover: drop opacity by 10–20% (`/80`, `/90`) — works in both themes
- Focus: `ring-2 ring-law-gold ring-offset-2 ring-offset-gem-onyx`
- Disabled: `opacity-50 cursor-not-allowed`

## Spacing

Stick to Tailwind's default scale (4px increments). Don't use arbitrary spacing (`p-[13px]`) without reason — it breaks visual rhythm.

## Don't

- Don't add a one-off `bg-blue-500` "just for this button" — add a token or reuse one
- Don't override theme behavior with `!important`
- Don't use `dark:` variants for color tokens — the CSS variables already handle it. (`dark:` is OK for things CSS vars don't cover, like swapping an asset path)
- Don't introduce shadcn components without checking that they use our tokens. If they ship with `bg-background`/`text-foreground`, you must alias those to our tokens or rewrite them.
- Don't create new files for tokens. Everything goes in `globals.css` + `tailwind.config.ts`.

## When asked to "make it look better"

1. Check theme parity first — most "ugly" complaints in this app trace to broken theme switching, not bad design.
2. Audit hardcoded colors with the grep above.
3. Replace with tokens, verify in both themes, then iterate on layout/spacing if still ugly.
