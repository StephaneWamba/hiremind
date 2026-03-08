import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-app">
      <div className="mb-8 text-center">
        <span className="text-xl font-semibold text-text-primary">Hire</span>
        <span className="text-xl font-semibold" style={{ color: "var(--primary)" }}>Mind</span>
        <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-primary align-middle mb-0.5" />
      </div>
      <SignIn
        appearance={{
          elements: {
            card: "shadow-sm border border-border rounded-xl",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
          },
        }}
      />
    </div>
  )
}
