"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Mic, MicOff, Send, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { executeCodeInBrowser } from "@/lib/code-executor"
import { Audiowave } from "./audiowave"
import { FeedbackDisplay } from "./feedback-display"
import { CodeEditor } from "./code-editor"
import { AIFeedbackSidebar } from "./ai-feedback-sidebar"

type ConversationTurn = {
  role: "interviewer" | "candidate"
  content: string
  timestamp: number
}

type InterviewState = "joining" | "ready" | "listening" | "thinking" | "speaking"
type InterviewMode = "voice" | "text" | "coding"

export function InterviewRoom({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const wsTokenRef = useRef<string>("")

  const [state, setState] = useState<InterviewState>("joining")
  const [transcript, setTranscript] = useState<ConversationTurn[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(8).fill(0))
  const [mode, setMode] = useState<InterviewMode>("voice")
  const [textInput, setTextInput] = useState("")
  const [codeInput, setCodeInput] = useState("")
  const [codeLanguage, setCodeLanguage] = useState("javascript")
  const [codeFeedback, setCodeFeedback] = useState<Array<{ type: "positive" | "warning" | "suggestion"; message: string; lineNumber?: number }>>([])
  const [codeOutput, setCodeOutput] = useState<{ stdout: string; stderr: string; exitCode: number } | null>(null)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState("00:00")
  const [sessionInfo, setSessionInfo] = useState<{ roleTitle?: string; type?: string } | null>(null)
  const [isEnding, setIsEnding] = useState(false)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const sessionQuery = trpc.sessions.get.useQuery(sessionId)
  const audioQueueRef = useRef<(Blob | ArrayBuffer)[]>([])
  const isPlayingAudioRef = useRef(false)

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const mins = Math.floor(elapsed / 60)
      const secs = elapsed % 60
      setElapsedTime(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  // Scroll to latest message
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [transcript])

  // Initialize WebSocket and audio
  useEffect(() => {
    const initializeInterview = async () => {
      // Get session info from tRPC query result
      if (sessionQuery.data) {
        setSessionInfo({
          roleTitle: (sessionQuery.data as any).roleTitle || sessionQuery.data.jobRoleId || "Interview",
          type: sessionQuery.data.interviewType || "",
        })
        // Set mode from session data
        if (sessionQuery.data.mode) {
          setMode(sessionQuery.data.mode as InterviewMode)
        }
      }

      // Retrieve wsToken from sessionStorage (stored by practice wizard)
      const storedToken = typeof window !== "undefined" ? sessionStorage.getItem(`wsToken_${sessionId}`) : null
      if (storedToken) {
        wsTokenRef.current = storedToken
        // Clean up after reading
        sessionStorage.removeItem(`wsToken_${sessionId}`)
      }

      // Initialize audio context and WebSocket
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioContext

        const analyser = audioContext.createAnalyser()
        analyserRef.current = analyser
        analyser.fftSize = 256

        // Get microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

        // Create media recorder
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder

        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        // Connect WebSocket
        const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?sessionId=${sessionId}`
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          setState("ready")
          // Send join message with WS token
          ws.send(
            JSON.stringify({
              type: "join",
              sessionId,
              token: wsTokenRef.current || "",
            })
          )
        }

        ws.onmessage = (event) => {
          // Detect binary audio frames vs JSON messages
          // Binary data comes as ArrayBuffer, JSON comes as string
          if (typeof event.data !== "string") {
            // Binary audio chunk - add to queue
            audioQueueRef.current.push(event.data)
            if (!isPlayingAudioRef.current) {
              playNextAudio()
            }
            return
          }

          // JSON message
          try {
            const message = JSON.parse(event.data)
            handleWSMessage(message)
          } catch (err) {
            console.error("Failed to parse WS message:", err)
          }
        }

        ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          setState("ready")
        }

        ws.onclose = () => {
          console.log("WebSocket closed")
        }

        // Analyze audio for visualizer
        const analyzeAudio = () => {
          if (!isRecording) {
            setAudioLevels(Array(8).fill(0))
            requestAnimationFrame(analyzeAudio)
            return
          }

          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          analyser.getByteFrequencyData(dataArray)

          const bucketSize = Math.floor(dataArray.length / 8)
          const levels = Array(8)
            .fill(0)
            .map((_, i) => {
              const start = i * bucketSize
              const end = start + bucketSize
              const sum = dataArray.slice(start, end).reduce((a, b) => a + b, 0)
              return sum / (bucketSize * 255)
            })

          setAudioLevels(levels)
          requestAnimationFrame(analyzeAudio)
        }
        analyzeAudio()
      } catch (error) {
        console.error("Failed to initialize audio:", error)
        setState("ready")
      }
    }

    initializeInterview()

    return () => {
      if (wsRef.current) wsRef.current.close()
      if (mediaRecorderRef.current) mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop())
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [sessionId, sessionQuery.data])

  const playNextAudio = () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingAudioRef.current = false
      return
    }

    isPlayingAudioRef.current = true
    const audioData = audioQueueRef.current.shift()

    if (!audioData) {
      playNextAudio()
      return
    }

    // Create blob URL and play
    const blob = audioData instanceof Blob ? audioData : new Blob([audioData])
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)

    audio.onended = () => {
      URL.revokeObjectURL(url)
      playNextAudio()
    }

    audio.onerror = () => {
      console.error("Audio playback error")
      URL.revokeObjectURL(url)
      playNextAudio()
    }

    audio.play().catch((err) => {
      console.error("Failed to play audio:", err)
      URL.revokeObjectURL(url)
      playNextAudio()
    })
  }

  const handleWSMessage = (message: any) => {
    switch (message.type) {
      case "ready":
        setState("ready")
        break
      case "thinking":
        setState("thinking")
        break
      case "audio_start":
        setState("speaking")
        break
      case "audio_end":
        setState("listening")
        break
      case "listening":
        setState("listening")
        break
      case "busy":
        // Server rejected — show subtle feedback (UX optional)
        console.warn("Server busy, please wait")
        break
      case "transcript":
        setTranscript((prev) => [
          ...prev,
          {
            role: message.role || message.role,
            content: message.content || message.text,
            timestamp: Date.now(),
          },
        ])
        break
      case "transcript_replay":
        // On reconnect, restore conversation history
        setTranscript(
          message.turns.map((turn: any) => ({
            role: turn.role,
            content: turn.text,
            timestamp: turn.timestamp ? new Date(turn.timestamp).getTime() : Date.now(),
          }))
        )
        break
      case "code_output":
        // Handle code execution output
        setCodeOutput({
          stdout: message.stdout || "",
          stderr: message.stderr || "",
          exitCode: message.exitCode || 0,
        })
        break
      case "code_feedback":
        // Update sidebar with AI feedback
        if (message.items && Array.isArray(message.items)) {
          setCodeFeedback(
            message.items.map((item: any) => ({
              type: (item.type || "suggestion") as "positive" | "warning" | "suggestion",
              message: item.message,
              lineNumber: item.lineNumber,
            }))
          )
        }
        break
      case "interview_ended":
      case "session_ended":
        router.push(`/dashboard?completed=${sessionId}`)
        break
      case "error":
        console.error("Interview error:", message.message)
        if (message.code === "session_active") {
          alert("This session is already active in another tab. Please close that tab and refresh.")
          router.push("/dashboard")
        }
        break
    }
  }

  const startRecording = async () => {
    if (!mediaRecorderRef.current || !wsRef.current) return

    setIsRecording(true)
    setState("listening")

    const mediaRecorder = mediaRecorderRef.current
    const chunks: BlobPart[] = []

    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data)
      // Convert blob to ArrayBuffer and send to WebSocket as binary
      event.data.arrayBuffer().then((buffer) => {
        wsRef.current?.send(
          JSON.stringify({
            type: "audio_chunk",
            data: Array.from(new Uint8Array(buffer)), // Send as array for JSON serialization
          })
        )
      })
    }

    mediaRecorder.start(250)
  }

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return

    setIsRecording(false)
    mediaRecorderRef.current.stop()

    // Notify server that turn ended
    wsRef.current?.send(
      JSON.stringify({
        type: "end_turn",
      })
    )

    setState("thinking")
  }

  const sendText = () => {
    if (!textInput.trim() || !wsRef.current) return

    setTranscript((prev) => [
      ...prev,
      {
        role: "candidate",
        content: textInput,
        timestamp: Date.now(),
      },
    ])

    wsRef.current.send(
      JSON.stringify({
        type: "text_response",
        content: textInput,
      })
    )

    setTextInput("")
    setState("thinking")
  }

  const sendCode = () => {
    if (!codeInput.trim() || !wsRef.current) return

    setTranscript((prev) => [
      ...prev,
      {
        role: "candidate",
        content: `[${codeLanguage.toUpperCase()}]\n${codeInput}`,
        timestamp: Date.now(),
      },
    ])

    wsRef.current.send(
      JSON.stringify({
        type: "code_submission",
        code: codeInput,
        language: codeLanguage,
      })
    )

    setState("thinking")
  }

  const runCode = async () => {
    if (!codeInput.trim()) return

    // Try browser-based execution for JavaScript first
    if (["javascript", "js"].includes(codeLanguage.toLowerCase())) {
      const result = await executeCodeInBrowser(codeInput, codeLanguage)
      setCodeOutput(result)
      return
    }

    // Fall back to server execution for other languages
    if (!wsRef.current) return

    wsRef.current.send(
      JSON.stringify({
        type: "run_code",
        code: codeInput,
        language: codeLanguage,
      })
    )
  }

  const getCodeHint = () => {
    if (!codeInput.trim() || !wsRef.current) return

    wsRef.current.send(
      JSON.stringify({
        type: "code_hint_request",
        code: codeInput,
        language: codeLanguage,
      })
    )
  }

  const endInterview = async () => {
    if (!wsRef.current) return

    setIsEnding(true)
    wsRef.current.send(
      JSON.stringify({
        type: "end_interview",
      })
    )

    // Redirect after a delay
    setTimeout(() => {
      router.push("/dashboard")
    }, 1000)
  }

  const statusText = {
    joining: "Connecting...",
    ready: "Ready",
    listening: "Listening...",
    thinking: "Thinking...",
    speaking: "Speaking...",
  }

  return (
    <div
      className="fixed inset-0 flex flex-col bg-iv-bg text-iv-text"
      style={{
        backgroundColor: "var(--iv-bg)",
        color: "var(--iv-text)",
      }}
    >
      {/* Top Bar */}
      <div
        className="h-12 flex items-center justify-between px-3 sm:px-6 border-b text-sm gap-2 overflow-x-auto"
        style={{ borderColor: "var(--iv-border)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold whitespace-nowrap">HireMind</span>
          {sessionInfo?.roleTitle && (
            <>
              <span
                className="w-1 h-1 rounded-full flex-shrink-0"
                style={{ backgroundColor: "var(--iv-text-muted)" }}
              />
              <span className="text-iv-text-muted truncate">{sessionInfo.roleTitle}</span>
              {sessionInfo?.type && (
                <span
                  className="text-xs px-2 py-1 rounded whitespace-nowrap flex-shrink-0"
                  style={{ backgroundColor: "var(--iv-border)" }}
                >
                  {sessionInfo.type}
                </span>
              )}
            </>
          )}
        </div>

        <div className="font-semibold whitespace-nowrap">{elapsedTime}</div>

        <button
          onClick={endInterview}
          className="text-iv-text-muted hover:text-iv-text transition-colors flex items-center gap-1 flex-shrink-0 whitespace-nowrap"
        >
          <X size={16} />
          <span className="hidden sm:inline">End</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {mode === "coding" ? (
          <>
            {/* Code Editor - 60% on desktop, full on mobile */}
            <div className="w-full lg:w-3/5 flex flex-col border-b lg:border-b-0 lg:border-r overflow-hidden" style={{ borderColor: "var(--iv-border)" }}>
              {/* Language Selector */}
              <div
                className="px-3 sm:px-4 py-3 border-b flex items-center gap-3"
                style={{ borderColor: "var(--iv-border)" }}
              >
                <label className="text-xs font-semibold whitespace-nowrap" style={{ color: "var(--iv-text-muted)" }}>
                  Language:
                </label>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="px-2 py-1 rounded text-xs bg-iv-surface text-iv-text border flex-1"
                  style={{
                    backgroundColor: "var(--iv-surface)",
                    color: "var(--iv-text)",
                    borderColor: "var(--iv-border)",
                  }}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="go">Go</option>
                  <option value="rust">Rust</option>
                  <option value="cpp">C++</option>
                  <option value="csharp">C#</option>
                </select>
              </div>

              <CodeEditor
                value={codeInput}
                onChange={setCodeInput}
                language={codeLanguage}
                readOnly={false}
              />

              {/* Code Output */}
              {codeOutput && (
                <div
                  className="px-3 sm:px-4 py-3 border-t text-xs font-mono overflow-auto max-h-32"
                  style={{
                    borderColor: "var(--iv-border)",
                    backgroundColor: "rgba(0,0,0,0.3)",
                    color: codeOutput.exitCode === 0 ? "var(--iv-text)" : "#EF4444",
                  }}
                >
                  {codeOutput.stdout && (
                    <div>
                      <span style={{ color: "var(--iv-accent)" }}>stdout:</span>
                      <pre>{codeOutput.stdout}</pre>
                    </div>
                  )}
                  {codeOutput.stderr && (
                    <div>
                      <span style={{ color: "#EF4444" }}>stderr:</span>
                      <pre>{codeOutput.stderr}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* AI Feedback Sidebar - 40% on desktop, full on mobile */}
            <div className="w-full lg:w-2/5 flex flex-col overflow-hidden min-h-40 lg:min-h-0">
              <AIFeedbackSidebar
                isThinking={state === "thinking"}
                feedback={codeFeedback}
              />
            </div>
          </>
        ) : mode === "text" ? (
          <>
            {/* Text Mode: Full-width chat layout */}
            <div className="w-full flex flex-col overflow-hidden" style={{ backgroundColor: "var(--iv-surface)" }}>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 flex flex-col">
                {transcript.map((turn, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      turn.role === "interviewer" ? "justify-start" : "justify-end"
                    )}
                  >
                    {turn.role === "interviewer" && (
                      <div className="text-xs font-medium px-2 py-1" style={{ color: "var(--iv-text-muted)" }}>
                        AI
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-lg px-4 py-2 rounded-lg",
                        turn.role === "interviewer"
                          ? "text-iv-text"
                          : "rounded-lg"
                      )}
                      style={
                        turn.role === "interviewer"
                          ? {}
                          : { backgroundColor: "var(--iv-bg)" }
                      }
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        className="text-sm leading-relaxed markdown-content"
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children }) => (
                            <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre className="bg-black/50 rounded p-3 mb-2 overflow-x-auto text-xs font-mono">
                              {children}
                            </pre>
                          ),
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="ml-2">{children}</li>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-gray-300 my-2">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {turn.content}
                      </ReactMarkdown>
                    </div>
                    {turn.role === "candidate" && (
                      <div className="text-xs font-medium px-2 py-1" style={{ color: "var(--iv-text-muted)" }}>
                        You
                      </div>
                    )}
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Voice Mode: Split layout with interviewer panel */}
            {/* Interviewer Panel - 40% on desktop, full on mobile */}
            <div
              className="w-full lg:w-2/5 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r p-4 sm:p-6"
              style={{ borderColor: "var(--iv-border)" }}
            >
              <div
                className="w-16 sm:w-20 h-16 sm:h-20 rounded-full flex items-center justify-center mb-4"
                style={{
                  backgroundColor: "var(--iv-surface)",
                  color: "var(--iv-accent)",
                }}
              >
                <Mic size={28} className="sm:size-32" />
              </div>

              <p className="text-sm font-medium mb-6">{statusText[state]}</p>

              {state === "speaking" && (
                <Audiowave
                  levels={audioLevels}
                  isRecording={true}
                  color="var(--iv-accent)"
                />
              )}
            </div>

            {/* Transcript Panel - 60% on desktop, full on mobile */}
            <div
              className="w-full lg:w-3/5 flex flex-col overflow-hidden"
              style={{ backgroundColor: "var(--iv-surface)" }}
            >
              <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4">
                {transcript.map((turn, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      turn.role === "interviewer" ? "justify-start" : "justify-end"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs px-4 py-2 rounded-lg",
                        turn.role === "interviewer"
                          ? "text-iv-text"
                          : "rounded-lg"
                      )}
                      style={
                        turn.role === "interviewer"
                          ? {}
                          : { backgroundColor: "var(--iv-bg)" }
                      }
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        className="text-sm markdown-content"
                        components={{
                          p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          code: ({ children }) => (
                            <code className="px-1 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre className="bg-black/50 rounded p-2 mb-1 overflow-x-auto text-xs font-mono">
                              {children}
                            </pre>
                          ),
                        }}
                      >
                        {turn.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Control Bar */}
      <div
        className="flex flex-col sm:flex-row items-center justify-center gap-3 border-t px-3 sm:px-6 py-3 sm:h-20 flex-wrap"
        style={{ borderColor: "var(--iv-border)" }}
      >
        {mode === "voice" ? (
          <>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={state !== "ready" && state !== "listening"}
              title={isRecording ? "Stop recording" : "Start recording"}
              className={cn(
                "w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all flex-shrink-0",
                isRecording
                  ? "bg-red-600 hover:bg-red-700 disabled:opacity-50"
                  : "bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isRecording ? (
                <MicOff size={20} className="sm:size-24 text-white" />
              ) : (
                <Mic size={20} className="sm:size-24 text-white" />
              )}
            </button>

            {isRecording && (
              <Audiowave
                levels={audioLevels}
                isRecording={isRecording}
                color="var(--iv-accent)"
              />
            )}
          </>
        ) : mode === "text" ? (
          <>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && state === "ready") sendText()
              }}
              disabled={state !== "ready"}
              placeholder="Type your response..."
              className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm bg-iv-bg text-iv-text placeholder:text-iv-text-muted border disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: "var(--iv-border)" }}
            />
            <button
              onClick={sendText}
              disabled={!textInput.trim() || state !== "ready"}
              title="Send message"
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Send size={16} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </>
        ) : mode === "coding" ? (
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={runCode}
              disabled={!codeInput.trim() || state !== "ready"}
              className="px-3 py-2 rounded-lg bg-iv-surface text-iv-text hover:bg-iv-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium border whitespace-nowrap"
              style={{
                borderColor: "var(--iv-border)",
                backgroundColor: "var(--iv-surface)",
              }}
            >
              Run Code
            </button>

            <button
              onClick={getCodeHint}
              disabled={!codeInput.trim() || state !== "ready"}
              className="px-3 py-2 rounded-lg bg-iv-surface text-iv-text hover:bg-iv-border disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium border whitespace-nowrap"
              style={{
                borderColor: "var(--iv-border)",
                backgroundColor: "var(--iv-surface)",
              }}
            >
              Get Hint
            </button>

            <button
              onClick={sendCode}
              disabled={!codeInput.trim() || state !== "ready"}
              className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium whitespace-nowrap"
            >
              <Send size={16} />
              Submit
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
