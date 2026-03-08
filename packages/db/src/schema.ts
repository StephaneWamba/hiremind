import { sql } from "drizzle-orm"
import {
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  json,
  pgTable,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"

// Enums
export const interviewLevelEnum = pgEnum("interview_level", ["junior", "mid", "senior"])
export const interviewTypeEnum = pgEnum("interview_type", ["technical", "behavioral", "system_design", "case"])
export const interviewModeEnum = pgEnum("interview_mode", ["voice", "text", "coding"])
export const interviewStatusEnum = pgEnum("interview_status", ["setup", "in_progress", "completed", "abandoned"])
export const conversationRoleEnum = pgEnum("conversation_role", ["interviewer", "candidate"])
export const hireRecommendationEnum = pgEnum("hire_recommendation", ["strong_yes", "yes", "maybe", "no"])

// Tables
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkId: text("clerk_id").notNull().unique(),
    email: text("email").notNull(),
    name: text("name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("idx_users_clerk_id").on(t.clerkId)]
)

export const candidateProfiles = pgTable(
  "candidate_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    resumeText: text("resume_text"),
    targetRoles: text("target_roles").array(),
    experienceLevel: interviewLevelEnum("experience_level"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("idx_candidate_user_id").on(t.userId)]
)

export const jobRoles = pgTable("job_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(), // engineering, product, business
  competencies: json("competencies").$type<{
    technical: string[]
    soft_skills: string[]
    domain: string[]
  }>(),
  rubric: json("rubric").$type<Record<string, any>>(),
})

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobRoleId: uuid("job_role_id").notNull().references(() => jobRoles.id),
    interviewType: interviewTypeEnum("interview_type").notNull(),
    questionText: text("question_text").notNull(),
    sampleAnswer: text("sample_answer"),
    difficulty: integer("difficulty").notNull(), // 1-10
    topics: text("topics").array().notNull(),
    tags: text("tags").array(),
  },
  (t) => [
    index("idx_questions_role_type").on(t.jobRoleId, t.interviewType),
    index("idx_questions_difficulty").on(t.difficulty),
  ]
)

export const interviewSessions = pgTable(
  "interview_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    jobRoleId: uuid("job_role_id").notNull().references(() => jobRoles.id),
    interviewType: interviewTypeEnum("interview_type").notNull(),
    level: interviewLevelEnum("level").notNull(),
    mode: interviewModeEnum("mode").default("voice"),
    status: interviewStatusEnum("status").default("setup"),
    currentDifficulty: integer("current_difficulty").default(5),
    topicsState: json("topics_state").$type<{
      covered: string[]
      remaining: string[]
      scorePerTopic: Record<string, number>
    }>(),
    summaryContext: text("summary_context"),
    questionsAsked: text("questions_asked").array().default(sql`'{}'::text[]`),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationMinutes: integer("duration_minutes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("idx_sessions_user_id").on(t.userId),
    index("idx_sessions_status_created").on(t.status, t.createdAt),
    index("idx_sessions_created_desc").on(t.createdAt),
  ]
)

export const conversationTurns = pgTable(
  "conversation_turns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => interviewSessions.id, { onDelete: "cascade" }),
    turnNumber: integer("turn_number").notNull(),
    role: conversationRoleEnum("role").notNull(),
    content: text("content").notNull(),
    audioR2Key: text("audio_r2_key"),
    audioDurationMs: integer("audio_duration_ms"),
    evaluation: json("evaluation").$type<{
      score: number
      reasoning: string
      strengths: string[]
      weaknesses: string[]
    }>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("idx_turns_session_turn").on(t.sessionId, t.turnNumber),
    index("idx_turns_created").on(t.createdAt),
  ]
)

export const evaluations = pgTable(
  "evaluations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .unique()
      .references(() => interviewSessions.id, { onDelete: "cascade" }),
    overallScore: numeric("overall_score", { precision: 4, scale: 2 }),
    scores: json("scores").$type<Record<string, number>>(),
    strengths: text("strengths").array(),
    weaknesses: text("weaknesses").array(),
    suggestions: text("suggestions").array(),
    detailedFeedback: text("detailed_feedback"),
    hireRecommendation: hireRecommendationEnum("hire_recommendation"),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [index("idx_evaluations_session_id").on(t.sessionId)]
)

// Type exports
export type User = typeof users.$inferSelect
export type CandidateProfile = typeof candidateProfiles.$inferSelect
export type JobRole = typeof jobRoles.$inferSelect
export type Question = typeof questions.$inferSelect
export type InterviewSession = typeof interviewSessions.$inferSelect
export type ConversationTurn = typeof conversationTurns.$inferSelect
export type Evaluation = typeof evaluations.$inferSelect
