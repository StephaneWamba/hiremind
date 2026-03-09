"use client"

import Link from "next/link"
import { Play, TrendingUp, Calendar } from "lucide-react"
import { trpc } from "@/lib/trpc"

export default function DashboardPage() {
  const sessionsQuery = trpc.sessions.list.useQuery()

  const sessions = sessionsQuery.data || []
  const hasInterviews = sessions.length > 0
  const completedSessions = sessions.filter(s => s.status === 'completed')

  // Calculate stats
  const stats = {
    total: sessions.length,
    avgScore: completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((sum: number, s) => {
            const scores = s.topicsState?.scorePerTopic ? Object.values(s.topicsState.scorePerTopic) : []
            const avg = scores.length > 0 ? scores.reduce((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0) / scores.length : 0
            return sum + avg
          }, 0) / completedSessions.length
        )
      : 0,
    strongest: "Not enough data",
    lastDate: hasInterviews && sessions[0].createdAt
      ? new Date(sessions[0].createdAt).toLocaleDateString()
      : "—",
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b" style={{ borderColor: "var(--border)" }}>
        <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">Dashboard</h1>
      </div>

      <div className="px-4 sm:px-6 md:px-8 space-y-6 sm:space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Interviews"
            value={String(stats.total)}
            icon={Play}
          />
          <StatCard
            label="Average Score"
            value={`${stats.avgScore}%`}
            icon={TrendingUp}
          />
          <StatCard label="Strongest Area" value={stats.strongest} />
          <StatCard
            label="Last Interview"
            value={stats.lastDate}
            icon={Calendar}
          />
        </div>

        {/* Main Content */}
        {!hasInterviews ? (
          <EmptyState />
        ) : (
          <RecentInterviews sessions={sessions} />
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: React.ElementType
}) {
  return (
    <div
      className="p-6 rounded-lg border"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-text-muted">{label}</h3>
        {Icon && <Icon size={18} className="text-primary" />}
      </div>
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Play
        size={48}
        className="text-text-muted mb-4"
        style={{ opacity: 0.5 }}
      />
      <h2 className="text-lg font-semibold text-text-primary mb-2">
        No interviews yet
      </h2>
      <p className="text-text-muted mb-6 text-center max-w-sm">
        Start your first practice interview to track progress and get detailed feedback.
      </p>
      <Link
        href="/practice"
        className="px-6 py-2 rounded-lg font-medium text-white transition-colors duration-150"
        style={{ backgroundColor: "var(--primary)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--primary-hover)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--primary)")
        }
      >
        Start Interview
      </Link>
    </div>
  )
}

function RecentInterviews({
  sessions,
}: {
  sessions: Array<{
    id: string
    jobRoleId: string
    interviewType: string
    level: string
    status: string | null
    topicsState?: any
    createdAt: string | null | Date
  }>
}) {
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      <div
        className="px-6 py-4 border-b"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border)",
        }}
      >
        <h2 className="font-semibold text-text-primary">Recent Interviews</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg-app)",
              }}
              className="border-b"
            >
              <th className="text-left px-3 sm:px-6 py-3 font-medium text-text-muted text-xs sm:text-sm">
                Role
              </th>
              <th className="text-left px-3 sm:px-6 py-3 font-medium text-text-muted text-xs sm:text-sm">
                Type
              </th>
              <th className="text-left px-3 sm:px-6 py-3 font-medium text-text-muted text-xs sm:text-sm">
                Level
              </th>
              <th className="text-left px-3 sm:px-6 py-3 font-medium text-text-muted text-xs sm:text-sm">
                Score
              </th>
              <th className="text-left px-3 sm:px-6 py-3 font-medium text-text-muted text-xs sm:text-sm">
                Date
              </th>
              <th className="text-left px-3 sm:px-6 py-3 font-medium text-text-muted" />
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => {
              const scores = session.topicsState?.scorePerTopic ? Object.values(session.topicsState.scorePerTopic) : []
              const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0) / scores.length) : null
              const date = session.createdAt ? new Date(session.createdAt).toLocaleDateString() : "—"

              return (
                <tr
                  key={session.id}
                  style={{ borderColor: "var(--border)" }}
                  className="border-b hover:bg-bg-app/50 transition-colors text-sm"
                >
                  <td className="px-3 sm:px-6 py-3 font-medium text-text-primary truncate">
                    {(session as any).roleTitle || "Unknown Role"}
                  </td>
                  <td className="px-3 sm:px-6 py-3 text-text-muted capitalize text-xs sm:text-sm">
                    {session.interviewType.replace("_", " ")}
                  </td>
                  <td className="px-3 sm:px-6 py-3 text-text-muted capitalize text-xs sm:text-sm">
                    {session.level}
                  </td>
                  <td className="px-3 sm:px-6 py-3">
                    {avgScore !== null ? (
                      <span
                        className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{
                          backgroundColor:
                            avgScore >= 80
                              ? "var(--success)"
                              : avgScore >= 60
                                ? "var(--warning)"
                                : "var(--danger)",
                        }}
                      >
                        {avgScore}%
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-3 text-text-muted text-xs sm:text-sm whitespace-nowrap">
                    {date}
                  </td>
                  <td className="px-3 sm:px-6 py-3 text-right">
                    <Link
                      href={`/interview/${session.id}/report`}
                      className="text-primary hover:underline text-xs font-medium"
                    >
                      Report
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
