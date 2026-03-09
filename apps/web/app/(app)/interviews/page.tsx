"use client"

import Link from "next/link"
import { useState } from "react"
import { trpc } from "@/lib/trpc"

type FilterType = "all" | "technical" | "behavioral" | "system_design" | "case"

export default function InterviewsPage() {
  const [filter, setFilter] = useState<FilterType>("all")
  const sessionsQuery = trpc.sessions.list.useQuery()

  const filteredSessions = (sessionsQuery.data || []).filter((s) => {
    if (filter === "all") return true
    return s.interviewType === filter
  })

  const sortedSessions = [...filteredSessions].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Technical", value: "technical" },
    { label: "Behavioral", value: "behavioral" },
    { label: "System Design", value: "system_design" },
    { label: "Case Study", value: "case" },
  ]

  return (
    <div className="px-4 sm:px-6 md:px-8 py-8">
      <h1 className="text-2xl font-semibold text-text-primary mb-8">Interview History</h1>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 text-sm font-medium transition-colors ${
              filter === f.value
                ? "text-primary border-b-2 border-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {sessionsQuery.isLoading && <p className="text-text-muted">Loading interviews...</p>}

      {/* Empty state */}
      {!sessionsQuery.isLoading && sortedSessions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-text-muted mb-4">No interviews yet</p>
          <Link
            href="/practice"
            className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            Start practicing
          </Link>
        </div>
      )}

      {/* Sessions table */}
      {!sessionsQuery.isLoading && sortedSessions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-primary">Role</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-primary">Type</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-primary">Level</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-primary">Date</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-primary">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-text-primary">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedSessions.map((session) => (
                <tr key={session.id} className="border-b border-border hover:bg-bg-card transition-colors">
                  <td className="px-4 py-3 text-sm text-text-primary truncate max-w-xs">
                    {(session as any).roleTitle || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-muted capitalize">{session.interviewType}</td>
                  <td className="px-4 py-3 text-sm text-text-muted capitalize">{session.level}</td>
                  <td className="px-4 py-3 text-sm text-text-muted">
                    {session.createdAt ? new Date(session.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        session.status === "completed"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {session.status === "completed" ? "Completed" : "In Progress"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {session.status === "completed" && (
                      <Link
                        href={`/interview/${session.id}/report`}
                        className="text-primary hover:text-primary-hover transition-colors font-medium"
                      >
                        View report →
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
