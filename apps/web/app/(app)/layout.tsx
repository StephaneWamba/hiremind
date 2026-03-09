import Link from "next/link"
import { AppNav } from "@/components/app-nav"
import { UserMenu } from "@/components/user-menu"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-bg-app">
      <aside
        className="fixed left-0 top-0 h-full flex flex-col"
        style={{
          width: 240,
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border)",
          zIndex: 50,
        }}
      >
        <div className="px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <Link href="/dashboard" className="flex items-center gap-1.5 no-underline">
            <span className="text-base font-semibold text-text-primary">HireMind</span>
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: "var(--primary)" }}
            />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <AppNav />
        </nav>

        <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          <UserMenu />
        </div>
      </aside>

      <div className="flex-1" style={{ marginLeft: 240 }}>
        {children}
      </div>
    </div>
  )
}
