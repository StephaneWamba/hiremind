"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Brain, MessageSquare, Code2, Briefcase, Volume2, Type, FileCode } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { cn } from "@/lib/utils"

export default function PracticePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<string>("mid")
  const [selectedMode, setSelectedMode] = useState<string>("voice")
  const [isLoading, setIsLoading] = useState(false)

  const rolesQuery = trpc.roles.list.useQuery()
  const createSession = trpc.sessions.create.useMutation()

  const interviewTypes: Array<{
    id: "technical" | "behavioral" | "system_design" | "case"
    name: string
    icon: React.ElementType
    description: string
  }> = [
    {
      id: "technical",
      name: "Technical",
      icon: Code2,
      description: "Algorithm, design patterns, coding fundamentals",
    },
    {
      id: "behavioral",
      name: "Behavioral",
      icon: MessageSquare,
      description: "Team dynamics, conflict resolution, impact stories",
    },
    {
      id: "system_design",
      name: "System Design",
      icon: Briefcase,
      description: "Architecture, scalability, tradeoff analysis",
    },
    {
      id: "case",
      name: "Case Study",
      icon: Brain,
      description: "Problem-solving, business acumen, strategy",
    },
  ]

  const handleStart = async () => {
    if (!selectedRole || !selectedType) return

    setIsLoading(true)
    try {
      const session = await createSession.mutateAsync({
        jobRoleId: selectedRole,
        interviewType: selectedType as "technical" | "behavioral" | "system_design" | "case",
        level: selectedLevel as "junior" | "mid" | "senior",
        mode: selectedMode as "voice" | "text" | "coding",
      })
      // Store wsToken temporarily for interview room to use
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`wsToken_${session.sessionId}`, session.wsToken)
      }
      router.push(`/interview/${session.sessionId}`)
    } catch (error) {
      console.error("Failed to create session:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8">
      <h1 className="text-lg sm:text-xl font-semibold text-text-primary mb-8 sm:mb-12">Start a Practice Interview</h1>

      {/* Step indicator */}
      <div className="mb-8 sm:mb-12 flex items-center justify-center gap-4 sm:gap-8 md:gap-12">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                step === s
                  ? "bg-primary text-white"
                  : step > s
                    ? "bg-primary text-white"
                    : "bg-border text-text-muted"
              )}
            >
              {step > s ? "✓" : s}
            </div>
            <span className="text-xs font-medium text-text-muted text-center">
              {s === 1 ? "Role" : s === 2 ? "Type" : "Level & Mode"}
            </span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              Which role are you interviewing for?
            </h2>
            {rolesQuery.isLoading ? (
              <p className="text-text-muted">Loading roles...</p>
            ) : rolesQuery.data ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rolesQuery.data.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={cn(
                      "text-left p-4 rounded-lg border-2 transition-colors",
                      selectedRole === role.id
                        ? "border-primary bg-primary-bg"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <h3 className="font-semibold text-text-primary">{role.title}</h3>
                    <span className="inline-block mt-3 px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
                      {role.category}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-6">
              Which interview type?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviewTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={cn(
                      "text-left p-6 rounded-lg border-2 transition-colors",
                      selectedType === type.id
                        ? "border-primary bg-primary-bg"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <Icon size={24} className="text-primary mb-2" />
                    <h3 className="font-semibold text-text-primary">{type.name}</h3>
                    <p className="text-sm text-text-muted mt-1">{type.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Difficulty Level</h2>
              <div className="flex flex-wrap gap-3">
                {["junior", "mid", "senior"].map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      setSelectedLevel(level as "junior" | "mid" | "senior")
                    }
                    className={cn(
                      "px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors",
                      selectedLevel === level
                        ? "bg-primary text-white hover:bg-primary-hover"
                        : "bg-border text-text-primary hover:bg-primary hover:text-white"
                    )}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4">Interview Mode</h2>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: "voice", label: "Voice", icon: Volume2 },
                  { id: "text", label: "Text", icon: Type },
                  { id: "coding", label: "Live Coding", icon: FileCode },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedMode(id as "voice" | "text" | "coding")}
                    className={cn(
                      "flex items-center gap-2 px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
                      selectedMode === id
                        ? "bg-primary text-white hover:bg-primary-hover"
                        : "bg-border text-text-primary hover:bg-primary hover:text-white"
                    )}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="w-full sm:w-auto px-6 py-2 rounded-lg font-medium text-text-primary bg-border hover:bg-border/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => {
            if (step === 3) {
              handleStart()
            } else {
              setStep(step + 1)
            }
          }}
          disabled={
            (step === 1 && !selectedRole) ||
            (step === 2 && !selectedType) ||
            isLoading
          }
          className="w-full sm:w-auto px-6 py-2 rounded-lg font-medium text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {step === 3 ? isLoading ? "Starting..." : "Start Interview" : "Next"}
        </button>
      </div>
    </div>
  )
}
