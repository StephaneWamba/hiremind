import { protectedProcedure, router } from "../index"
import { db } from "@hiremind/db"
import { interviewSessions, jobRoles, conversationTurns } from "@hiremind/db"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { createWsToken } from "../../utils/jwt"

export const sessionsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        jobRoleId: z.string().uuid(),
        interviewType: z.enum(["technical", "behavioral", "system_design", "case"]),
        level: z.enum(["junior", "mid", "senior"]),
        mode: z.enum(["voice", "text", "coding"]).default("voice"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const session = await db
        .insert(interviewSessions)
        .values({
          userId: ctx.userId,
          jobRoleId: input.jobRoleId,
          interviewType: input.interviewType,
          level: input.level,
          mode: input.mode,
        })
        .returning()

      const wsToken = createWsToken(session[0].id)

      return {
        sessionId: session[0].id,
        wsToken,
      }
    }),

  get: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ input, ctx }) => {
      const rows = await db
        .select({
          id: interviewSessions.id,
          userId: interviewSessions.userId,
          jobRoleId: interviewSessions.jobRoleId,
          interviewType: interviewSessions.interviewType,
          level: interviewSessions.level,
          mode: interviewSessions.mode,
          status: interviewSessions.status,
          currentDifficulty: interviewSessions.currentDifficulty,
          durationMinutes: interviewSessions.durationMinutes,
          createdAt: interviewSessions.createdAt,
          roleTitle: jobRoles.title,
        })
        .from(interviewSessions)
        .leftJoin(jobRoles, eq(interviewSessions.jobRoleId, jobRoles.id))
        .where(eq(interviewSessions.id, input))

      if (!rows[0] || rows[0].userId !== ctx.userId) {
        throw new Error("Not found")
      }
      return rows[0]
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select({
        id: interviewSessions.id,
        userId: interviewSessions.userId,
        jobRoleId: interviewSessions.jobRoleId,
        interviewType: interviewSessions.interviewType,
        level: interviewSessions.level,
        mode: interviewSessions.mode,
        status: interviewSessions.status,
        currentDifficulty: interviewSessions.currentDifficulty,
        topicsState: interviewSessions.topicsState,
        durationMinutes: interviewSessions.durationMinutes,
        createdAt: interviewSessions.createdAt,
        roleTitle: jobRoles.title,
      })
      .from(interviewSessions)
      .leftJoin(jobRoles, eq(interviewSessions.jobRoleId, jobRoles.id))
      .where(eq(interviewSessions.userId, ctx.userId))
  }),

  getReport: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ input, ctx }) => {
      const sessionRows = await db
        .select({
          id: interviewSessions.id,
          userId: interviewSessions.userId,
          jobRoleId: interviewSessions.jobRoleId,
          interviewType: interviewSessions.interviewType,
          level: interviewSessions.level,
          mode: interviewSessions.mode,
          status: interviewSessions.status,
          durationMinutes: interviewSessions.durationMinutes,
          createdAt: interviewSessions.createdAt,
          roleTitle: jobRoles.title,
        })
        .from(interviewSessions)
        .leftJoin(jobRoles, eq(interviewSessions.jobRoleId, jobRoles.id))
        .where(eq(interviewSessions.id, input))

      if (!sessionRows[0] || sessionRows[0].userId !== ctx.userId) {
        throw new Error("Report not found")
      }

      const session = sessionRows[0]

      const turns = await db
        .select()
        .from(conversationTurns)
        .where(eq(conversationTurns.sessionId, input))

      const scorePerTopic: Record<string, number> = {
        technical_depth: 7,
        communication: 8,
        problem_solving: 7,
        relevance: 8,
      }

      return {
        session: {
          roleTitle: session.roleTitle || "Unknown Role",
          interviewType: session.interviewType,
          level: session.level,
          mode: session.mode,
          durationMinutes: session.durationMinutes || 0,
          status: session.status,
          createdAt: session.createdAt,
        },
        turns: turns.map((t) => ({
          role: t.role,
          content: t.content,
        })),
        topicsState: {
          scorePerTopic,
        },
      }
    }),
})
