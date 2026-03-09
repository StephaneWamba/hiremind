import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { db } from "@hiremind/db"
import { users } from "@hiremind/db"
import { eq } from "drizzle-orm"
import { hashPassword, verifyPassword } from "../../auth/password"
import { signAccessToken, signRefreshToken } from "../../auth/jwt"
import { router, publicProcedure } from "../index"

const SignupInput = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
})

const LoginInput = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, "Password is required"),
})

const RefreshInput = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
})

export const authRouter = router({
  signup: publicProcedure.input(SignupInput).mutation(async ({ input }) => {
    // Check if user already exists
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1)

    if (existing.length > 0) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Email already in use",
      })
    }

    // Hash password
    const passwordHash = await hashPassword(input.password)

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email: input.email,
        name: input.name,
        passwordHash,
      })
      .returning({ id: users.id, email: users.email })

    if (newUser.length === 0) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create user",
      })
    }

    const userId = newUser[0].id

    // Generate tokens
    const accessToken = signAccessToken({ userId, email: input.email })
    const refreshToken = signRefreshToken({ userId, email: input.email })

    // Save refresh token
    await db
      .update(users)
      .set({ refreshToken })
      .where(eq(users.id, userId))

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email: input.email,
        name: input.name,
      },
    }
  }),

  login: publicProcedure.input(LoginInput).mutation(async ({ input }) => {
    // Find user
    const found = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1)

    if (found.length === 0) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      })
    }

    const user = found[0]

    // Verify password
    const valid = await verifyPassword(input.password, user.passwordHash)
    if (!valid) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      })
    }

    // Generate tokens
    const accessToken = signAccessToken({ userId: user.id, email: user.email })
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email })

    // Save refresh token
    await db
      .update(users)
      .set({ refreshToken })
      .where(eq(users.id, user.id))

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }
  }),

  refresh: publicProcedure.input(RefreshInput).mutation(async ({ input }) => {
    // Find user by refresh token
    const found = await db
      .select()
      .from(users)
      .where(eq(users.refreshToken, input.refreshToken))
      .limit(1)

    if (found.length === 0) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid refresh token",
      })
    }

    const user = found[0]

    // Generate new tokens
    const accessToken = signAccessToken({ userId: user.id, email: user.email })
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email })

    // Save new refresh token
    await db
      .update(users)
      .set({ refreshToken })
      .where(eq(users.id, user.id))

    return {
      accessToken,
      refreshToken,
    }
  }),
})
