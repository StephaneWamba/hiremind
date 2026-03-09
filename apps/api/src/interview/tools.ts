import type { TurnEvaluation } from "@hiremind/shared"
import type { InterviewSession } from "./state"

export async function evaluateAnswer(
  session: InterviewSession,
  feedback: {
    technical_depth: number
    communication: number
    problem_solving: number
    relevance: number
  }
): Promise<TurnEvaluation> {
  const avgScore = Math.round((feedback.technical_depth + feedback.communication + feedback.problem_solving + feedback.relevance) / 4)

  // Adjust difficulty (clamped 1-10)
  if (avgScore >= 8) {
    session.currentDifficulty = Math.min(10, session.currentDifficulty + 1)
  } else if (avgScore <= 4) {
    session.currentDifficulty = Math.max(1, session.currentDifficulty - 1)
  }

  const evaluation: TurnEvaluation = {
    score: avgScore,
    categories: {
      technical_depth: feedback.technical_depth,
      communication: feedback.communication,
      problem_solving: feedback.problem_solving,
      relevance: feedback.relevance,
    },
    reasoning: `Score: ${avgScore}`,
    strengths: [],
    weaknesses: [],
    should_probe_deeper: avgScore < 6,
    new_difficulty: session.currentDifficulty,
  }

  return evaluation
}

export async function getNextQuestion(session: InterviewSession): Promise<{ id: string; text: string }> {
  const diffRange = 2

  // Tier 1: Filter from cached questions within difficulty range
  const availableQuestions = session.cachedAllQuestions.filter(
    (q) =>
      q.difficulty >= Math.max(1, session.currentDifficulty - diffRange) &&
      q.difficulty <= Math.min(10, session.currentDifficulty + diffRange)
  )

  const unaskedQuestions = availableQuestions.filter((q) => !session.questions.some((sq) => sq.id === q.id))

  let selected
  if (unaskedQuestions.length > 0) {
    selected = unaskedQuestions[Math.floor(Math.random() * unaskedQuestions.length)]
  } else if (availableQuestions.length > 0) {
    // Tier 2: Fallback to any unasked question (expand search beyond difficulty range)
    const anyUnasked = session.cachedAllQuestions.filter((q) => !session.questions.some((sq) => sq.id === q.id))
    if (anyUnasked.length > 0) {
      selected = anyUnasked[Math.floor(Math.random() * anyUnasked.length)]
    } else {
      // Tier 3: Ultimate fallback - recycle first question from all questions
      selected = session.cachedAllQuestions[0]
    }
  } else {
    // Tier 3: No available questions in range, recycle first
    selected = session.cachedAllQuestions[0]
  }

  // Track this question as asked (deduplication)
  session.questions.push({ id: selected.id, text: selected.questionText, difficulty: selected.difficulty })

  return { id: selected.id, text: selected.questionText }
}

export async function endInterview(session: InterviewSession): Promise<void> {
  session.dbStatus = "completed"
  session.state.ended = true
  await session.persistFinal()
}
