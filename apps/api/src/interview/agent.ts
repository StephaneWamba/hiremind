import Anthropic from "@anthropic-ai/sdk"
import { InterviewSession } from "./state"
import { buildSystemPrompt } from "./prompts"
import { evaluateAnswer, getNextQuestion, endInterview } from "./tools"
import type { ConversationTurn } from "@hiremind/shared"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const tools = [
  {
    name: "evaluate_answer",
    description: "Score the candidate's answer and adjust interview difficulty",
    input_schema: {
      type: "object" as const,
      properties: {
        technical_depth: { type: "number", minimum: 0, maximum: 10 },
        communication: { type: "number", minimum: 0, maximum: 10 },
        problem_solving: { type: "number", minimum: 0, maximum: 10 },
        relevance: { type: "number", minimum: 0, maximum: 10 },
      },
      required: ["technical_depth", "communication", "problem_solving", "relevance"],
    },
  },
  {
    name: "get_next_question",
    description: "Get the next interview question based on current difficulty",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "end_interview",
    description: "End the interview session and generate final report",
    input_schema: {
      type: "object" as const,
      properties: {},
    },
  },
]

export async function runAgentTurn(session: InterviewSession, userText: string, sendChunk?: (text: string) => void) {
  session.messages.push({ role: "user", content: userText })

  let systemPrompt: string
  try {
    systemPrompt = buildSystemPrompt(session)
  } catch (err) {
    console.error("Prompt error:", err)
    throw err
  }

  let toolResults: Array<{ type: "tool_result"; tool_use_id: string; content: string }> = []

  while (true) {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      tools: tools as any,
      messages: [
        ...session.messages,
        ...toolResults.map((tr) => ({
          role: "user",
          content: [tr],
        })),
      ] as any,
    })

    let assistantText = ""

    for (const block of response.content) {
      if (block.type === "text") {
        assistantText += block.text
        if (sendChunk) sendChunk(block.text)
      } else if (block.type === "tool_use") {
        // Handle tool call
        let toolResult: any

        try {
          if (block.name === "evaluate_answer") {
            const input = block.input as any
            toolResult = await evaluateAnswer(session, input)
          } else if (block.name === "get_next_question") {
            toolResult = await getNextQuestion(session)
          } else if (block.name === "end_interview") {
            await endInterview(session)
            toolResult = { status: "interview_ended" }
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(toolResult),
          })
        } catch (err) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify({ error: String(err) }),
          })
        }
      }
    }

    // If no tool calls or stop_reason is end_turn, we're done with this turn
    if (response.stop_reason === "end_turn") {
      session.messages.push({ role: "assistant", content: assistantText })
      session.turns.push({
        role: "interviewer",
        text: assistantText,
        timestamp: new Date(),
      })
      await session.persistState()
      break
    }

    // If we have tool results, loop again
    if (toolResults.length === 0) {
      session.messages.push({ role: "assistant", content: assistantText })
      session.turns.push({
        role: "interviewer",
        text: assistantText,
        timestamp: new Date(),
      })
      await session.persistState()
      break
    }

    // Continue loop with tool results
  }
}
