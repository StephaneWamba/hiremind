import { db } from "../client"
import { conversationTurns } from "../schema"
import { eq } from "drizzle-orm"

export async function getTurnsForSession(sessionId: string) {
  return await db.query.conversationTurns.findMany({
    where: eq(conversationTurns.sessionId, sessionId),
    orderBy: (t) => t.turnNumber,
  })
}

export async function createTurn(data: typeof conversationTurns.$inferInsert) {
  return await db.insert(conversationTurns).values(data).returning()
}
