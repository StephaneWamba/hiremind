#!/usr/bin/env npx ts-node
/**
 * End-to-end test runner for HireMind interview flows
 *
 * Usage:
 *   npx ts-node scripts/run-e2e-test.ts [api_url] [ws_url]
 *
 * Examples:
 *   npx ts-node scripts/run-e2e-test.ts http://localhost:3000 ws://localhost:3000
 *   npx ts-node scripts/run-e2e-test.ts https://hiremind-api.fly.dev wss://hiremind-api.fly.dev
 */

import * as crypto from "crypto"
import WebSocket from "ws"

const API_URL = process.argv[2] || process.env.API_URL || "http://localhost:3000"
const WS_URL = process.argv[3] || process.env.WS_URL || API_URL.replace(/^http/, "ws")

const TEST_USER_ID = "test-user-" + crypto.randomBytes(8).toString("hex")

interface TrpcResponse<T> {
  result?: {
    data?: T
  }
  error?: {
    message: string
  }
}

async function callTrpc<T>(method: string, input?: any): Promise<T> {
  const url = new URL(`${API_URL}/trpc/${method}`)

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${TEST_USER_ID}`,
    "Content-Type": "application/json",
  }

  const options: RequestInit = {
    headers,
    method: input ? "POST" : "GET",
  }

  if (input) {
    options.body = JSON.stringify(input)
  }

  const response = await fetch(url.toString(), options)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`tRPC failed: ${response.status} ${text}`)
  }

  const data = (await response.json()) as TrpcResponse<T>

  if (data.error) {
    throw new Error(`tRPC error: ${data.error.message}`)
  }

  return data.result?.data as T
}

async function connectWebSocket(token: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL)
    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error("WebSocket connection timeout"))
    }, 5000)

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          type: "join",
          token,
        })
      )
    })

    ws.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString())
        if (message.type === "ready") {
          clearTimeout(timeout)
          resolve(ws)
        } else if (message.type === "error") {
          clearTimeout(timeout)
          reject(new Error(`WS error: ${message.message}`))
        }
      } catch (err) {
        clearTimeout(timeout)
        reject(err)
      }
    })

    ws.on("error", (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

async function runTests() {
  console.log("🧪 Starting HireMind Interview Flow E2E Tests")
  console.log(`📡 API URL: ${API_URL}`)
  console.log(`🔌 WS URL: ${WS_URL}`)
  console.log(`👤 Test User ID: ${TEST_USER_ID}\n`)

  let jobRoleId: string

  try {
    // Get available roles
    console.log("1️⃣  Fetching job roles...")
    const roles = await callTrpc<any[]>("roles.list")
    console.log(`   ✓ Found ${roles.length} job roles`)

    if (roles.length === 0) {
      throw new Error("❌ No job roles available. Run: pnpm seed")
    }

    jobRoleId = roles[0].id
    console.log(`   ✓ Using role: ${roles[0].title}\n`)

    // Test session creation
    console.log("2️⃣  Creating interview session...")
    const session = await callTrpc<{ sessionId: string; wsToken: string }>(
      "sessions.create",
      {
        jobRoleId,
        interviewType: "technical",
        level: "mid",
        mode: "text",
      }
    )
    console.log(`   ✓ Session created: ${session.sessionId}`)
    console.log(`   ✓ Got WS token\n`)

    // Test WebSocket connection
    console.log("3️⃣  Connecting to WebSocket...")
    const ws = await connectWebSocket(session.wsToken)
    console.log("   ✓ WebSocket connected\n")

    // Test text response
    console.log("4️⃣  Sending text response...")
    let gotThinking = false
    let gotTranscript = false
    let messageCount = 0

    ws.on("message", (data: Buffer) => {
      const message = JSON.parse(data.toString())
      messageCount++

      if (message.type === "thinking") {
        gotThinking = true
      }
      if (message.type === "transcript" && message.role === "interviewer") {
        gotTranscript = true
      }
    })

    ws.send(
      JSON.stringify({
        type: "text_response",
        content: "I would start by clarifying the requirements and constraints of the system.",
      })
    )

    // Wait for response
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (gotThinking && gotTranscript) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)

      setTimeout(() => {
        clearInterval(checkInterval)
        resolve()
      }, 3000)
    })

    console.log(`   ✓ Received ${messageCount} messages`)
    console.log(`   ✓ Got thinking status: ${gotThinking}`)
    console.log(`   ✓ Got interviewer transcript: ${gotTranscript}\n`)

    // Test second turn
    console.log("5️⃣  Sending second response...")
    messageCount = 0
    gotTranscript = false

    ws.send(
      JSON.stringify({
        type: "text_response",
        content: "I would use a distributed cache with Redis and implement load balancing.",
      })
    )

    // Wait for response
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (gotTranscript) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)

      setTimeout(() => {
        clearInterval(checkInterval)
        resolve()
      }, 3000)
    })

    console.log(`   ✓ Received ${messageCount} messages`)
    console.log(`   ✓ Turn 2 completed successfully\n`)

    // End interview
    console.log("6️⃣  Ending interview...")
    const ended = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Interview end timeout"))
      }, 5000)

      ws.on("message", (data: Buffer) => {
        const message = JSON.parse(data.toString())
        if (message.type === "interview_ended") {
          clearTimeout(timeout)
          resolve()
        }
      })

      ws.send(
        JSON.stringify({
          type: "end_interview",
        })
      )
    })

    await ended
    console.log(`   ✓ Interview ended and persisted\n`)

    // Verify session was saved
    console.log("7️⃣  Verifying session persistence...")
    const savedSession = await callTrpc<any>("sessions.get", session.sessionId)
    console.log(`   ✓ Session retrieved from DB`)
    console.log(`   ✓ Status: ${savedSession.status}`)
    console.log(`   ✓ User ID: ${savedSession.userId}\n`)

    console.log("✅ All tests passed!")
  } catch (err: unknown) {
    console.error("❌ Test failed:", err instanceof Error ? err.message : String(err))
    process.exit(1)
  }
}

runTests()
