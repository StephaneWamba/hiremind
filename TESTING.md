# HireMind Testing Guide

This document outlines how to test the HireMind interview platform end-to-end.

## Architecture Overview

The platform consists of:
- **Frontend** (apps/web): Next.js 15 on Vercel
- **Backend API** (apps/api): Hono on Fly.io
- **Database** (packages/db): Neon PostgreSQL
- **Authentication**: Clerk

## Testing Levels

### 1. Unit & Integration Tests

Run quick smoke tests on the API:

```bash
# Test API endpoints
node scripts/test-interview-flow.js https://hiremind-api.fly.dev

# Output:
# 🧪 HireMind Interview Flow Test
# 📡 API URL: https://hiremind-api.fly.dev
# 1️⃣  Testing roles.list... ✓ Found 7 job roles
# 2️⃣  Testing sessions.create... [requires user]
# ...
```

### 2. End-to-End (E2E) Tests

For full flow testing with actual WebSocket connections:

```bash
# Install dependencies
npm install  # or pnpm install

# Run full E2E tests
pnpm test:e2e
```

**Note**: E2E tests require:
- A test user to exist in the database
- Clerk authentication or a test token mechanism

## Setting Up Test Data

### Option A: Use Production Database with Test User (Recommended)

1. Sign up with a test account on https://hiremind-beta.vercel.app
2. Get your Clerk user ID from the Clerk dashboard
3. Use that user ID in test scripts:

```bash
TEST_USER_ID="your-clerk-id" pnpm test:e2e
```

### Option B: Seed Test Data Locally

```bash
# Create .env.local in apps/api
echo "DATABASE_URL=postgresql://..." > apps/api/.env.local

# Run development environment
pnpm dev

# In another terminal, seed data
pnpm seed

# Run tests
pnpm test:e2e
```

### Option C: Direct Database Seeding (Production)

Connect to Fly.io and run seed:

```bash
# SSH into the Fly.io machine
flyctl ssh console -a hiremind-api

# Inside the console:
npm run seed
```

## Interview Flow Testing Checklist

### Core Flows

- [ ] **Session Creation**
  - [ ] Create session with role, type, level, mode
  - [ ] Verify wsToken is returned and valid
  - [ ] Verify session is persisted in database

- [ ] **WebSocket Connection**
  - [ ] Connect with valid wsToken
  - [ ] Receive "ready" message on successful join
  - [ ] Reject connection with invalid token
  - [ ] Reject duplicate sessions (two-tab protection)

- [ ] **Text Response Flow**
  - [ ] Send text_response message
  - [ ] Receive "thinking" status
  - [ ] Receive interviewer transcript chunks
  - [ ] Verify turn is persisted in database

- [ ] **Voice Response Flow** (requires audio)
  - [ ] Send audio_chunk messages
  - [ ] Send end_turn message
  - [ ] Receive transcribed text
  - [ ] Receive interviewer response

- [ ] **Code Submission Flow**
  - [ ] Submit code with language
  - [ ] Receive AI feedback
  - [ ] Execute code (run_code message)
  - [ ] Request hints (code_hint_request)

- [ ] **Session Persistence**
  - [ ] After each turn, verify conversationTurns table entry
  - [ ] Verify turn_number is sequential
  - [ ] Verify role (interviewer/candidate) is correct

- [ ] **Reconnection**
  - [ ] Disconnect and reconnect within 90s
  - [ ] Receive transcript_replay message
  - [ ] Continue conversation from where left off
  - [ ] Verify no duplicate turns in database

- [ ] **Session End**
  - [ ] Send end_interview message
  - [ ] Receive interview_ended message
  - [ ] Verify session status changes to "completed"
  - [ ] Verify final evaluation is persisted

### Performance Metrics

Track these metrics during testing:

- [ ] Session creation time: < 200ms
- [ ] First AI response time: < 2s
- [ ] Subsequent turns: < 1s
- [ ] Message round-trip: < 100ms
- [ ] WebSocket latency: < 50ms (local), < 200ms (cross-region)

### Error Handling

Test these error scenarios:

- [ ] Invalid wsToken → error with code "invalid_token"
- [ ] Session not found → error with code "session_not_found"
- [ ] Session already active → error with code "session_active"
- [ ] Invalid message format → error
- [ ] Rapid fire requests → handled gracefully with "busy" status
- [ ] Database connection loss → graceful error message

## Test Script Usage

### Simple API Test (No WebSocket)

```bash
node scripts/test-interview-flow.js [api_url]

# Examples:
node scripts/test-interview-flow.js https://hiremind-api.fly.dev
node scripts/test-interview-flow.js http://localhost:3000
```

### Full E2E Test (With WebSocket)

```bash
npx ts-node scripts/run-e2e-test.ts [api_url] [ws_url]

# Examples:
npx ts-node scripts/run-e2e-test.ts https://hiremind-api.fly.dev wss://hiremind-api.fly.dev
npx ts-node scripts/run-e2e-test.ts http://localhost:3000 ws://localhost:3000
```

### Playwright Tests

```bash
# Browser-based integration tests
pnpm test:playwright

# Run specific test file
pnpm test:playwright tests/interview-flow-e2e.spec.ts

# Run in debug mode
pnpm test:playwright --debug
```

## Known Limitations

1. **Clerk Integration**: Full authentication testing requires Clerk test credentials
2. **Audio Processing**: Voice STT/TTS testing requires Deepgram API key
3. **Code Execution**: Code submission testing requires Piston API
4. **Local Development**: `npm install` may have issues; use Fly.io deployment for reliable testing

## Debugging

### View API Logs

```bash
flyctl logs -a hiremind-api
```

### View Database State

```bash
# Open Drizzle Studio
pnpm db:studio

# Or query directly
DATABASE_URL=neon:... npx drizzle-kit query
```

### Monitor WebSocket Connections

In the API logs, look for:
- `handleWsConnection` entries
- `Token verified: {sessionId}`
- `Agent turn completed`
- `Session persisted`

## CI/CD Testing

Tests run on:
- Push to `main` branch
- Manual trigger via GitHub Actions
- Before Vercel deployment

Environment:
- Node.js 20+
- API deployed to production
- Database points to production Neon instance
