import { Anthropic } from "@anthropic-ai/sdk";
import { db } from "@hiremind/db";
import { questions, jobRoles } from "@hiremind/db/schema";

const client = new Anthropic();

interface GeneratedQuestion {
  text: string;
  sampleAnswer: string;
  difficulty: number;
  topics: string[];
}

const JOB_ROLES = [
  {
    slug: "backend-engineer",
    title: "Backend Engineer",
    competencies: ["databases", "apis", "architecture", "system-design"],
  },
  {
    slug: "frontend-engineer",
    title: "Frontend Engineer",
    competencies: ["react", "css", "performance", "accessibility"],
  },
  {
    slug: "ml-engineer",
    title: "ML Engineer",
    competencies: ["ml-basics", "models", "data", "optimization"],
  },
  {
    slug: "product-manager",
    title: "Product Manager",
    competencies: ["strategy", "metrics", "user-research", "communication"],
  },
  {
    slug: "data-analyst",
    title: "Data Analyst",
    competencies: ["sql", "analytics", "visualization", "statistics"],
  },
  {
    slug: "business-consultant",
    title: "Business Consultant",
    competencies: ["problem-solving", "analysis", "communication", "strategy"],
  },
  {
    slug: "marketing-manager",
    title: "Marketing Manager",
    competencies: ["strategy", "analytics", "communication", "creativity"],
  },
];

const INTERVIEW_TYPES = [
  "technical",
  "behavioral",
  "system_design",
  "case",
];

const DIFFICULTIES = [1, 2, 3]; // junior, mid, senior mapped to 1-3 for easier generation

async function generateQuestions(
  role: string,
  interviewType: string,
  difficulty: number,
  count: number
): Promise<GeneratedQuestion[]> {
  const difficultyLabel = {
    1: "junior level",
    2: "mid-level",
    3: "senior level",
  }[difficulty] || "mid-level";

  const prompt = `Generate ${count} unique ${interviewType} interview questions for a ${role} position at ${difficultyLabel}.

Each question should be realistic, thoughtful, and designed to assess actual competencies.

Format your response as a JSON array where each object has:
{
  "text": "the question to ask",
  "sampleAnswer": "an example good answer (2-3 sentences)",
  "topics": ["topic1", "topic2"] (2-3 relevant topics)
}

Important:
- Make questions specific and scenario-based when possible
- For technical: ask about concrete scenarios or design challenges
- For behavioral: ask about past experiences and decision-making
- For system design: ask about building real systems at scale
- For case: ask realistic business problem-solving scenarios
- Return only valid JSON, no markdown formatting`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  try {
    return JSON.parse(content.text);
  } catch (e) {
    console.error(`Failed to parse response for ${role} ${interviewType}:`, content.text);
    return [];
  }
}

async function seed() {
  try {
    console.log("🌱 Seeding HireMind question bank...\n");

    // Get or create job roles
    const existingRoles = await db.select().from(jobRoles);
    console.log(`Found ${existingRoles.length} existing job roles\n`);

    let roleIds: Record<string, string> = {};

    for (const role of JOB_ROLES) {
      const existing = existingRoles.find((r) => r.slug === role.slug);
      if (existing) {
        roleIds[role.slug] = existing.id;
      }
    }

    console.log(`Using ${Object.keys(roleIds).length} job roles\n`);

    let totalCreated = 0;

    // Generate questions for each role/type/difficulty combination
    for (const role of JOB_ROLES) {
      if (!roleIds[role.slug]) {
        console.log(`⚠️  Skipping ${role.title} (no role ID)`);
        continue;
      }

      console.log(`\n📚 Generating questions for ${role.title}...`);

      for (const interviewType of INTERVIEW_TYPES) {
        for (const difficulty of DIFFICULTIES) {
          const difficultyLabel = {
            1: "junior",
            2: "mid",
            3: "senior",
          }[difficulty];

          process.stdout.write(
            `  ${interviewType} (${difficultyLabel}): generating 5 questions...`
          );

          const generated = await generateQuestions(
            role.title,
            interviewType,
            difficulty,
            5
          );

          if (generated.length === 0) {
            console.log(" ✗ failed");
            continue;
          }

          // Insert into database
          const questionRecords = generated.map((q) => ({
            jobRoleId: roleIds[role.slug],
            interviewType: interviewType as any,
            questionText: q.text,
            sampleAnswer: q.sampleAnswer,
            difficulty: (difficulty - 1) * 3 + 5, // Scale 1-3 to 4-10 range
            topics: q.topics,
            tags: [interviewType, difficultyLabel],
          }));

          await db.insert(questions).values(questionRecords);

          totalCreated += generated.length;
          console.log(` ✓ ${generated.length} created`);
        }
      }
    }

    console.log(
      `\n✅ Seeding complete! Created ${totalCreated} questions total\n`
    );
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
