import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk"
import type { WebSocket } from "ws"

const deepgram = createClient()

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    console.log(`[STT] Transcribing audio buffer of size: ${audioBuffer.length} bytes`)

    const response = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
      model: "nova-3",
      smart_format: true,
      // Support webm/opus format from browser MediaRecorder
      mimetype: "audio/webm",
    })

    const transcript = response.result?.results?.channels[0]?.alternatives[0]?.transcript || ""
    console.log(`[STT] Transcription complete: "${transcript}"`)
    return transcript.trim()
  } catch (err) {
    console.error("STT error:", err instanceof Error ? err.message : String(err))
    throw new Error(`Speech recognition failed: ${err instanceof Error ? err.message : "unknown error"}`)
  }
}

export async function createSTTStream(ws: WebSocket, onTranscript: (text: string, isFinal: boolean) => void) {
  const connection = deepgram.listen.live({
    model: "nova-3",
    encoding: "linear16",
    sample_rate: 16000,
    channels: 1,
  })

  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log("STT stream opened")
  })

  connection.on(LiveTranscriptionEvents.Transcript, (data: any) => {
    const transcript = data.channel.alternatives[0]?.transcript || ""
    const isFinal = !data.is_final

    if (transcript) {
      onTranscript(transcript, isFinal)
    }
  })

  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log("STT stream closed")
  })

  connection.on(LiveTranscriptionEvents.Error, (error: any) => {
    console.error("STT error:", error)
  })

  return connection
}
