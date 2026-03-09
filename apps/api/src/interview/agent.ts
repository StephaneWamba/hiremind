import Anthropic from "@anthropic-ai/sdk"
import { InterviewSession } from "./state"
import { buildSystemPrompt } from "./prompts"
import { evaluateAnswer, getNextQuestion, endInterview } from "./tools"
import { synthesizeSentence } from "../voice/tts"
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

export async function runAgentTurn(
  session: InterviewSession,
  userText: string,
  sendChunk?: (text: string) => void,
  sendAudioChunk?: (buffer: Buffer) => void
) {
  session.messages.push({ role: "user", content: userText })

  // Use cached system prompt (built once at session start, never rebuilt)
  const systemPrompt = session.systemPrompt
  if (!systemPrompt) {
    throw new Error("System prompt not initialized - session.loadFromDb() must be called first")
  }

  while (true) {
    const stream = await client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      tools: tools as any,
      messages: session.messages as any,
    })

    let assistantText = ""
    let accumulatedText = ""
    const toolResults: Array<{ type: "tool_result"; tool_use_id: string; content: string }> = []
    const contentBlocks: any[] = []

    // Process stream events
    for await (const event of stream) {
      if (event.type === "content_block_start" && event.content_block?.type === "text") {
        // Starting a text block
      } else if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
        const text = event.delta.text
        assistantText += text
        accumulatedText += text

        if (sendChunk) sendChunk(text)

        // Check for sentence boundaries and synthesize if complete
        const sentenceMatch = accumulatedText.match(/^(.+?[.!?]+)\s*/)
        if (sentenceMatch) {
          const sentence = sentenceMatch[1]
          try {
            const audio = await synthesizeSentence(sentence)
            if (audio.length > 0 && sendAudioChunk) {
              sendAudioChunk(audio)
            }
          } catch (err) {
            console.error("TTS error:", err)
          }
          // Remove the processed sentence from accumulated text
          accumulatedText = accumulatedText.slice(sentence.length).trimStart()
        }
      } else if (event.type === "content_block_delta" && event.delta?.type === "tool_use_input") {
        // Tool input streaming - just accumulate
      } else if (event.type === "content_block_stop") {
        // End of a content block
        const block = (event as any).content_block
        if (block?.type === "text") {
          // Synthesize any remaining accumulated text
          if (accumulatedText.trim()) {
            try {
              const audio = await synthesizeSentence(accumulatedText.trim())
              if (audio.length > 0 && sendAudioChunk) {
                sendAudioChunk(audio)
              }
            } catch (err) {
              console.error("TTS error for remaining text:", err)
            }
            accumulatedText = ""
          }
          contentBlocks.push(block)
        } else if (block?.type === "tool_use") {
          contentBlocks.push(block)
        }
      }
    }

    // After stream finishes, handle tool calls from contentBlocks
    for (const block of contentBlocks) {
      if (block.type === "tool_use") {
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

    // Push the assistant response (with all content blocks including tool_use)
    session.messages.push({ role: "assistant", content: contentBlocks })

    // If we have tool results, push them as a user message and loop again
    if (toolResults.length > 0) {
      session.messages.push({ role: "user", content: toolResults as any })
      continue
    }

    // No tool calls - save transcript and exit loop
    session.turns.push({
      role: "interviewer",
      text: assistantText,
      timestamp: new Date(),
    })
    await session.persistState()
    break
  }
}
