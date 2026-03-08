// Core domain types shared between apps/api and apps/web

export type InterviewLevel = "junior" | "mid" | "senior"
export type InterviewType = "technical" | "behavioral" | "system_design" | "case"
export type InterviewMode = "voice" | "text" | "coding"
export type InterviewStatus = "setup" | "in_progress" | "completed" | "abandoned"
export type ConversationRole = "interviewer" | "candidate"
export type HireRecommendation = "strong_yes" | "yes" | "maybe" | "no"
export type QuestionType = "concept" | "scenario" | "coding" | "design" | "behavioral"

export interface JobRole {
  id: string
  slug: string
  title: string
  category: "engineering" | "product" | "business"
  competencies: {
    technical: string[]
    soft_skills: string[]
    domain: string[]
  }
}

export interface Question {
  id: string
  jobRoleId: string
  interviewType: InterviewType
  questionText: string
  difficulty: number // 1-10
  topics: string[]
  tags: string[]
}

export interface TurnEvaluation {
  score: number
  categories: Record<string, number>
  reasoning: string
  strengths: string[]
  weaknesses: string[]
  should_probe_deeper: boolean
  new_difficulty: number
}

export interface ConversationTurn {
  role: ConversationRole
  text: string
  timestamp: Date
  questionId?: string
  evaluation?: TurnEvaluation
}

export interface SessionState {
  difficulty: number
  topicsCovered: string[]
  topicsRemaining: string[]
  scores: Record<string, number[]> // category → array of scores per turn
  questionsUsed: string[]
  turnCount: number
  startedAt: string // ISO
  ended: boolean
  lastEvaluation?: TurnEvaluation
}

export interface EvaluationReport {
  sessionId: string
  overallScore: number
  scores: Record<string, number>
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  detailedFeedback: string
  hireRecommendation: HireRecommendation
}

// WebSocket protocol — Client → Server
export type ClientMessage =
  | { type: "join"; sessionId: string; token: string }
  | { type: "audio_chunk"; data: ArrayBuffer }
  | { type: "end_turn" }
  | { type: "text_response"; content: string }
  | { type: "code_submission"; code: string; language: string }
  | { type: "run_code"; code: string; language: string }
  | { type: "code_hint_request"; code: string; language: string }
  | { type: "end_interview" }

// WebSocket protocol — Server → Client
export type ServerMessage =
  | { type: "ready" }
  | { type: "transcript"; role: ConversationRole; content: string }
  | { type: "thinking" }
  | { type: "audio_start" }
  | { type: "audio_chunk"; data: ArrayBuffer }
  | { type: "audio_end" }
  | { type: "listening" }
  | { type: "code_output"; stdout: string; stderr: string; exitCode: number }
  | { type: "code_feedback"; items: AiFeedbackItem[]; complexity?: string }
  | { type: "transcript_replay"; turns: ConversationTurn[] }
  | { type: "busy" }
  | { type: "interview_ended"; sessionId: string }
  | { type: "error"; code?: string; message: string }

export interface AiFeedbackItem {
  type: "positive" | "warning" | "suggestion"
  message: string
  lineNumber?: number
}
