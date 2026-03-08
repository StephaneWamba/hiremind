import { db } from "../client"
import { evaluations } from "../schema"
import { eq } from "drizzle-orm"

export async function getEvaluation(sessionId: string) {
  return await db.query.evaluations.findFirst({
    where: eq(evaluations.sessionId, sessionId),
  })
}

export async function createEvaluation(data: typeof evaluations.$inferInsert) {
  return await db.insert(evaluations).values(data).returning()
}
