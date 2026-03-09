import { createClient } from "@deepgram/sdk"

const deepgram = createClient()

export async function synthesizeSentence(text: string): Promise<Buffer> {
  const trimmed = text.trim()
  if (!trimmed) return Buffer.alloc(0)

  const response = await deepgram.speak.request(
    {
      text: trimmed,
    },
    {
      model: "aura-asteria-en",
    }
  )

  const audio = await response.getStream()
  if (!audio) return Buffer.alloc(0)

  const chunks: Buffer[] = []
  for await (const chunk of audio) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function synthesize(text: string): Promise<Buffer> {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]

  let audioBuffer = Buffer.alloc(0)

  for (const sentence of sentences) {
    const audio = await synthesizeSentence(sentence)
    if (audio.length > 0) {
      audioBuffer = Buffer.concat([audioBuffer, audio])
    }
  }

  return audioBuffer
}
