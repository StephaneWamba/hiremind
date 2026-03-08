"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronRight, Code2, Mic2 } from "lucide-react"

/* ─── Navigation ────────────────────────────────────────────────── */
function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: scrolled
          ? "rgba(14,13,12,0.92)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled
          ? "1px solid var(--mk-border)"
          : "1px solid transparent",
        transition: "background 300ms cubic-bezier(0.4, 0, 0.2, 1), border-bottom 300ms cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold" style={{ color: "var(--mk-text)" }}>
            HireMind
          </span>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--mk-ember)" }} />
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 no-underline"
            style={{ color: "var(--mk-muted)" }}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="px-4 py-2 rounded-xl text-sm font-medium text-white no-underline transition-all duration-150"
            style={{ background: "var(--mk-ember)" }}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

/* ─── Interactive 3-Tab Mockup Component ──────────────────────── */
function InteractiveMockup() {
  const [activeTab, setActiveTab] = useState<"voice" | "coding" | "feedback">("voice")

  return (
    <div className="relative select-none">
      {/* Ambient glow */}
      <div
        className="absolute -inset-8 rounded-3xl blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(224,123,57,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Window */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "var(--mk-surface)",
          border: "1px solid var(--mk-border)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom: "1px solid var(--mk-border)",
            background: "rgba(255,255,255,0.01)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F57" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28C840" }} />
          </div>
          <span className="text-[11px]" style={{ color: "var(--mk-muted)" }}>Sr. Engineer · Technical</span>
        </div>

        {/* Tab selector */}
        <div
          className="flex border-b"
          style={{ borderColor: "var(--mk-border)", background: "rgba(0,0,0,0.2)" }}
        >
          {(["voice", "coding", "feedback"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 px-4 py-3 text-sm font-medium transition-all duration-150 text-center uppercase tracking-wider"
              style={{
                color: activeTab === tab ? "var(--mk-ember)" : "var(--mk-muted)",
                borderBottom:
                  activeTab === tab ? "2px solid var(--mk-ember)" : "2px solid transparent",
                background: activeTab === tab ? "rgba(224,123,57,0.05)" : "transparent",
              }}
            >
              {tab === "voice" && <span>● Voice</span>}
              {tab === "coding" && <span>○ Live Code</span>}
              {tab === "feedback" && <span>✓ Feedback</span>}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="p-6 min-h-80">
          {/* Voice tab */}
          {activeTab === "voice" && (
            <div className="space-y-4 animate-fade-up">
              {/* Status */}
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs" style={{ color: "var(--mk-muted)" }}>
                  Live · 1:23
                </span>
              </div>

              {/* AI question */}
              <div className="flex gap-3">
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-semibold"
                  style={{
                    background: "var(--mk-ember-dim)",
                    border: "1px solid var(--mk-ember-border)",
                    color: "var(--mk-ember)",
                  }}
                >
                  AI
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed flex-1"
                  style={{ background: "var(--mk-surface-2)", color: "var(--mk-text)" }}
                >
                  Walk me through how you'd design a URL shortener for 100M daily requests.
                </div>
              </div>

              {/* Candidate response */}
              <div className="flex gap-3 flex-row-reverse">
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-semibold"
                  style={{ background: "var(--mk-subtle)", color: "var(--mk-muted)" }}
                >
                  U
                </div>
                <div
                  className="rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed flex-1"
                  style={{ background: "rgba(224,123,57,0.08)", color: "var(--mk-text)" }}
                >
                  I'd start by clarifying requirements — read/write ratio, expected QPS, then move to
                  a hash-based approach...
                  <span className="inline-block w-0.5 h-3.5 ml-1 cursor-blink" style={{ background: "var(--mk-ember)" }} />
                </div>
              </div>

              {/* Waveform bars */}
              <div className="flex items-center justify-center gap-1.5 pt-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-sm"
                    style={{
                      height: `${24 + Math.sin(i / 2) * 12}px`,
                      background: "var(--mk-ember)",
                      opacity: 0.6 + Math.cos(i / 3) * 0.4,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Live Coding tab */}
          {activeTab === "coding" && (
            <div className="space-y-3 animate-fade-up text-sm font-mono">
              <div style={{ color: "var(--mk-muted)" }}>
                <span style={{ color: "var(--mk-code-purple)" }}>function</span>{" "}
                <span>twoSum(nums, target)</span> {"{"}
              </div>
              <div style={{ color: "var(--mk-muted)" }}>
                {"  "}
                <span style={{ color: "var(--mk-code-purple)" }}>const</span>{" "}
                <span style={{ color: "var(--mk-code-blue)" }}>map</span> = <span style={{ color: "var(--mk-code-purple)" }}>new</span> Map();
              </div>
              <div style={{ color: "var(--mk-muted)" }}>
                {"  "}
                <span style={{ color: "var(--mk-code-purple)" }}>for</span> (<span style={{ color: "var(--mk-code-blue)" }}>let</span> i = 0; i &lt; nums.length;
                i++)
              </div>
              <div style={{ color: "var(--mk-muted)" }}>
                {"    "}
                <span style={{ color: "var(--mk-code-purple)" }}>const</span>{" "}
                <span style={{ color: "var(--mk-code-blue)" }}>comp</span> = target - nums[i];
              </div>
              <div style={{ color: "var(--mk-code-green)" }}>
                {"    "}
                <span style={{ color: "var(--mk-code-purple)" }}>if</span> (map.has(comp))
                <span style={{ color: "var(--mk-code-purple)" }}> return</span> [map.get(comp), i];
                <span className="animate-pulse">▌</span>
              </div>
              <div style={{ color: "var(--mk-muted)" }}>{"  }"}</div>
              <div style={{ color: "var(--mk-muted)" }}>{"}"}
              </div>

              {/* AI feedback sidebar */}
              <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--mk-border)" }}>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--mk-muted)" }}>
                  AI Analysis
                </div>
                <div className="space-y-2 text-xs" style={{ color: "var(--mk-code-green)" }}>
                  <div>✓ HashMap: O(n) time — optimal</div>
                </div>
                <div className="space-y-2 text-xs mt-2" style={{ color: "var(--mk-code-yellow)" }}>
                  <div>⚠ What if nums is empty?</div>
                </div>
                <div className="space-y-2 text-xs mt-2" style={{ color: "var(--mk-code-blue)" }}>
                  <div>● Edge: no valid pair?</div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback tab */}
          {activeTab === "feedback" && (
            <div className="space-y-5 animate-fade-up">
              {[
                { label: "Problem Solving", score: 8, max: 10 },
                { label: "Code Quality", score: 7, max: 10 },
                { label: "Time Complexity", score: 9, max: 10 },
                { label: "Communication", score: 6, max: 10 },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--mk-text)" }}>
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "var(--mk-ember)" }}>
                      {item.score}/{item.max}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ background: "var(--mk-subtle)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.score / item.max) * 100}%`,
                        background: "var(--mk-ember)",
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Badge */}
              <div
                className="mt-6 pt-4 px-4 py-3 rounded-lg text-sm text-center font-medium"
                style={{
                  background: "var(--mk-ember-dim)",
                  color: "var(--mk-ember)",
                  border: "1px solid var(--mk-ember-border)",
                }}
              >
                Mid-level ready · Strong overall
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Hero Section ────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center pt-14" style={{ background: "var(--mk-bg)" }}>
      <div className="max-w-6xl mx-auto px-6 w-full grid grid-cols-2 gap-12 lg:gap-16">
        {/* Left column */}
        <div className="flex flex-col justify-center">
          {/* Eyebrow */}
          <div className="text-xs font-mono mb-6 tracking-widest" style={{ color: "var(--mk-muted)" }}>
            PUBLIC BETA
          </div>

          {/* Headline */}
          <h1
            className="text-6xl lg:text-7xl font-black leading-[1.1] mb-6 tracking-tighter"
            style={{ color: "var(--mk-text)" }}
          >
            The interview is the skill.
          </h1>

          {/* Subheadline */}
          <p className="text-lg leading-relaxed mb-10 max-w-lg" style={{ color: "var(--mk-muted)" }}>
            Practice voice interviews and live coding sessions with an AI that watches every keystroke, hears every
            hesitation — and tells you the truth.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-4 mb-10">
            <Link
              href="/sign-up"
              className="px-6 py-3 rounded-xl font-semibold text-white no-underline transition-all duration-150 hover:opacity-90"
              style={{ background: "var(--mk-ember)" }}
            >
              Start practicing
            </Link>
            <Link
              href="#modes"
              className="flex items-center gap-2 font-medium no-underline transition-colors duration-150 group"
              style={{ color: "var(--mk-muted)" }}
            >
              See it live <ChevronRight size={16} />
            </Link>
          </div>
        </div>

        {/* Right column — Interactive mockup */}
        <div className="flex items-center justify-center lg:pt-0 pt-8">
          <InteractiveMockup />
        </div>
      </div>
    </section>
  )
}

/* ─── Modes Section ───────────────────────────────────────────── */
function ModesSection() {
  return (
    <section id="modes" className="py-24" style={{ background: "var(--mk-bg)" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Voice Interview card */}
          <div
            className="rounded-2xl p-10 relative overflow-hidden group"
            style={{
              background: "var(--mk-surface)",
              border: "1px solid var(--mk-border)",
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
              background: "radial-gradient(circle at 30% 40%, rgba(224,123,57,0.08) 0%, transparent 50%)",
              pointerEvents: "none",
            }} />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <Mic2 size={24} style={{ color: "var(--mk-ember)" }} />
                <span className="text-xs font-mono tracking-widest" style={{ color: "var(--mk-muted)" }}>
                  VOICE + TEXT
                </span>
              </div>

              <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--mk-text)" }}>
                Voice Interview
              </h3>

              <p className="text-base leading-relaxed mb-8" style={{ color: "var(--mk-muted)" }}>
                Answer questions under realistic pressure. The AI adapts difficulty based on your responses, focusing on your weaknesses.
              </p>

              {/* Waveform visual */}
              <div className="flex items-center gap-1 h-8">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${8 + (i % 3) * 4}px`,
                      background: "var(--mk-ember)",
                      opacity: 0.4,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Live Coding card */}
          <div
            className="rounded-2xl p-10 relative overflow-hidden group"
            style={{
              background: "var(--mk-surface)",
              border: "1px solid var(--mk-border)",
            }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
              background: "radial-gradient(circle at 70% 40%, rgba(224,123,57,0.08) 0%, transparent 50%)",
              pointerEvents: "none",
            }} />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <Code2 size={24} style={{ color: "var(--mk-ember)" }} />
                <span className="text-xs font-mono tracking-widest" style={{ color: "var(--mk-muted)" }}>
                  LIVE CODING
                </span>
              </div>

              <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--mk-text)" }}>
                Real-Time Assessment
              </h3>

              <p className="text-base leading-relaxed mb-8" style={{ color: "var(--mk-muted)" }}>
                Code in real time while the AI watches every keystroke. Get instant feedback on logic, efficiency, and edge cases.
              </p>

              {/* Code snippet visual */}
              <div className="font-mono text-xs space-y-1" style={{ color: "var(--mk-code-green)" }}>
                <div>const result = twoSum([2,7], 9)</div>
                <div style={{ color: "var(--mk-code-yellow)" }}>// → [0,1]</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Quote Section ───────────────────────────────────────────── */
function QuoteSection() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "var(--mk-bg)" }}>
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Overlay gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to right, rgba(14,13,12,0.92) 40%, rgba(14,13,12,0.4) 100%)",
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6">
        <blockquote className="text-4xl lg:text-5xl font-black leading-tight" style={{ color: "var(--mk-text)" }}>
          I failed two Amazon loops. Used HireMind for two weeks. Third loop: offer.
        </blockquote>

        <cite className="block mt-8 text-sm font-mono tracking-widest" style={{ color: "var(--mk-muted)" }}>
          Kwame A., Software Engineer
        </cite>
      </div>
    </section>
  )
}

/* ─── Final CTA Section ────────────────────────────────────────── */
function FinalCTASection() {
  return (
    <section className="py-20" style={{ background: "var(--mk-bg)" }}>
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold mb-6" style={{ color: "var(--mk-text)" }}>
          Your next interview is a practice session.
        </h2>
        <Link
          href="/sign-up"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white no-underline transition-all duration-150 hover:opacity-90"
          style={{ background: "var(--mk-ember)" }}
        >
          Get started — it's free
          <ChevronRight size={16} />
        </Link>
      </div>
    </section>
  )
}

/* ─── Footer ────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer
      className="py-12"
      style={{
        background: "var(--mk-bg)",
        borderTop: "1px solid var(--mk-border)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between">
          <div style={{ color: "var(--mk-muted)" }}>
            <span className="font-semibold" style={{ color: "var(--mk-text)" }}>
              HireMind
            </span>
            {" "}· © 2026
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm no-underline" style={{ color: "var(--mk-muted)" }}>
              Privacy
            </Link>
            <Link href="#" className="text-sm no-underline" style={{ color: "var(--mk-muted)" }}>
              Terms
            </Link>
          </div>
          <div style={{ color: "var(--mk-muted)" }} className="text-sm">
            Made for ambitious engineers.
          </div>
        </div>
      </div>
    </footer>
  )
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function MarketingPage() {
  return (
    <main>
      <MarketingNav />
      <HeroSection />
      <ModesSection />
      <QuoteSection />
      <FinalCTASection />
      <Footer />
    </main>
  )
}
