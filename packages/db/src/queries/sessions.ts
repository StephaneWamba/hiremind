import { db } from "../client"
import { interviewSessions, conversationTurns, evaluations } from "../schema"
import { eq } from "drizzle-orm"

export async function getSessionById(sessionId: string) {
  return await db.query.interviewSessions.findFirst({
    where: eq(interviewSessions.id, sessionId),
  })
}

export async function getUserSessions(userId: string) {
  return await db.query.interviewSessions.findMany({
    where: eq(interviewSessions.userId, userId),
    orderBy: (t) => t.createdAt,
  })
}

export async function createSession(data: typeof interviewSessions.$inferInsert) {
  return await db.insert(interviewSessions).values(data).returning()
}
