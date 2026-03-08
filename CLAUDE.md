# HireMind — Claude Code Instructions

## Project
AI Mock Interview Platform. Full plan: `C:\Users\QURISK\.claude\plans\streamed-squishing-lecun.md`

## Monorepo Structure
```
apps/web      → Next.js 15, Vercel
apps/api      → Hono + Node.js 20, Fly.io
packages/db   → Drizzle ORM + Neon PostgreSQL
packages/shared → Zod schemas + shared TypeScript types
scripts/      → seed-questions.ts (question bank generation)
```

## Tech Stack (never deviate without discussing)
- Frontend: Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, tRPC v11, Zustand
- Backend: Hono, ws (WebSocket), @anthropic-ai/sdk, @deepgram/sdk, Drizzle ORM
- Auth: Clerk
- DB: Neon PostgreSQL via Drizzle ORM
- Audio storage: Cloudflare R2 (NOT S3, NOT Supabase Storage)
- STT: Deepgram Nova-3 (streaming WebSocket)
- TTS: Deepgram Aura-2 (streaming)
- AI model: `claude-haiku-4-5-20251001` (cost-optimized, ~3x cheaper than Sonnet)
- Package manager: pnpm (workspaces)

## Interview Agent Architecture — CRITICAL RULES

The agent uses an **in-process Agent SDK pattern**. These rules are non-negotiable:

1. **`messages[]` array stays in Node.js RAM** for the entire interview. Never serialize it to DB mid-session.
2. **Zero DB reads in the inner agent loop.** Questions are preloaded at session start into `session.questions[]`.
3. **Zero synchronous DB writes during the interview.** All writes are async (snapshots every 5 turns, full write at end).
4. **System prompt is static per session.** Built once at start. Does NOT contain conversation history.
5. **Tools are in-memory.** `evaluate_answer` updates `session.state`. `get_next_question` filters `session.questions[]`. No DB calls in either.
6. **Inner loop pattern:**
   ```
   while (true) {
     response = await claude(messages, tools, system)
     messages.push(response)
     if (stop_reason === "end_turn") break
     messages.push(processTools(response))
   }
   ```
7. **Session lives in** `sessions: Map<string, InterviewSession>` on the Fly.io process.

Violating any of these rules causes latency degradation and must be discussed first.

## Package Conventions
- All imports use workspace packages: `@hiremind/shared`, `@hiremind/db`
- DB queries live in `packages/db/src/queries/` — never write raw SQL in apps/
- Shared types live in `packages/shared/src/types.ts`
- Zod schemas live in `packages/shared/src/schemas.ts`

## tRPC
- Used for all HTTP API calls (sessions CRUD, evaluation fetch, progress queries, roles list)
- WebSocket is separate (raw ws library, NOT tRPC subscriptions)
- Router root: `apps/api/src/trpc/router.ts`

## WebSocket Auth
- tRPC endpoint issues a short-lived JWT (30s TTL) when session is created
- Client sends `{ type: "join", sessionId, token }` as first WS message
- WS handler verifies token — never use cookies for WS auth

## Audio
- Browser: `MediaRecorder` with `audio/webm;codecs=opus`
- STT: stream binary chunks via WebSocket → Deepgram streaming
- TTS: stream Claude text sentence-by-sentence → Deepgram Aura-2 → audio chunks → WebSocket
- Storage: buffer chunks in memory, batch upload to R2 at session end (async)
- R2 key format: `interviews/{sessionId}/{turnNumber}/{role}.webm`

## Deployment
- **Fly.io**: `apps/api`. `autostop = "off"`. Persistent machine. Never use serverless for the API.
- **Vercel**: `apps/web`. Auto-deploy from main branch.
- **No Docker Compose** for local dev. Run `pnpm dev` in each app directly.

## Database
- Drizzle ORM. All schema in `packages/db/src/schema.ts`.
- Migrations: `pnpm db:generate` (generate) → `pnpm db:migrate` (apply to prod)
- Dev: `pnpm db:push` against Neon dev branch
- Never write raw SQL outside of `packages/db/src/queries/`

## Coding Style
- TypeScript strict mode everywhere
- No `any` — use `unknown` + type guards
- Prefer `async/await` over `.then()`
- Error handling: use typed errors, never swallow exceptions silently
- Keep functions small and single-purpose
- No over-engineering — build exactly what's needed
