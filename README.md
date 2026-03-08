# HireMind

AI-powered mock interview platform. Practice realistic job interviews with an adaptive AI interviewer that evaluates your answers in real-time, challenges weak points, and generates detailed feedback.

**Features:**
- 🤖 Adaptive AI interviewer (difficulty adjusts based on performance)
- 🎤 Voice + text interview modes
- 📊 Real-time evaluation & scoring
- 📈 Progress tracking & skill progression
- 🎯 Support for technical, behavioral, system design, and case interviews
- 7 job roles (Backend/Frontend/ML Engineer, PM, Analyst, Consultant, Marketing)

## Tech Stack

**Frontend:** Next.js 15 (Vercel)
**Backend:** Node.js + Hono (Fly.io)
**Database:** PostgreSQL (Neon) + Drizzle ORM
**Auth:** Clerk
**AI:** Claude Haiku 4.5 (cost-optimized)
**Voice:** Deepgram (STT + TTS)
**Storage:** Cloudflare R2

## Development

```bash
# Install dependencies
pnpm install

# Set environment variables
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Start development servers
pnpm dev

# TypeScript check
pnpm typecheck
```

## Documentation

- [CLAUDE.md](./CLAUDE.md) — Development guidelines
- [project.md](./project.md) — Detailed project overview
- [Implementation Plan](https://github.com/yourusername/hiremind/blob/main/PLAN.md)

## Roadmap

- **Phase 0** ✅ Foundation (monorepo, schemas, infrastructure)
- **Phase 1** Interview engine (voice + text, agent loop, Deepgram)
- **Phase 2** Evaluation & reports
- **Phase 3** Progress dashboard
- **Phase 4** Polish + recruiter features
