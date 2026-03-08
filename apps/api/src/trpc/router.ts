import { router } from "./index"
import { rolesRouter } from "./routers/roles"
import { sessionsRouter } from "./routers/sessions"
import { hintsRouter } from "./routers/hints"

export const appRouter = router({
  roles: rolesRouter,
  sessions: sessionsRouter,
  hints: hintsRouter,
})

export type AppRouter = typeof appRouter
