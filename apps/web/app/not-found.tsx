import Link from "next/link"

export const dynamic = "force-dynamic"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-app px-4">
      <h1 className="text-4xl font-bold text-text-primary mb-2">404</h1>
      <p className="text-text-muted mb-6">Page not found</p>
      <Link
        href="/"
        className="px-6 py-2 rounded-lg text-white transition-colors"
        style={{ background: "var(--primary)" }}
      >
        Go home
      </Link>
    </div>
  )
}
