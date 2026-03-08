import { publicProcedure, router } from "../index"
import { z } from "zod"
import { Anthropic } from "@anthropic-ai/sdk"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

export const hintsRouter = router({
  getCodeHint: publicProcedure
    .input(
      z.object({
        code: z.string(),
        language: z.string(),
        context: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const prompt = `You are a coding interview expert. Analyze this ${input.language} code snippet and provide 1-2 brief, actionable hints without giving away the solution.

Code:
\`\`\`${input.language}
${input.code}
\`\`\`

${input.context ? `Context: ${input.context}` : ""}

Provide 2-3 hints as a short list. Focus on:
- Edge cases
- Time/space complexity
- Clarity and readability
- Missing error handling

Keep each hint to 1-2 sentences.`

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

        return {
          hint,
          success: true,
        }
      } catch (err) {
        console.error("Hint generation error:", err)
        return {
          hint: "Unable to generate hints at this time.",
          success: false,
        }
      }
    }),
})
