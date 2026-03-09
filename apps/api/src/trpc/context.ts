import type { Context as HonoContext } from "hono"
import { verifyToken } from "../auth/jwt"

export async function createContext(c: HonoContext) {
  const authHeader = c.req.header("Authorization")
  const token = authHeader?.replace("Bearer ", "")

  let userId: string | null = null

  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      userId = payload.userId
    }
  }

  return {
    userId,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
