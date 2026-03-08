# HireMind

> AI-powered mock interview platform — practice realistic job interviews with an adaptive AI interviewer that evaluates, challenges, and helps you improve.

## What It Does

HireMind replaces a human mock interviewer. Candidates simulate real job interviews with an AI that:

- **Adapts in real time** — gets harder when you perform well, easier when you struggle
- **Probes and challenges** — asks follow-ups, challenges vague answers, changes direction
- **Evaluates per answer** — scores every response across multiple dimensions (technical depth, communication, reasoning)
- **Generates detailed reports** — overall score, strengths, weaknesses, improvement suggestions, hire signal
- **Tracks progress** — shows skill progression over multiple sessions, recurring weaknesses

## Interview Types

| Type | Description |
|------|-------------|
| Technical | Programming, APIs, architecture, debugging |
| System Design | Design URL shorteners, chat systems, scalable backends |
| Behavioral | Teamwork, leadership, conflict resolution, project experience |
| Case | Consulting, product strategy, business problems |

## Supported Roles

- Backend Engineer
- Frontend Engineer
- Machine Learning Engineer
- Product Manager
- Product Analyst
- Consultant
- Marketing Manager

## Modes

- **Voice** (primary) — speak naturally, AI responds with synthesized voice
- **Text** — type responses, AI replies in text

---

## Architecture

### Overview

```
[Browser — Next.js on Vercel]
    │
    ├─ tRPC (HTTPS) ──────────→ [Hono API on Fly.io]
    │   sessions, reports,          ├─ tRPC routes
    │   progress, profiles          ├─ Drizzle → Neon PostgreSQL
    │                               └─ Clerk webhooks
    │
    └─ WebSocket ─────────────→ [Hono WS on Fly.io]
        audio + text turns          ├─ Deepgram STT (streaming)
                                    ├─ Claude Agent Loop
                                    └─ Deepgram TTS → audio back
```

### Interview Agent

The AI interviewer is an in-process agent loop (inspired by the Claude Agent SDK) running on a persistent Fly.io machine. The key design principle: **the `messages[]` array is the agent's memory** — it lives in RAM for the entire interview, never serialized to the database mid-session.

```
Session Start:
  → Load candidate profile from DB (1 read)
  → Preload all questions for (role, type) into memory (1 read)
  → Build static system prompt
  → Ready

Per Turn (zero DB I/O):
  → Candidate speaks → Deepgram STT → transcript
  → Append to messages[]
  → Inner Agent Loop:
       Claude(messages, tools) → tool calls → tool results → Claude → ...
  → Stream text response → Deepgram TTS → audio → browser

Session End:
  → Full async DB write (all turns, evaluation, scores)
  → Async R2 upload (audio files)
```

Tools available to the AI interviewer:
- `evaluate_answer` — scores the response, adjusts difficulty
- `get_next_question` — picks from preloaded question bank
- `end_interview` — triggers final report generation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Auth | Clerk |
| API | tRPC v11 |
| Backend | Node.js 20 + Hono (Fly.io persistent machine) |
| WebSocket | ws library |
| AI Model | Claude claude-sonnet-4-6 via `@anthropic-ai/sdk` |
| STT | Deepgram Nova-3 (streaming, ~150ms) |
| TTS | Deepgram Aura-2 (streaming, ~90ms) |
| Database | Neon PostgreSQL + Drizzle ORM |
| Audio Storage | Cloudflare R2 |
| Package Manager | pnpm workspaces |
| CI/CD | GitHub Actions |
| Frontend Deploy | Vercel |
| Backend Deploy | Fly.io |

---

## Monorepo Structure

```
hiremind/
├── apps/
│   ├── web/          # Next.js 15 → Vercel
│   └── api/          # Hono + Node.js → Fly.io
├── packages/
│   ├── shared/       # Zod schemas + TypeScript types
│   └── db/           # Drizzle schema + queries + migrations
├── scripts/
│   └── seed-questions.ts   # Question bank generation via Claude
├── CLAUDE.md         # Instructions for Claude Code
├── project.md        # This file
└── pnpm-workspace.yaml
```

---

## Development

### Prerequisites
- Node.js 20+
- pnpm 9+
- Accounts: Clerk, Neon, Deepgram, Cloudflare, Fly.io, Vercel

### Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Push DB schema to Neon dev branch
pnpm db:push

# Seed question bank (requires ANTHROPIC_API_KEY)
pnpm seed

# Start development
pnpm dev
```

### Environment Variables

**apps/web** (`.env.local`):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_API_URL=https://hiremind-api.fly.dev
NEXT_PUBLIC_WS_URL=wss://hiremind-api.fly.dev/ws
```

**apps/api** (Fly.io secrets / `.env`):
```
DATABASE_URL=
ANTHROPIC_API_KEY=
DEEPGRAM_API_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
CORS_ORIGINS=https://hiremind.vercel.app
CF_ACCOUNT_ID=
CF_R2_ACCESS_KEY_ID=
CF_R2_SECRET_ACCESS_KEY=
CF_R2_BUCKET_NAME=hiremind-audio
```

### Key Commands

```bash
pnpm dev              # Start all apps in parallel
pnpm typecheck        # TypeScript check across all packages
pnpm lint             # Lint all packages
pnpm db:generate      # Generate Drizzle migration files
pnpm db:migrate       # Apply migrations to production DB
pnpm db:push          # Push schema to dev DB (no migration files)
pnpm db:studio        # Open Drizzle Studio (DB browser)
pnpm seed             # Generate + insert question bank
```

---

## Implementation Roadmap

| Phase | Focus | Goal |
|-------|-------|------|
| 0 | Foundation | Monorepo + both apps deployed to production |
| 1 | Interview Engine | Full voice + text interview end-to-end |
| 2 | Evaluation & Reports | Post-interview feedback, transcript replay |
| 3 | Progress & Dashboard | Historical tracking, skill progression charts |
| 4 | Polish & Recruiter | UI quality, B2B recruiter features |

---

## Key Design Decisions

**Why in-process session memory instead of DB per turn?**
DB reads add 100-200ms per turn. Over a 30-turn voice interview that's 3-6 seconds of dead time the candidate feels as unnatural pauses. Keeping `messages[]` in RAM eliminates this entirely and matches how Claude natively works.

**Why Fly.io persistent machines?**
WebSocket connections require a persistent server. Serverless functions (Vercel, Lambda) don't support long-lived connections. Fly.io persistent machines with `autostop=off` give us always-on processes with global distribution.

**Why Deepgram for both STT and TTS?**
Single SDK, single vendor, cheaper than mixing providers. Deepgram Nova-3 is best-in-class for real-time STT. Aura-2 at 90ms TTS latency is sufficient quality for the interviewer voice.

**Why tRPC?**
End-to-end TypeScript type safety across the monorepo with zero code generation. When a type changes in `packages/shared`, TypeScript catches it everywhere immediately.
