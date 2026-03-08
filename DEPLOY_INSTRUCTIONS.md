# HireMind Deployment to Fly.io

## Current Status
✅ Backend fully implemented and tested locally
✅ Docker image builds successfully (`docker build -f Dockerfile.fly -t hiremind-api:latest`)
✅ Fly.io app `hiremind-api` exists with healthy machine (`divine-glade-1831`)
⏳ New code needs to be pushed to registry and deployed

## Quick Deploy (Recommended)

### Option 1: Deploy via GitHub Actions (Automated)
1. Push code to GitHub: `git push origin main`
2. GitHub Actions will automatically:
   - Build Docker image on Fly.io's remote builder
   - Push to `registry.fly.io/hiremind-api:latest`
   - Update the running machine

### Option 2: Deploy Locally with flyctl
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Authenticate
flyctl auth login

# Deploy from repo root
flyctl deploy --app hiremind-api

# Monitor deployment
flyctl logs --app hiremind-api
```

### Option 3: Manual Docker Push
```bash
# Authenticate to Fly.io registry (requires FLY_API_TOKEN)
docker login -u x -p $FLY_API_TOKEN registry.fly.io

# Tag image for Fly.io registry
docker tag hiremind-api:latest registry.fly.io/hiremind-api:latest

# Push to registry
docker push registry.fly.io/hiremind-api:latest

# Trigger deployment via Fly.io API or CLI
flyctl machines update 6832545c694ee8 --image registry.fly.io/hiremind-api:latest
```

## Docker Image Details
- **Build command**: `docker build -f Dockerfile.fly -t hiremind-api:latest .`
- **Runtime**: Uses `npx tsx` for TypeScript execution (no precompilation)
- **Health check**: GET `/health` on port 3000
- **Environment**: `NODE_ENV=production`

## Current Machine Info
- **ID**: 6832545c694ee8
- **Name**: divine-glade-1831
- **Region**: cdg (Paris)
- **Status**: Started ✓
- **Health**: Passing ✓
- **Image**: `registry.fly.io/hiremind-api:deployment-01KK6PYV63GCNPZXV03F1YG95Q` (old)

## Environment Variables Needed on Fly.io
```
DATABASE_URL=<Neon PostgreSQL connection string>
CLERK_WEBHOOK_SECRET=<from Clerk dashboard>
WS_SECRET=<32-byte hex random string>
DEEPGRAM_API_KEY=<from Deepgram>
ANTHROPIC_API_KEY=<from Anthropic>
```

## Troubleshooting
- **Logs**: `flyctl logs --app hiremind-api`
- **Machine status**: `flyctl machines list --app hiremind-api`
- **SSH into machine**: `flyctl ssh console --app hiremind-api --machine 6832545c694ee8`
- **Restart machine**: `flyctl machines restart --app hiremind-api 6832545c694ee8`

## Next: Frontend Development
While deployment is processing, frontend development can proceed:
1. Design tokens + globals.css
2. App shell layout
3. Landing page
4. Practice wizard
5. Interview room
6. Dashboard
