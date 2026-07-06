CREATE TYPE "public"."account_class" AS ENUM('asset', 'liability');--> statement-breakpoint
CREATE TYPE "public"."account_type" AS ENUM('cash', 'bank', 'savings', 'investment', 'crypto', 'receivable', 'credit_card', 'loan', 'mortgage', 'lease');--> statement-breakpoint
CREATE TYPE "public"."ai_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."ai_thread_kind" AS ENUM('advisor', 'simulator');--> statement-breakpoint
CREATE TYPE "public"."domain" AS ENUM('personal', 'business');--> statement-breakpoint
CREATE TYPE "public"."event_source" AS ENUM('manual', 'recurring', 'bank', 'import');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('income', 'expense', 'transfer', 'investment', 'dividend', 'invoice', 'invoice_paid', 'subscription', 'smoking', 'goal_contribution', 'balance_adjustment', 'note');--> statement-breakpoint
CREATE TYPE "public"."goal_kind" AS ENUM('apartment', 'emergency_fund', 'investment', 'business_growth', 'quit_smoking', 'custom');--> statement-breakpoint
CREATE TYPE "public"."insight_kind" AS ENUM('insight', 'recommendation', 'warning', 'forecast', 'achievement');--> statement-breakpoint
CREATE TYPE "public"."insight_source" AS ENUM('rule', 'ai');--> statement-breakpoint
CREATE TYPE "public"."ips_kind" AS ENUM('hard_limit', 'principle');--> statement-breakpoint
CREATE TYPE "public"."review_period" AS ENUM('weekly', 'monthly', 'quarterly');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('info', 'warn', 'critical');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"domain" "domain" NOT NULL,
	"name" text NOT NULL,
	"type" "account_type" NOT NULL,
	"account_class" "account_class" NOT NULL,
	"currency" text DEFAULT 'RON' NOT NULL,
	"current_balance" numeric(16, 2) DEFAULT '0' NOT NULL,
	"institution" text,
	"is_liquid" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"role" "ai_role" NOT NULL,
	"content" text NOT NULL,
	"structured" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "ai_thread_kind" NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"group" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discipline_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"captured_on" date NOT NULL,
	"score" integer NOT NULL,
	"components" jsonb,
	"delta" integer DEFAULT 0 NOT NULL,
	"explanation" text
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"domain" "domain" NOT NULL,
	"type" "event_type" NOT NULL,
	"title" text NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"currency" text DEFAULT 'RON' NOT NULL,
	"base_amount" numeric(16, 2) NOT NULL,
	"fx_rate" numeric(16, 8) DEFAULT '1' NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"account_id" uuid,
	"counter_account_id" uuid,
	"category" text,
	"goal_id" uuid,
	"note" text,
	"source" "event_source" DEFAULT 'manual' NOT NULL,
	"recurring_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"base" text NOT NULL,
	"quote" text NOT NULL,
	"rate" numeric(16, 8) NOT NULL,
	"as_of" date NOT NULL,
	CONSTRAINT "fx_rates_base_quote_as_of_pk" PRIMARY KEY("base","quote","as_of")
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "goal_kind" NOT NULL,
	"name" text NOT NULL,
	"target_amount" numeric(16, 2),
	"current_amount" numeric(16, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'RON' NOT NULL,
	"target_date" date,
	"priority" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "insight_kind" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"event_id" uuid,
	"goal_id" uuid,
	"rule_code" text,
	"severity" "severity" DEFAULT 'info' NOT NULL,
	"source" "insight_source" DEFAULT 'ai' NOT NULL,
	"valid_until" timestamp with time zone,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ips_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"statement" text NOT NULL,
	"kind" "ips_kind" NOT NULL,
	"params" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "net_worth_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"captured_on" date NOT NULL,
	"total_base" numeric(16, 2) NOT NULL,
	"personal_base" numeric(16, 2) NOT NULL,
	"business_base" numeric(16, 2) NOT NULL,
	"liquid_base" numeric(16, 2) NOT NULL,
	"breakdown" jsonb
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"base_currency" text DEFAULT 'RON' NOT NULL,
	"timezone" text DEFAULT 'Europe/Bucharest' NOT NULL,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"domain" "domain" NOT NULL,
	"type" "event_type" NOT NULL,
	"title" text NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"currency" text DEFAULT 'RON' NOT NULL,
	"account_id" uuid,
	"cadence" text NOT NULL,
	"next_occurrence" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period" "review_period" NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"summary" jsonb,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_thread_id_ai_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."ai_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_threads" ADD CONSTRAINT "ai_threads_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipline_scores" ADD CONSTRAINT "discipline_scores_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_counter_account_id_accounts_id_fk" FOREIGN KEY ("counter_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_recurring_id_recurring_id_fk" FOREIGN KEY ("recurring_id") REFERENCES "public"."recurring"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ips_rules" ADD CONSTRAINT "ips_rules_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "net_worth_snapshots" ADD CONSTRAINT "net_worth_snapshots_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring" ADD CONSTRAINT "recurring_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring" ADD CONSTRAINT "recurring_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_messages_thread_idx" ON "ai_messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "ai_threads_user_idx" ON "ai_threads" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discipline_user_day_idx" ON "discipline_scores" USING btree ("user_id","captured_on");--> statement-breakpoint
CREATE INDEX "events_user_time_idx" ON "events" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "events_user_domain_idx" ON "events" USING btree ("user_id","domain");--> statement-breakpoint
CREATE INDEX "events_goal_idx" ON "events" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "events_account_idx" ON "events" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "goals_user_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "insights_user_idx" ON "insights" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "insights_event_idx" ON "insights" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ips_user_code_idx" ON "ips_rules" USING btree ("user_id","code");--> statement-breakpoint
CREATE UNIQUE INDEX "nws_user_day_idx" ON "net_worth_snapshots" USING btree ("user_id","captured_on");--> statement-breakpoint
CREATE INDEX "recurring_user_idx" ON "recurring" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_user_idx" ON "reviews" USING btree ("user_id");