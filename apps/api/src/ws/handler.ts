import { WebSocket } from "ws"
import { Anthropic } from "@anthropic-ai/sdk"
import { verifyWsToken } from "../utils/jwt"
import { InterviewSession, getSession, setSession, deleteSession, markSessionDisconnected } from "../interview/state"
import { runAgentTurn } from "../interview/agent"
import { synthesize } from "../voice/tts"
import { transcribeAudio } from "../voice/stt"
import { executeCode } from "../code/piston"
import type { ClientMessage, ServerMessage } from "@hiremind/shared"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

export async function handleWsConnection(ws: WebSocket & any) {
  let session: InterviewSession | null = null

  ws.on("message", async (data: unknown) => {
    try {
      const buffer = data as Buffer

      // Check if this is binary audio data (starts with "audio_chunk\n")
      if (buffer.length > 12 && buffer.toString("utf-8", 0, 11) === "audio_chunk") {
        // Extract binary audio data after the type marker (after "audio_chunk\n")
        const audioData = buffer.slice(12)
        if (session && audioData.length > 0) {
          session.audioChunks.push(audioData)
          console.log(`[WS] Received binary audio chunk: ${audioData.length} bytes (total: ${session.audioChunks.reduce((sum, c) => sum + c.length, 0)} bytes)`)
        }
        return
      }

      const message = JSON.parse(buffer.toString()) as ClientMessage

      if (message.type === "join") {
        // Verify token and load session
        const verified = verifyWsToken(message.token)
        if (!verified) {
          ws.send(JSON.stringify({ type: "error", code: "invalid_token", message: "Invalid token" } as ServerMessage))
          ws.close()
          return
        }

        // Check if session already has an active WS connection (two-tab protection)
        const existingSession = getSession(verified.sessionId)
        if (existingSession?.ws?.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "error",
              code: "session_active",
              message: "Session already active in another tab",
            } as ServerMessage)
          )
          ws.close()
          return
        }

        // Reconnect: reuse session if in grace period, otherwise create new
        if (!existingSession) {
          // For new sessions, load basic metadata first to get userId and jobRoleId
          const { db } = await import("@hiremind/db")
          const { interviewSessions } = await import("@hiremind/db")
          const { eq } = await import("drizzle-orm")

          const sessionRow = await db
            .select()
            .from(interviewSessions)
            .where(eq(interviewSessions.id, verified.sessionId))
            .then(rows => rows[0])

          if (!sessionRow) {
            ws.send(JSON.stringify({ type: "error", code: "session_not_found", message: "Session not found" } as ServerMessage))
            ws.close()
            return
          }

          session = new InterviewSession(verified.sessionId, sessionRow.userId, sessionRow.jobRoleId)
        } else {
          session = existingSession
        }

        session.ws = ws
        session.wsAlive = true
        session.disconnectedAt = null

        // Load session from DB if first time or cold restart
        try {
          await session.loadFromDb()
          setSession(verified.sessionId, session)

          // Send transcript replay on reconnect
          if (session.turns.length > 0) {
            ws.send(JSON.stringify({ type: "transcript_replay", turns: session.turns } as ServerMessage))
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : String(err)
          console.error(`WS loadFromDb error for session ${verified.sessionId}:`, errorMsg)
          ws.send(JSON.stringify({ type: "error", code: "session_not_found", message: "Session not found" } as ServerMessage))
          ws.close()
          return
        }

        ws.send(JSON.stringify({ type: "ready" } as ServerMessage))
      } else if (!session) {
        ws.send(JSON.stringify({ type: "error", message: "Not joined" } as ServerMessage))
        return
      } else if (message.type === "audio_chunk") {
        // Reject if processing
        if (session.isProcessing) {
          ws.send(JSON.stringify({ type: "busy" } as ServerMessage))
          return
        }
        // Accumulate audio chunks for end_turn
        const audioData = (message as any).data
        if (Array.isArray(audioData)) {
          // Convert from array of bytes to Buffer
          const chunk = Buffer.from(audioData)
          session.audioChunks.push(chunk)
          console.log(`[WS] Received audio chunk: ${chunk.length} bytes (total: ${session.audioChunks.reduce((sum, c) => sum + c.length, 0)} bytes)`)
        } else if (audioData instanceof ArrayBuffer) {
          const chunk = Buffer.from(audioData)
          session.audioChunks.push(chunk)
          console.log(`[WS] Received audio chunk: ${chunk.length} bytes (total: ${session.audioChunks.reduce((sum, c) => sum + c.length, 0)} bytes)`)
        }
      } else if (message.type === "end_turn") {
        // Reject if processing
        if (session.isProcessing) {
          ws.send(JSON.stringify({ type: "busy" } as ServerMessage))
          return
        }

        // Transcribe accumulated audio chunks
        let transcribedText = ""
        if (session.audioChunks.length > 0) {
          const audioBuffer = Buffer.concat(session.audioChunks)
          console.log(`[WS] Ending turn: ${session.audioChunks.length} chunks, total size: ${audioBuffer.length} bytes`)
          session.audioChunks = [] // Clear for next turn
          try {
            transcribedText = await transcribeAudio(audioBuffer)
          } catch (err) {
            console.error("Transcription failed:", err instanceof Error ? err.message : String(err))
            ws.send(JSON.stringify({ type: "error", message: String(err) } as ServerMessage))
            return
          }
        } else {
          console.log(`[WS] End turn but no audio chunks received`)
        }

        if (!transcribedText.trim()) {
          console.log(`[WS] Empty transcription, sending listening state`)
          ws.send(JSON.stringify({ type: "listening" } as ServerMessage))
          return
        }

        ws.send(JSON.stringify({ type: "thinking" } as ServerMessage))
        session.isProcessing = true

        try {
          ws.send(JSON.stringify({ type: "audio_start" } as ServerMessage))

          await runAgentTurn(
            session,
            transcribedText,
            (chunk) => {
              ws.send(
                JSON.stringify({
                  type: "transcript",
                  role: "interviewer",
                  content: chunk,
                } as ServerMessage)
              )
            },
            (buffer) => {
              ws.send(buffer) // Send audio as binary frame
            }
          )

          ws.send(JSON.stringify({ type: "audio_end" } as ServerMessage))
          ws.send(JSON.stringify({ type: "listening" } as ServerMessage))
        } catch (err) {
          console.error("Agent error:", err)
          ws.send(JSON.stringify({ type: "error", message: "Interview error" } as ServerMessage))
        } finally {
          session.isProcessing = false
        }
      } else if (message.type === "text_response" && message.content) {
        // Reject if processing
        if (session.isProcessing) {
          ws.send(JSON.stringify({ type: "busy" } as ServerMessage))
          return
        }

        ws.send(JSON.stringify({ type: "thinking" } as ServerMessage))
        session.isProcessing = true

        try {
          await runAgentTurn(
            session,
            message.content,
            (chunk) => {
              ws.send(
                JSON.stringify({
                  type: "transcript",
                  role: "interviewer",
                  content: chunk,
                } as ServerMessage)
              )
            },
            undefined // No audio callback for text mode
          )

          ws.send(JSON.stringify({ type: "ready" } as ServerMessage))
        } catch (err) {
          console.error("Agent error:", err)
          ws.send(JSON.stringify({ type: "error", message: "Interview error" } as ServerMessage))
        } finally {
          session.isProcessing = false
        }
      } else if (message.type === "code_submission") {
        // Reject if processing
        if (session.isProcessing) {
          ws.send(JSON.stringify({ type: "busy" } as ServerMessage))
          return
        }

        // Store code and execution output
        session.currentCode = message.code
        // executionOutput would come from browser, for now placeholder
        session.lastExecutionOutput = ""

        ws.send(JSON.stringify({ type: "thinking" } as ServerMessage))
        session.isProcessing = true

        try {
          // Build structured envelope for agent
          const envelope = `[CODE SUBMISSION]
Language: ${message.language}

<code>
${message.code}
</code>

[EXECUTION OUTPUT]
${session.lastExecutionOutput || "Not executed"}`

          ws.send(JSON.stringify({ type: "audio_start" } as ServerMessage))

          await runAgentTurn(
            session,
            envelope,
            (chunk) => {
              ws.send(
                JSON.stringify({
                  type: "transcript",
                  role: "interviewer",
                  content: chunk,
                } as ServerMessage)
              )
            },
            (buffer) => {
              ws.send(buffer) // Send audio as binary frame
            }
          )

          ws.send(JSON.stringify({ type: "audio_end" } as ServerMessage))
          ws.send(JSON.stringify({ type: "ready" } as ServerMessage))
        } catch (err) {
          console.error("Code submission error:", err)
          ws.send(JSON.stringify({ type: "error", message: "Code evaluation error" } as ServerMessage))
        } finally {
          session.isProcessing = false
        }
      } else if (message.type === "run_code") {
        // Non-blocking execution request
        // Fire-and-forget: execute and send output asynchronously
        ;(async () => {
          try {
            const { code, language } = message
            const result = await executeCode(code, language)
            ws.send(
              JSON.stringify({
                type: "code_output",
                stdout: result.stdout,
                stderr: result.stderr,
                exitCode: result.exitCode,
              } as ServerMessage)
            )
          } catch (err) {
            console.error("Code execution error:", err)
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Code execution failed",
              } as ServerMessage)
            )
          }
        })()
      } else if (message.type === "code_hint_request") {
        // Non-blocking hint request — does NOT lock isProcessing
        // Fire-and-forget: generate hints asynchronously
        ;(async () => {
          try {
            const { code, language } = message
            const prompt = `You are a coding interview expert. Analyze this ${language} code snippet and provide 1-2 brief, actionable hints without giving away the solution.

Code:
\`\`\`${language}
${code}
\`\`\`

Provide 2-3 hints as a numbered list. Focus on:
- Edge cases
- Time/space complexity
- Clarity and readability
- Missing error handling

Keep each hint to 1-2 sentences max.`

            const response = await client.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 300,
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
            })

            const hint = response.content[0]?.type === "text" ? response.content[0].text : ""

            ws.send(
              JSON.stringify({
                type: "code_feedback",
                items: [
                  {
                    type: "suggestion",
                    message: hint,
                  },
                ],
              } as ServerMessage)
            )
          } catch (err) {
            console.error("Hint generation error:", err)
          }
        })()
      } else if (message.type === "end_interview" && session) {
        session.isProcessing = true
        try {
          await session.persistFinal()
          deleteSession(session.id)
          ws.send(JSON.stringify({ type: "interview_ended", sessionId: session.id } as ServerMessage))
          ws.close()
        } catch (err) {
          console.error("End interview error:", err)
          ws.send(JSON.stringify({ type: "error", message: "Failed to end interview" } as ServerMessage))
        }
      }
    } catch (err: unknown) {
      console.error("WS handler error:", err)
      ws.send(JSON.stringify({ type: "error", message: "Server error" } as ServerMessage))
    }
  })

  ws.on("close", () => {
    if (session) {
      markSessionDisconnected(session.id)
    }
  })

  ws.on("error", (err: unknown) => {
    console.error("WS error:", err)
  })
}
