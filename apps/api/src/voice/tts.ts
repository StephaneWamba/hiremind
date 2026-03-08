import { createClient } from "@deepgram/sdk"

const deepgram = createClient()

export async function synthesize(text: string): Promise<Buffer> {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]

  let audioBuffer = Buffer.alloc(0)

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (!trimmed) continue

    const response = await deepgram.speak.request(
      {
        text: trimmed,
      },
      {
        model: "aura-asteria-en",
      }
    )

    const audio = await response.getStream()
    if (audio) {
      const chunks: Buffer[] = []
      for await (const chunk of audio) {
        chunks.push(Buffer.from(chunk))
      }
      audioBuffer = Buffer.concat([audioBuffer, ...chunks])
    }
  }

  return audioBuffer
}
