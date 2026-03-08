import { z } from "zod"

// Enums
export const InterviewLevelSchema = z.enum(["junior", "mid", "senior"])
export const InterviewTypeSchema = z.enum(["technical", "behavioral", "system_design", "case"])
export const InterviewModeSchema = z.enum(["voice", "text", "coding"])
export const InterviewStatusSchema = z.enum(["setup", "in_progress", "completed", "abandoned"])
export const HireRecommendationSchema = z.enum(["strong_yes", "yes", "maybe", "no"])

// API request/response schemas
export const CreateSessionSchema = z.object({
  jobRoleId: z.string().uuid(),
  interviewType: InterviewTypeSchema,
  level: InterviewLevelSchema,
  mode: InterviewModeSchema.default("voice"),
})

export const SubmitResponseSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1),
  audioMetadata: z.object({
    duration: z.number().positive(),
  }).optional(),
})

export const EvaluationSchema = z.object({
  score: z.number().min(1).max(10),
  categories: z.record(z.string(), z.number().min(1).max(10)),
  reasoning: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  should_probe_deeper: z.boolean(),
  new_difficulty: z.number().min(1).max(10),
})

export const GetNextQuestionSchema = z.object({
  topic: z.string(),
  difficulty: z.number().min(1).max(10),
  question_type: z.enum(["concept", "scenario", "coding", "design", "behavioral"]),
})

export const EndInterviewSchema = z.object({
  reason: z.enum(["completed", "time_up", "candidate_request"]),
  closing_message: z.string(),
})

// Message types for WebSocket
export const ClientMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("join"), sessionId: z.string().uuid(), token: z.string() }),
  z.object({ type: z.literal("audio_chunk"), data: z.instanceof(ArrayBuffer) }),
  z.object({ type: z.literal("end_turn") }),
  z.object({ type: z.literal("text_response"), content: z.string().min(1) }),
  z.object({ type: z.literal("code_submission"), code: z.string().min(1), language: z.string() }),
  z.object({ type: z.literal("run_code"), code: z.string().min(1), language: z.string() }),
  z.object({ type: z.literal("code_hint_request"), code: z.string(), language: z.string() }),
  z.object({ type: z.literal("end_interview") }),
])

export const AiFeedbackItemSchema = z.object({
  type: z.enum(["positive", "warning", "suggestion"]),
  message: z.string(),
  lineNumber: z.number().int().positive().optional(),
})

export const ServerMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ready") }),
  z.object({ type: z.literal("transcript"), role: z.enum(["interviewer", "candidate"]), content: z.string() }),
  z.object({ type: z.literal("thinking") }),
  z.object({ type: z.literal("audio_start") }),
  z.object({ type: z.literal("audio_chunk"), data: z.instanceof(ArrayBuffer) }),
  z.object({ type: z.literal("audio_end") }),
  z.object({ type: z.literal("listening") }),
  z.object({ type: z.literal("code_output"), stdout: z.string(), stderr: z.string(), exitCode: z.number().int() }),
  z.object({ type: z.literal("code_feedback"), items: z.array(AiFeedbackItemSchema), complexity: z.string().optional() }),
  z.object({ type: z.literal("transcript_replay"), turns: z.array(z.unknown()) }),
  z.object({ type: z.literal("busy") }),
  z.object({ type: z.literal("interview_ended"), sessionId: z.string().uuid() }),
  z.object({ type: z.literal("error"), code: z.string().optional(), message: z.string() }),
  z.object({ type: z.literal("turn_evaluation"), evaluation: EvaluationSchema }),
])

export type ClientMessage = z.infer<typeof ClientMessageSchema>
export type ServerMessage = z.infer<typeof ServerMessageSchema>
