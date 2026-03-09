CREATE TYPE "public"."conversation_role" AS ENUM('interviewer', 'candidate');--> statement-breakpoint
CREATE TYPE "public"."hire_recommendation" AS ENUM('strong_yes', 'yes', 'maybe', 'no');--> statement-breakpoint
CREATE TYPE "public"."interview_level" AS ENUM('junior', 'mid', 'senior');--> statement-breakpoint
CREATE TYPE "public"."interview_mode" AS ENUM('voice', 'text', 'coding');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('setup', 'in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."interview_type" AS ENUM('technical', 'behavioral', 'system_design', 'case');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidate_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"resume_text" text,
	"target_roles" text[],
	"experience_level" "interview_level",
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "conversation_turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"turn_number" integer NOT NULL,
	"role" "conversation_role" NOT NULL,
	"content" text NOT NULL,
	"audio_r2_key" text,
	"audio_duration_ms" integer,
	"evaluation" json,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"overall_score" numeric(4, 2),
	"scores" json,
	"strengths" text[],
	"weaknesses" text[],
	"suggestions" text[],
	"detailed_feedback" text,
	"hire_recommendation" "hire_recommendation",
	"generated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "evaluations_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "interview_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_role_id" uuid NOT NULL,
	"interview_type" "interview_type" NOT NULL,
	"level" "interview_level" NOT NULL,
	"mode" "interview_mode" DEFAULT 'voice',
	"status" "interview_status" DEFAULT 'setup',
	"current_difficulty" integer DEFAULT 5,
	"topics_state" json,
	"summary_context" text,
	"questions_asked" text[] DEFAULT '{}'::text[],
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"duration_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"competencies" json,
	"rubric" json,
	CONSTRAINT "job_roles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_role_id" uuid NOT NULL,
	"interview_type" "interview_type" NOT NULL,
	"question_text" text NOT NULL,
	"sample_answer" text,
	"difficulty" integer NOT NULL,
	"topics" text[] NOT NULL,
	"tags" text[]
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"password_hash" text NOT NULL,
	"refresh_token" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversation_turns" ADD CONSTRAINT "conversation_turns_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_job_role_id_job_roles_id_fk" FOREIGN KEY ("job_role_id") REFERENCES "public"."job_roles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_job_role_id_job_roles_id_fk" FOREIGN KEY ("job_role_id") REFERENCES "public"."job_roles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_candidate_user_id" ON "candidate_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_turns_session_turn" ON "conversation_turns" USING btree ("session_id","turn_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_turns_created" ON "conversation_turns" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_evaluations_session_id" ON "evaluations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sessions_user_id" ON "interview_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sessions_status_created" ON "interview_sessions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sessions_created_desc" ON "interview_sessions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_questions_role_type" ON "questions" USING btree ("job_role_id","interview_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_questions_difficulty" ON "questions" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" USING btree ("email");