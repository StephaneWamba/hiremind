"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const signupMutation = trpc.auth.signup.useMutation({
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
      setError(err.message || "Sign up failed")
      setIsLoading(false)
    },
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    signupMutation.mutate({ email, password, name })
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
          <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Create account</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Start practicing interviews today</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.25)", color: "#FF6B6B" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
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
              <p className="text-xs mt-1" style={{ color: "var(--text-subtle)" }}>Minimum 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium hover:underline transition-colors" style={{ color: "var(--primary)" }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
