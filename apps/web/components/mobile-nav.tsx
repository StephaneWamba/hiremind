"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Play, History } from "lucide-react"

export function MobileNav() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname?.startsWith(path)

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-bg-card border-t border-border">
      <div className="flex items-center justify-around">
        <Link
          href="/dashboard"
          className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
            isActive("/dashboard")
              ? "text-primary"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <LayoutDashboard size={24} />
          <span className="text-xs mt-1">Dashboard</span>
        </Link>

        <Link
          href="/practice"
          className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
            isActive("/practice")
              ? "text-primary"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <Play size={24} />
          <span className="text-xs mt-1">Practice</span>
        </Link>

        <Link
          href="/interviews"
          className={`flex-1 flex flex-col items-center justify-center py-3 transition-colors ${
            isActive("/interviews")
              ? "text-primary"
              : "text-text-muted hover:text-text-primary"
          }`}
        >
          <History size={24} />
          <span className="text-xs mt-1">Interviews</span>
        </Link>
      </div>
    </nav>
  )
}
