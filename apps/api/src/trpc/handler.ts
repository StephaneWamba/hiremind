import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "./router"
import { createContext } from "./context"
import type { Context } from "hono"

export async function handleTrpc(c: Context) {
  return await fetchRequestHandler({
    endpoint: "/trpc",
    req: c.req.raw as Request,
    router: appRouter,
    createContext: async () => {
      return createContext(c)
    },
  })
}
