"use client"

interface FeedbackItem {
  dimension: string
  score: number
  maxScore: number
  feedback: string
}

interface FeedbackDisplayProps {
  feedbackItems: FeedbackItem[]
  overallFeedback?: string
}

export function FeedbackDisplay({
  feedbackItems = [
    { dimension: "Problem Solving", score: 8, maxScore: 10, feedback: "Strong logical approach and clear thinking process." },
    { dimension: "Code Quality", score: 7, maxScore: 10, feedback: "Good structure but could optimize for readability." },
    { dimension: "Time Complexity", score: 9, maxScore: 10, feedback: "Excellent analysis of algorithm efficiency." },
    { dimension: "Communication", score: 6, maxScore: 10, feedback: "Clear explanations, but speak more deliberately." },
  ],
  overallFeedback = "Mid-level ready · Strong technical foundation",
}: FeedbackDisplayProps) {
  const avgScore = Math.round(
    feedbackItems.reduce((sum, item) => sum + (item.score / item.maxScore) * 10, 0) / feedbackItems.length
  )

  return (
    <div className="w-full space-y-6 p-6">
      {/* Overall Score */}
      <div className="text-center mb-8">
        <div className="text-4xl font-black mb-2" style={{ color: "var(--iv-accent)" }}>
          {avgScore}/10
        </div>
        <p className="text-sm" style={{ color: "var(--iv-text-muted)" }}>
          {overallFeedback}
        </p>
      </div>

      {/* Feedback Items */}
      <div className="space-y-6">
        {feedbackItems.map((item, idx) => (
          <div key={idx} className="space-y-2">
            {/* Dimension and Score */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: "var(--iv-text)" }}>
                {item.dimension}
              </span>
              <span className="text-sm font-semibold" style={{ color: "var(--iv-accent)" }}>
                {item.score}/{item.maxScore}
              </span>
            </div>

            {/* Score Bar */}
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--iv-border)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.score / item.maxScore) * 100}%`,
                  backgroundColor: "var(--iv-accent)",
                }}
              />
            </div>

            {/* Feedback Text */}
            <p className="text-xs leading-relaxed" style={{ color: "var(--iv-text-muted)" }}>
              {item.feedback}
            </p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div
        className="mt-8 p-4 rounded-lg border text-center"
        style={{
          backgroundColor: "rgba(88, 166, 255, 0.08)",
          borderColor: "var(--iv-border)",
        }}
      >
        <p className="text-xs" style={{ color: "var(--iv-text-muted)" }}>
          📈 Review the detailed feedback above and focus on communication in your next session.
        </p>
      </div>
    </div>
  )
}
