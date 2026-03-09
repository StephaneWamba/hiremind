"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function UserMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    // Clear cookies via API
    const response = await fetch("/api/auth/clear-token", {
      method: "POST",
    })

    if (response.ok) {
      router.push("/sign-in")
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-sm font-medium text-slate-700 transition"
      >
        U
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
