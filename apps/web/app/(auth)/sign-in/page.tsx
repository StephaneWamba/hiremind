"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await fetch("/api/auth/set-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),
      })
      router.push("/dashboard")
    },
    onError: (err) => {
      setError(err.message || "Sign in failed")
      setIsLoading(false)
    },
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError("Email and password are required")
      setIsLoading(false)
      return
    }

    loginMutation.mutate({ email, password })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--bg-app)" }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            <span style={{ color: "var(--text-primary)" }}>Hire</span>
            <span style={{ color: "var(--primary)" }}>Mind</span>
            <span className="ml-1 inline-block w-2.5 h-2.5 rounded-full align-middle mb-1" style={{ background: "var(--primary)" }} />
          </h1>
        </div>

        <div className="rounded-xl p-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Welcome back</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Sign in to your HireMind account</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.25)", color: "#FF6B6B" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2 rounded-lg focus:outline-none transition-colors"
                style={{
                  background: "var(--bg-app)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-lg focus:outline-none transition-colors"
                style={{
                  background: "var(--bg-app)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg font-medium text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
              style={{ background: "var(--primary)" }}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <Link href="/sign-up" className="font-medium hover:underline transition-colors" style={{ color: "var(--primary)" }}>
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
