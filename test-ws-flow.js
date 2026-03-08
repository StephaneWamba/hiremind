#!/usr/bin/env node
/**
 * WebSocket interview flow test - validates complete interview with AI
 */
const https = require('https')
const WebSocket = require('ws')

const API_URL = 'https://hiremind-api.fly.dev'
const TEST_USER_ID = 'user_3Ag1yNnPT2pV841uNg03dLCTlxX'

function httpsRequest(urlString, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString)
    const method = options.method || 'GET'
    const headers = options.headers || {}

    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
    }

    const req = https.request(requestOptions, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          resolve({ status: res.statusCode, body: json })
        } catch (err) {
          resolve({ status: res.statusCode, body: data })
        }
      })
    })

    req.on('error', reject)

    if (options.body) {
      req.write(JSON.stringify(options.body))
    }

    req.end()
  })
}

async function callTrpc(method, input = null) {
  const url = `${API_URL}/trpc/${method}`
  const options = {
    method: input ? 'POST' : 'GET',
    headers: {
      'Authorization': `Bearer ${TEST_USER_ID}`,
      'Content-Type': 'application/json',
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

async function testWebSocketFlow() {
  console.log('🧪 HireMind WebSocket Interview Flow Test\n')

  try {
    // Get roles
    console.log('1️⃣  Fetching job roles...')
    const roles = await callTrpc('roles.list')
    console.log(`   ✓ Found ${roles.length} roles\n`)

    const jobRoleId = roles[0].id

    // Create session
    console.log('2️⃣  Creating interview session...')
    const session = await callTrpc('sessions.create', {
      jobRoleId,
      interviewType: 'technical',
      level: 'mid',
      mode: 'text',
    })

    const sessionId = session.sessionId
    const wsToken = session.wsToken
    console.log(`   ✓ Session created: ${sessionId}`)
    console.log(`   ✓ WS Token generated\n`)

    // Connect via WebSocket
    console.log('3️⃣  Connecting to interview WebSocket...')
    const ws = new WebSocket(`wss://hiremind-api.fly.dev/ws`, {
      headers: {
        'Authorization': `Bearer ${TEST_USER_ID}`,
      }
    })

    return new Promise((resolve, reject) => {
      let isConnected = false
      let turnCount = 0
      const timeout = setTimeout(() => {
        ws.close()
        reject(new Error('WebSocket timeout - no messages received'))
      }, 30000)

      ws.on('open', () => {
        console.log('   ✓ WebSocket connected\n')
        isConnected = true

        // Send join message
        console.log('4️⃣  Sending join message...')
        ws.send(JSON.stringify({
          type: 'join',
          sessionId,
          token: wsToken,
        }))
      })

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString())
          console.log(`   📨 Received: ${msg.type}`)

          if (msg.type === 'ready') {
            console.log(`   ✓ Session ready. Sending text response...\n`)
            console.log('5️⃣  Sending candidate response...')
            
            // Send a text response
            ws.send(JSON.stringify({
              type: 'text_response',
              text: 'I would approach this problem by first understanding the requirements and then breaking it down into smaller components.',
            }))
          } else if (msg.type === 'thinking') {
            console.log(`   ✓ AI is thinking...\n`)
          } else if (msg.type === 'interviewer_response') {
            turnCount++
            console.log(`   ✓ AI response received (turn ${turnCount})`)
            if (msg.text) {
              console.log(`      "${msg.text.substring(0, 100)}..."\n`)
            }

            if (turnCount === 2) {
              console.log('6️⃣  Testing reconnection...')
              ws.close()
            } else if (turnCount > 2) {
              console.log('7️⃣  Ending interview...\n')
              ws.send(JSON.stringify({
                type: 'end_interview',
              }))
            }
          } else if (msg.type === 'turn_evaluation') {
            console.log(`   ✓ Turn evaluated: ${JSON.stringify(msg.evaluation).substring(0, 80)}...`)
          } else if (msg.type === 'interview_ended') {
            console.log(`   ✓ Interview ended\n`)
            console.log('✅ WebSocket interview flow test passed!')
            clearTimeout(timeout)
            ws.close()
            resolve()
          } else if (msg.type === 'error') {
            console.log(`   ❌ Error: ${msg.message}`)
            clearTimeout(timeout)
            ws.close()
            reject(new Error(`WebSocket error: ${msg.message}`))
          }
        } catch (err) {
          console.error('   ❌ Failed to parse message:', err)
        }
      })

      ws.on('error', (err) => {
        clearTimeout(timeout)
        reject(new Error(`WebSocket error: ${err.message}`))
      })

      ws.on('close', () => {
        if (turnCount >= 2 && !isConnected) {
          console.log('   ✓ Connection closed after testing')
        }
        if (turnCount < 2) {
          clearTimeout(timeout)
          reject(new Error('WebSocket closed unexpectedly'))
        }
      })
    })
  } catch (err) {
    console.error('❌ Test failed:')
    console.error(err.message)
    process.exit(1)
  }
}

testWebSocketFlow()
