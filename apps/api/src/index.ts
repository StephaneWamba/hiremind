import { Hono } from "hono"
import { serve } from "@hono/node-server"
import { cors } from "hono/cors"
import { WebSocketServer } from "ws"
import { handleClerkWebhook } from "./webhooks/clerk"
import { handleTrpc } from "./trpc/handler"
import { handleWsConnection } from "./ws/handler"
import type { Server } from "http"

const app = new Hono()

// CORS middleware
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
  })
)

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Clerk webhook
app.post("/webhooks/clerk", async (c) => {
  const signature = c.req.header("svix-signature") || ""
  const body = await c.req.text()

  try {
    await handleClerkWebhook(body, signature)
    return c.json({ success: true })
  } catch (err) {
    console.error("Webhook error:", err)
    return c.json({ error: "Unauthorized" }, 401)
  }
})

// tRPC routes
app.all("/trpc/*", handleTrpc)

const port = parseInt(process.env.PORT || "3000")

console.log(`🚀 Server running on port ${port}`)

const server = serve(
  {
    fetch: app.fetch,
    port,
    hostname: "0.0.0.0",
  },
  (info) => {
    console.log(`Listening on http://${info.address}:${info.port}`)
  }
) as unknown as Server

// WebSocket upgrade
const wss = new WebSocketServer({ server })
wss.on("connection", handleWsConnection)
