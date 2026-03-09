"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface AiFeedbackItem {
  type: "positive" | "warning" | "suggestion"
  message: string
  lineNumber?: number
}

interface AIFeedbackSidebarProps {
  feedback: AiFeedbackItem[]
  isThinking?: boolean
}

export function AIFeedbackSidebar({
  feedback = [
    {
      type: "positive",
      message: "HashMap: O(n) time — optimal approach",
    },
    {
      type: "warning",
      message: "What if input array is empty?",
      lineNumber: 3,
    },
    {
      type: "suggestion",
      message: "Consider edge case: duplicate values",
    },
  ],
  isThinking = false,
}: AIFeedbackSidebarProps) {
  return (
    <div
      className="w-full max-h-full flex flex-col border-l overflow-hidden"
      style={{
        backgroundColor: "var(--iv-surface)",
        borderColor: "var(--iv-border)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 border-b text-xs font-semibold uppercase tracking-widest"
        style={{
          borderColor: "var(--iv-border)",
          color: "var(--iv-accent)",
        }}
      >
        AI Analysis
      </div>

      {/* Feedback items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isThinking ? (
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--iv-accent)" }}
            />
            <span className="text-xs" style={{ color: "var(--iv-text-muted)" }}>
              Analyzing code...
            </span>
          </div>
        ) : feedback.length > 0 ? (
          feedback.map((item, idx) => {
            const iconMap = {
              positive: "✓",
              warning: "⚠",
              suggestion: "●",
            }

            const colorMap = {
              positive: "var(--iv-accent)",
              warning: "#FBBF24",
              suggestion: "#60A5FA",
            }

            return (
              <div
                key={idx}
                className="p-3 rounded text-xs leading-relaxed border"
                style={{
                  backgroundColor: "rgba(0,0,0,0.2)",
                  borderColor: "rgba(255,255,255,0.05)",
                  color: "var(--iv-text-muted)",
                }}
              >
                <div
                  className="font-semibold mb-1"
                  style={{ color: colorMap[item.type] }}
                >
                  {iconMap[item.type]} {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  {item.lineNumber && <span className="ml-2 opacity-60">Ln {item.lineNumber}</span>}
                </div>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p style={{ margin: 0 }}>{children}</p>,
                    strong: ({ children }) => <strong style={{ fontWeight: 600, color: "var(--iv-text)" }}>{children}</strong>,
                    em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
                    code: ({ children }) => (
                      <code
                        style={{
                          backgroundColor: "rgba(255,255,255,0.1)",
                          color: "#60A5FA",
                          padding: "0.125rem 0.25rem",
                          borderRadius: "0.25rem",
                          fontFamily: "monospace",
                          fontSize: "0.875em",
                        }}
                      >
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre
                        style={{
                          backgroundColor: "rgba(0,0,0,0.3)",
                          padding: "0.75rem",
                          borderRadius: "0.375rem",
                          overflowX: "auto",
                          margin: "0.5rem 0 0 0",
                        }}
                      >
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {item.message.replace(/\n+/g, " ").trim()}
                </ReactMarkdown>
              </div>
            )
          })
        ) : (
          <div className="text-xs text-center" style={{ color: "var(--iv-text-muted)" }}>
            No feedback yet
          </div>
        )}
      </div>

      {/* Summary score */}
      <div
        className="px-4 py-3 border-t text-xs text-center"
        style={{
          borderColor: "var(--iv-border)",
          color: "var(--iv-accent)",
          fontWeight: "600",
        }}
      >
        Time Complexity: O(n) ✓
      </div>
    </div>
  )
}
