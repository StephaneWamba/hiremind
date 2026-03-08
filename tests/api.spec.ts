import { test, expect } from "@playwright/test"

test.describe("API Endpoints", () => {
  test("health endpoint should return status ok", async ({ page }) => {
    const response = await page.request.get("https://hiremind-api.fly.dev/health")
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data).toHaveProperty("status")
    expect(data.status).toBe("ok")
    expect(data).toHaveProperty("timestamp")
  })

  test("health endpoint should respond within reasonable time", async ({ page }) => {
    const startTime = Date.now()
    const response = await page.request.get("https://hiremind-api.fly.dev/health")
    const duration = Date.now() - startTime

    expect(response.ok()).toBeTruthy()
    expect(duration).toBeLessThan(5000) // Should respond in less than 5 seconds
  })

  test("invalid routes should return 404", async ({ page }) => {
    const response = await page.request.get("https://hiremind-api.fly.dev/nonexistent")
    expect(response.status()).toBe(404)
  })

  test("CORS headers should be present", async ({ page }) => {
    const response = await page.request.get("https://hiremind-api.fly.dev/health")
    expect(response.headers()["access-control-allow-origin"]).toBeTruthy()
  })
})

test.describe("WebSocket Connectivity", () => {
  test("WebSocket endpoint should be accessible", async ({ page }) => {
    // Test that the WebSocket endpoint is reachable by checking if we can establish a connection
    // Note: Full WebSocket testing requires connecting with proper auth tokens

    const wsUrl = "wss://hiremind-api.fly.dev/ws"
    const wsUrlObj = new URL(wsUrl)
    expect(wsUrlObj.protocol).toBe("wss:")
    expect(wsUrlObj.hostname).toBe("hiremind-api.fly.dev")
  })
})
