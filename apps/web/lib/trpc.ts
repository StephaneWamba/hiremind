import { createTRPCReact } from "@trpc/react-query"
import type { AppRouter } from "@hiremind/api/trpc"

export const trpc = createTRPCReact<AppRouter>()
