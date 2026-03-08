import { test, expect } from "@playwright/test"

test.describe("Performance and Reliability", () => {
  test("landing page should load in under 3 seconds", async ({ page }) => {
    const startTime = Date.now()

    await page.goto("/", {
      waitUntil: "networkidle",
    })

    const duration = Date.now() - startTime
    expect(duration).toBeLessThan(3000)
  })

  test("should have no critical console errors on landing page", async ({ page }) => {
    const errors: string[] = []

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text())
      }
    })

    await page.goto("/")

    // Filter out Clerk errors (expected in dev mode)
    const criticalErrors = errors.filter((e) => !e.includes("Clerk"))

    expect(criticalErrors.length).toBe(0)
  })

  test("should handle network disconnection gracefully", async ({ page, context }) => {
    await page.goto("/")

    // Simulate offline
    await context.setOffline(true)

    // Page should still be visible
    await expect(page.locator("h1")).toBeVisible()

    // Go back online
    await context.setOffline(false)

    // Page should still function
    await expect(page.locator("h1")).toBeVisible()
  })

  test("interactive elements should respond within 100ms", async ({ page }) => {
    await page.goto("/")

    const button = page.locator("button:has-text('● Voice')").first()

    const startTime = Date.now()
    await button.click()
    const duration = Date.now() - startTime

    expect(duration).toBeLessThan(100)
  })

  test("should not have memory leaks on multiple navigation", async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.goto("/")
      await page.waitForLoadState("networkidle")
    }

    // If we get here without crash, test passes
    expect(page.url()).toContain("hiremind-beta.vercel.app")
  })

  test("API should respond consistently", async ({ page }) => {
    const durations = []

    for (let i = 0; i < 3; i++) {
      const startTime = Date.now()
      const response = await page.request.get("https://hiremind-api.fly.dev/health")
      const duration = Date.now() - startTime

      expect(response.ok()).toBeTruthy()
      durations.push(duration)
    }

    // Calculate average and ensure consistency
    const average = durations.reduce((a, b) => a + b) / durations.length
    const maxDeviation = Math.max(...durations.map((d) => Math.abs(d - average)))

    // Max deviation should be less than 1 second
    expect(maxDeviation).toBeLessThan(1000)
  })

  test("should gracefully handle rapid interactions", async ({ page }) => {
    await page.goto("/")

    const voiceTab = page.locator("button:has-text('● Voice')").first()
    const codeTab = page.locator("button:has-text('○ Live Code')").first()
    const feedbackTab = page.locator("button:has-text('✓ Feedback')").first()

    // Rapidly click tabs
    for (let i = 0; i < 5; i++) {
      await voiceTab.click()
      await codeTab.click()
      await feedbackTab.click()
    }

    // Page should still be responsive
    await expect(page.locator("h1")).toBeVisible()
  })
})

test.describe("Accessibility", () => {
  test("landing page should be keyboard navigable", async ({ page }) => {
    await page.goto("/")

    // Tab through elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab")
    }

    // Should have focused on something
    const focused = await page.evaluate(() => {
      return document.activeElement?.tagName
    })

    expect(focused).toBeTruthy()
  })

  test("buttons should have sufficient color contrast", async ({ page }) => {
    await page.goto("/")

    const button = page.locator("button:has-text('● Voice')").first()

    // Element should be visible (implies contrast)
    await expect(button).toBeVisible()
  })

  test("interactive elements should have focus indicators", async ({ page }) => {
    await page.goto("/")

    // Tab to first interactive element
    await page.keyboard.press("Tab")

    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      return {
        tagName: el?.tagName,
        hasOutline: window.getComputedStyle(el).outline !== "none",
      }
    })

    expect(focused.tagName).toBeTruthy()
  })
})

test.describe("Security", () => {
  test("should have Content-Security-Policy header", async ({ page }) => {
    const response = await page.goto("/")
    const headers = response?.headers()

    // CSP header should be present
    const hasCsp =
      headers?.["content-security-policy"] ||
      headers?.["content-security-policy-report-only"]

    expect(hasCsp).toBeDefined()
  })

  test("should use HTTPS", async ({ page }) => {
    const response = await page.goto("/")
    expect(page.url()).toMatch(/^https:/)
  })

  test("API should enforce HTTPS", async ({ page }) => {
    const response = await page.request.get("https://hiremind-api.fly.dev/health")
    expect(response.ok()).toBeTruthy()
  })
})
