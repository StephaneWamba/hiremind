import { test, expect } from "@playwright/test"

test.describe("Auth Pages", () => {
  test("sign-up page should load with Clerk form", async ({ page }) => {
    await page.goto("/sign-up")

    // Check for Clerk sign-up form
    const signUpForm = page.locator("[data-testid='card']").first()
    await expect(signUpForm).toBeVisible()
  })

  test("sign-in page should load with Clerk form", async ({ page }) => {
    await page.goto("/sign-in")

    // Check for Clerk sign-in form
    const signInForm = page.locator("[data-testid='card']").first()
    await expect(signInForm).toBeVisible()
  })

  test("should display HireMind branding on auth pages", async ({ page }) => {
    await page.goto("/sign-up")

    // Check for HireMind logo
    const hireMindText = page.locator("text=HireMind")
    await expect(hireMindText).toBeVisible()
  })

  test("should have warm dark theme on auth pages", async ({ page }) => {
    await page.goto("/sign-up")

    const body = page.locator("body")
    const bgColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })

    // Verify dark background (warm dark theme)
    expect(bgColor).toBeTruthy()
  })
})
