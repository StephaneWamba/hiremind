import { protectedProcedure, publicProcedure, router } from "../index"
import { db } from "@hiremind/db"
import { interviewSessions } from "@hiremind/db"
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
      return await db
        .select()
        .from(interviewSessions)
        .where(eq(interviewSessions.id, input))
        .then((rows) => {
          if (!rows[0] || rows[0].userId !== ctx.userId) {
            throw new Error("Not found")
          }
          return rows[0]
        })
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, ctx.userId))
  }),
})
