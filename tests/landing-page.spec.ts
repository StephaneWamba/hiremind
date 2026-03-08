import { test, expect } from "@playwright/test"

test.describe("Landing Page", () => {
  test("should load landing page with hero section", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveTitle("HireMind — AI Interview Practice")

    // Check hero headline
    await expect(page.locator("h1")).toContainText("The interview is the skill.")
  })

  test("should have navigation with Sign in and Get started buttons", async ({ page }) => {
    await page.goto("/")
    const signInButton = page.locator("a:has-text('Sign in')")
    const getStartedButton = page.locator("a:has-text('Get started')")

    await expect(signInButton).toBeVisible()
    await expect(getStartedButton).toBeVisible()
  })

  test("interactive mockup tabs should be clickable", async ({ page }) => {
    await page.goto("/")

    // Check all three tabs exist
    const voiceTab = page.locator("button:has-text('● Voice')")
    const codeTab = page.locator("button:has-text('○ Live Code')")
    const feedbackTab = page.locator("button:has-text('✓ Feedback')")

    await expect(voiceTab).toBeVisible()
    await expect(codeTab).toBeVisible()
    await expect(feedbackTab).toBeVisible()

    // Click on Live Code tab
    await codeTab.click()
    await expect(page.locator("text=function twoSum")).toBeVisible()

    // Click on Feedback tab
    await feedbackTab.click()
    await expect(page.locator("text=Problem Solving")).toBeVisible()
    await expect(page.locator("text=Mid-level ready")).toBeVisible()

    // Click back on Voice tab
    await voiceTab.click()
    await expect(page.locator("text=Walk me through how you'd design")).toBeVisible()
  })

  test("should have modes section with two cards", async ({ page }) => {
    await page.goto("/")

    const voiceCard = page.locator("h3:has-text('Voice Interview')")
    const codingCard = page.locator("h3:has-text('Real-Time Assessment')")

    await expect(voiceCard).toBeVisible()
    await expect(codingCard).toBeVisible()
  })

  test("should have testimonial quote section", async ({ page }) => {
    await page.goto("/")

    const quote = page.locator("blockquote")
    await expect(quote).toContainText("I failed two Amazon loops")
  })

  test("CTA buttons should be clickable", async ({ page }) => {
    await page.goto("/")

    const startButton = page.locator("a:has-text('Start practicing')").first()
    await expect(startButton).toBeVisible()
    // Don't navigate away, just verify it exists
  })

  test("footer should be present", async ({ page }) => {
    await page.goto("/")

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    const footer = page.locator("footer")
    await expect(footer).toBeVisible()
    await expect(footer).toContainText("Made for ambitious engineers")
  })
})
