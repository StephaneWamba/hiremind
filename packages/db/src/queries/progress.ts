import { db } from "../client"
import { interviewSessions, evaluations } from "../schema"
import { eq } from "drizzle-orm"

export async function getUserInterviewStats(userId: string) {
  const sessions = await db.query.interviewSessions.findMany({
    where: eq(interviewSessions.userId, userId),
  })

  return {
    totalInterviews: sessions.length,
    completedInterviews: sessions.filter((s) => s.status === "completed").length,
  }
}
