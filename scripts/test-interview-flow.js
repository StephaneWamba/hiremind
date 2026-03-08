#!/usr/bin/env node
/**
 * Simple end-to-end test for HireMind interview flows
 * Uses only Node.js built-in modules
 *
 * Usage:
 *   node scripts/test-interview-flow.js [api_url]
 *
 * Examples:
 *   node scripts/test-interview-flow.js https://hiremind-api.fly.dev
 */

const https = require("https")
const crypto = require("crypto")

const API_URL = process.argv[2] || "https://hiremind-api.fly.dev"
const TEST_USER_ID = "test-user-" + crypto.randomBytes(8).toString("hex")

function httpsRequest(urlString, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString)
    const method = options.method || "GET"
    const headers = options.headers || {}

    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method,
      headers: {
        "Accept": "application/json",
        ...headers,
      },
    }

    const req = https.request(requestOptions, (res) => {
      let data = ""
      res.on("data", (chunk) => {
        data += chunk
      })
      res.on("end", () => {
        try {
          const json = JSON.parse(data)
          resolve({ status: res.statusCode, body: json })
        } catch (err) {
          resolve({ status: res.statusCode, body: data })
        }
      })
    })

    req.on("error", reject)

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }

    req.end()
  })
}

async function callTrpc(method, input = null) {
  const url = `${API_URL}/trpc/${method}`
  const options = {
    method: input ? "POST" : "GET",
    headers: {
      "Authorization": `Bearer ${TEST_USER_ID}`,
      "Content-Type": "application/json",
    },
  }

  if (input) {
    options.body = input
  }

  const response = await httpsRequest(url, options)

  if (response.status !== 200) {
    throw new Error(`tRPC failed: ${response.status} ${JSON.stringify(response.body)}`)
  }

  if (response.body.error) {
    throw new Error(`tRPC error: ${response.body.error.message}`)
  }

  return response.body.result?.data
}

async function runTests() {
  console.log("🧪 HireMind Interview Flow Test")
  console.log(`📡 API URL: ${API_URL}`)
  console.log(`👤 Test User ID: ${TEST_USER_ID}\n`)

  try {
    // Test 1: Fetch roles
    console.log("1️⃣  Testing roles.list...")
    const roles = await callTrpc("roles.list")
    console.log(`   ✓ Found ${roles.length} job roles`)

    if (roles.length === 0) {
      throw new Error("No job roles found. Seed data may not be loaded.")
    }

    const jobRoleId = roles[0].id
    console.log(`   ✓ Using role: ${roles[0].title}\n`)

    // Test 2: Create session
    console.log("2️⃣  Testing sessions.create...")
    const session = await callTrpc("sessions.create", {
      jobRoleId,
      interviewType: "technical",
      level: "mid",
      mode: "text",
    })

    console.log(`   ✓ Session created: ${session.sessionId}`)
    console.log(`   ✓ Got WS token (${session.wsToken.split(".")[1].length} chars)\n`)

    // Test 3: Fetch session
    console.log("3️⃣  Testing sessions.get...")
    const fetchedSession = await callTrpc("sessions.get", session.sessionId)
    console.log(`   ✓ Session retrieved from DB`)
    console.log(`   ✓ Status: ${fetchedSession.status}`)
    console.log(`   ✓ Mode: ${fetchedSession.mode}\n`)

    // Test 4: List sessions
    console.log("4️⃣  Testing sessions.list...")
    const allSessions = await callTrpc("sessions.list")
    console.log(`   ✓ Retrieved ${allSessions.length} sessions\n`)

    console.log("✅ All API tests passed!\n")
    console.log("📋 Summary:")
    console.log(`   - Job Roles: ${roles.length}`)
    console.log(`   - Session created: ${session.sessionId}`)
    console.log(`   - User sessions: ${allSessions.length}`)
    console.log("\n⚠️  Note: WebSocket testing requires the ws module.")
    console.log("    Full flow testing can be run with: pnpm test:e2e")
  } catch (err) {
    console.error("❌ Test failed:")
    console.error(err)
    process.exit(1)
  }
}

runTests()
