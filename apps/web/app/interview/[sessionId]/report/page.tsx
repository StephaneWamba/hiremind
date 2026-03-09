"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc"

export default function InterviewReportPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const reportQuery = trpc.sessions.getReport.useQuery(sessionId)

  if (reportQuery.isLoading) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center">
        <p className="text-text-muted">Loading report...</p>
      </div>
    )
  }

  if (reportQuery.error || !reportQuery.data) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-muted mb-4">Report not found</p>
          <Link href="/interviews" className="text-primary hover:text-primary-hover">
            Back to interviews
          </Link>
        </div>
      </div>
    )
  }

  const { session, turns, topicsState } = reportQuery.data

  const scoreTopics = [
    { name: "Technical Depth", key: "technical_depth" },
    { name: "Communication", key: "communication" },
    { name: "Problem Solving", key: "problem_solving" },
    { name: "Relevance", key: "relevance" },
  ]

  return (
    <div className="min-h-screen bg-bg-app p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link href="/interviews" className="text-primary hover:text-primary-hover text-sm mb-6 inline-block">
          ← Back to interviews
        </Link>

        <div className="bg-bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">{session.roleTitle}</h1>
              <p className="text-text-muted capitalize">
                {session.interviewType} · {session.level} level · {session.mode} mode
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-muted">
                {session.createdAt ? new Date(session.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
              </p>
              {session.durationMinutes && <p className="text-sm text-text-muted">{session.durationMinutes} minutes</p>}
            </div>
          </div>

          {/* Score bars */}
          <div className="space-y-4">
            {scoreTopics.map(({ name, key }) => {
              const score = topicsState.scorePerTopic[key] || 0
              const percentage = (score / 10) * 100
              return (
                <div key={key}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">{name}</span>
                    <span className="text-sm font-semibold text-primary">
                      {score}/10
                    </span>
                  </div>
                  <div className="w-full bg-bg-app rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Interview Transcript</h2>

        <div className="space-y-4">
          {turns.map((turn, idx) => (
            <div key={idx} className={`p-4 rounded-lg ${
              turn.role === "interviewer"
                ? "bg-bg-card border-l-4 border-primary"
                : "bg-primary/5 border-l-4 border-text-muted"
            }`}>
              <div className="text-xs font-semibold text-text-muted uppercase mb-2">
                {turn.role === "interviewer" ? "Interviewer" : "You"}
              </div>
              <p className="text-text-primary leading-relaxed">{turn.content}</p>
            </div>
          ))}
        </div>

        {turns.length === 0 && (
          <p className="text-center text-text-muted py-8">No transcript available</p>
        )}
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto mt-12 text-center">
        <Link
          href="/practice"
          className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
        >
          Practice again
        </Link>
      </div>
    </div>
  )
}
