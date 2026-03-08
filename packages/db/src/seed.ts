import { db } from "./index"
import { users, jobRoles, questions } from "./schema"

async function seed() {
  console.log("🌱 Starting database seed...")

  // Create test user
  const testUser = await db
    .insert(users)
    .values({
      clerkId: "test-user-123",
      email: "test@hiremind.dev",
      name: "Test User",
    })
    .returning()
    .catch(() => null)

  console.log("✓ Test user created")

  // Get existing roles
  const allRoles = await db.select().from(jobRoles)

  if (allRoles.length === 0) {
    console.log("No roles found. Backend should have seeded them. Skipping...")
  }

  // Seed questions for each role
  const rolesWithQuestions = [
    {
      slug: "backend-engineer",
      questions: [
        {
          type: "technical",
          text: "Design a URL shortening service like bit.ly. How would you handle scale?",
          difficulty: 7,
          answer: "Use a distributed hash table, database sharding, and caching layer",
        },
        {
          type: "technical",
          text: "Explain how you would implement a distributed cache.",
          difficulty: 8,
          answer: "Redis cluster with consistent hashing and replication",
        },
        {
          type: "technical",
          text: "What are the trade-offs between SQL and NoSQL databases?",
          difficulty: 6,
          answer: "SQL: ACID, joins, schema. NoSQL: horizontal scale, flexible schema",
        },
        {
          type: "system_design",
          text: "Design a real-time notification system for 1M users.",
          difficulty: 9,
          answer: "WebSockets, message queue, database, caching, load balancing",
        },
        {
          type: "behavioral",
          text: "Tell me about a time you had to debug a production issue.",
          difficulty: 5,
          answer: "Describe specific situation, your role, and the outcome",
        },
      ],
    },
    {
      slug: "frontend-engineer",
      questions: [
        {
          type: "technical",
          text: "Explain React hooks and why they were introduced.",
          difficulty: 6,
          answer: "Hooks allow stateful logic in functional components without classes",
        },
        {
          type: "technical",
          text: "What's the difference between debouncing and throttling?",
          difficulty: 5,
          answer: "Debounce: wait until idle. Throttle: limit execution frequency",
        },
        {
          type: "technical",
          text: "How would you optimize a slow React app?",
          difficulty: 7,
          answer: "Profiling, memoization, code splitting, lazy loading, virtual lists",
        },
        {
          type: "technical",
          text: "Explain CSS Grid vs Flexbox and when to use each.",
          difficulty: 5,
          answer: "Flexbox: 1D layout. Grid: 2D layout with precise placement",
        },
        {
          type: "behavioral",
          text: "Describe your most challenging frontend project.",
          difficulty: 6,
          answer: "Specific project, technical challenges, and how you solved them",
        },
      ],
    },
    {
      slug: "ml-engineer",
      questions: [
        {
          type: "technical",
          text: "Explain the difference between supervised and unsupervised learning.",
          difficulty: 4,
          answer: "Supervised: labeled data. Unsupervised: no labels, find patterns",
        },
        {
          type: "technical",
          text: "What is overfitting and how do you prevent it?",
          difficulty: 6,
          answer: "Model learns noise. Prevent with: regularization, cross-validation, early stopping",
        },
        {
          type: "technical",
          text: "How would you handle imbalanced datasets?",
          difficulty: 7,
          answer: "Oversampling, undersampling, SMOTE, class weights, different metrics",
        },
        {
          type: "technical",
          text: "Explain gradient descent and its variants.",
          difficulty: 8,
          answer: "SGD, Adam, RMSprop. Trade-offs between convergence speed and stability",
        },
        {
          type: "behavioral",
          text: "Tell me about an ML project where you deployed a model.",
          difficulty: 6,
          answer: "Specific model, metrics, deployment challenges, and lessons learned",
        },
      ],
    },
    {
      slug: "product-manager",
      questions: [
        {
          type: "behavioral",
          text: "Walk me through your product development process.",
          difficulty: 6,
          answer: "Research, ideation, validation, prioritization, metrics, iteration",
        },
        {
          type: "behavioral",
          text: "How do you handle conflicting priorities between engineering and design?",
          difficulty: 7,
          answer: "Listen to both, focus on user value, data-driven decisions",
        },
        {
          type: "technical",
          text: "How would you measure success for a new feature?",
          difficulty: 5,
          answer: "Define KPIs: engagement, retention, conversion, user satisfaction",
        },
        {
          type: "case",
          text: "How would you improve the onboarding experience for a SaaS product?",
          difficulty: 7,
          answer: "User research, funnel analysis, A/B testing, guided tours, feedback",
        },
        {
          type: "behavioral",
          text: "Tell me about a product decision you made that failed.",
          difficulty: 8,
          answer: "Specific decision, why it failed, and what you learned",
        },
      ],
    },
  ]

  let totalQuestionsAdded = 0

  for (const roleData of rolesWithQuestions) {
    const role = allRoles.find((r) => r.slug === roleData.slug)
    if (!role) {
      console.log(`⚠️  Role ${roleData.slug} not found, skipping...`)
      continue
    }

    for (const q of roleData.questions) {
      await db
        .insert(questions)
        .values({
          jobRoleId: role.id,
          interviewType: q.type as any,
          questionText: q.text,
          sampleAnswer: q.answer,
          difficulty: q.difficulty,
          topics: [],
          tags: [],
        })
        .catch((err) => console.error(`Error inserting question: ${err.message}`))

      totalQuestionsAdded++
    }
  }

  console.log(`✓ Added ${totalQuestionsAdded} questions across all roles`)
  console.log("🌱 Seed completed successfully!")
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
