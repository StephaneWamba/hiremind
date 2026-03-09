import { db } from "@hiremind/db"
import { interviewSessions, conversationTurns, jobRoles, questions } from "@hiremind/db"
import { eq } from "drizzle-orm"
import type { ConversationTurn, SessionState, InterviewStatus } from "@hiremind/shared"
import { buildSystemPrompt } from "./prompts"

export class InterviewSession {
  id: string
  userId: string
  jobRoleId: string
  messages: Array<{ role: "user" | "assistant"; content: string }> = []
  state: SessionState = {
    difficulty: 5,
    topicsCovered: [],
    topicsRemaining: [],
    scores: {},
    questionsUsed: [],
    turnCount: 0,
    startedAt: new Date().toISOString(),
    ended: false,
  }
  dbStatus: InterviewStatus = "in_progress"
  questions: Array<{ id: string; text: string; difficulty: number }> = []
  currentDifficulty: number = 5
  turns: ConversationTurn[] = []
  ws: WebSocket | null = null

  // Critical for reliability
  isProcessing: boolean = false
  wsAlive: boolean = true
  disconnectedAt: number | null = null
  currentCode?: string
  lastExecutionOutput?: string
  systemPrompt: string = ""
  audioChunks: Buffer[] = []
  cachedRole?: { id: string; title: string; category: string; competencies?: { technical?: string[]; soft_skills?: string[] } }
  cachedAllQuestions: Array<{ id: string; questionText: string; difficulty: number }> = []
  lastPersistedTurnNumber: number = 0

  constructor(id: string, userId: string, jobRoleId: string) {
    this.id = id
    this.userId = userId
    this.jobRoleId = jobRoleId
  }

  async loadFromDb() {
    console.log(`[loadFromDb] Loading session ${this.id}`)

    let session
    let lastError

    // Retry logic for database connectivity issues
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await db
          .select()
          .from(interviewSessions)
          .where(eq(interviewSessions.id, this.id))

        console.log(`[loadFromDb] Query attempt ${attempt}: Got ${result.length} rows`)
        session = result[0]
        break
      } catch (err) {
        lastError = err
        console.error(`[loadFromDb] Attempt ${attempt} failed:`, err instanceof Error ? err.message : String(err))
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 100 * attempt))
        }
      }
    }

    if (!session) {
      console.log(`[loadFromDb] Session ${this.id} not found after ${lastError ? 'database error' : '3 attempts'}`)
      throw new Error(`Session not found${lastError ? ': ' + (lastError instanceof Error ? lastError.message : String(lastError)) : ''}`)
    }
    console.log(`[loadFromDb] Session ${this.id} loaded successfully`)

    this.currentDifficulty = session.currentDifficulty || 5
    this.dbStatus = session.status as InterviewStatus

    // Cache the job role to avoid per-turn DB queries
    const role = await db
      .select()
      .from(jobRoles)
      .where(eq(jobRoles.id, this.jobRoleId))
      .then((rows) => rows[0])

    if (!role) throw new Error("Job role not found")

    this.cachedRole = {
      id: role.id,
      title: role.title,
      category: role.category,
      competencies: role.competencies as any,
    }

    // Cache system prompt once per session (never rebuild during interview)
    this.systemPrompt = buildSystemPrompt(this)

    // Cache all questions for this role to avoid per-turn DB queries
    const allQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.jobRoleId, this.jobRoleId))

    this.cachedAllQuestions = allQuestions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      difficulty: q.difficulty,
    }))

    // Load conversation history for reconnection support
    await this.loadConversation()
  }

  async persistState() {
    // Write new turns to conversationTurns table (fire-and-forget)
    const newTurns = this.turns.slice(this.lastPersistedTurnNumber)
    if (newTurns.length > 0) {
      db.insert(conversationTurns)
        .values(
          newTurns.map((turn, idx) => ({
            sessionId: this.id,
            turnNumber: this.lastPersistedTurnNumber + idx,
            role: turn.role === "interviewer" ? ("interviewer" as const) : ("candidate" as const),
            content: turn.text,
            createdAt: turn.timestamp || new Date(),
          }))
        )
        .catch((err) => console.error("Turn persistence error:", err))

      this.lastPersistedTurnNumber = this.turns.length
    }

    // Snapshot session state every 5 turns
    if (this.turns.length % 5 === 0) {
      db.update(interviewSessions)
        .set({
          currentDifficulty: this.currentDifficulty,
          status: this.dbStatus,
          questionsAsked: this.turns
            .map((t) => t.questionId)
            .filter((id): id is string => Boolean(id)),
        })
        .where(eq(interviewSessions.id, this.id))
        .catch((err) => console.error("Session snapshot error:", err))
    }
  }

  async loadConversation() {
    // Load all stored turns for this session to support reconnection
    const storedTurns = await db
      .select()
      .from(conversationTurns)
      .where(eq(conversationTurns.sessionId, this.id))

    // Rebuild messages array from stored turns
    this.messages = []
    storedTurns.forEach((turn) => {
      this.messages.push({
        role: turn.role === "interviewer" ? "assistant" : "user",
        content: turn.content,
      })
    })

    this.lastPersistedTurnNumber = storedTurns.length
  }

  async persistFinal() {
    await db
      .update(interviewSessions)
      .set({
        status: "completed",
        endedAt: new Date(),
        durationMinutes: Math.round(
          (Date.now() - (this.turns[0]?.timestamp?.getTime() || Date.now())) / 60000
        ),
      })
      .where(eq(interviewSessions.id, this.id))
  }
}

const sessions = new Map<string, InterviewSession>()
const GRACE_PERIOD_MS = 90_000 // 90 seconds

export function getSession(id: string): InterviewSession | undefined {
  return sessions.get(id)
}

export function setSession(id: string, session: InterviewSession) {
  sessions.set(id, session)
}

export function markSessionDisconnected(id: string) {
  const session = sessions.get(id)
  if (session) {
    session.wsAlive = false
    session.disconnectedAt = Date.now()
    // Clean up after grace period
    setTimeout(() => {
      const s = sessions.get(id)
      if (s && !s.wsAlive) {
        sessions.delete(id)
      }
    }, GRACE_PERIOD_MS)
  }
}

export function deleteSession(id: string) {
  sessions.delete(id)
}
