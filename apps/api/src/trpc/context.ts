import type { Context as HonoContext } from "hono"
import { db } from "@hiremind/db"
import { users } from "@hiremind/db"
import { eq } from "drizzle-orm"

export async function createContext(c: HonoContext) {
  const authHeader = c.req.header("Authorization")
  const token = authHeader?.replace("Bearer ", "") || null

  let userId: string | null = null

  // If token looks like a UUID, use it directly (for backward compatibility)
  if (token && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    userId = token
  } else if (token) {
    // Otherwise, treat it as a Clerk ID and look up the user
    try {
      const user = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, token))
        .limit(1)

      if (user.length > 0) {
        userId = user[0].id
      }
    } catch (err) {
      console.error("Failed to lookup user by Clerk ID:", err)
    }
  }

  return {
    userId,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
