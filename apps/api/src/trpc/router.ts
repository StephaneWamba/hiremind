import { router } from "./index"
import { rolesRouter } from "./routers/roles"
import { sessionsRouter } from "./routers/sessions"
import { hintsRouter } from "./routers/hints"
import { authRouter } from "./routers/auth"

export const appRouter = router({
  auth: authRouter,
  roles: rolesRouter,
  sessions: sessionsRouter,
  hints: hintsRouter,
})

export type AppRouter = typeof appRouter
