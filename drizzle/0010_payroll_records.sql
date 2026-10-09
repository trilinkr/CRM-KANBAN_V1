CREATE TABLE IF NOT EXISTS "payroll_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "payroll_month" text NOT NULL,
  "monthly_salary" integer NOT NULL,
  "total_days" integer NOT NULL,
  "working_days" integer NOT NULL,
  "present_days" integer NOT NULL,
  "attendance_salary" integer NOT NULL,
  "arrears" integer DEFAULT 0 NOT NULL,
  "total_salary_paid" integer NOT NULL,
  "paid_at" timestamp with time zone DEFAULT now() NOT NULL,
  "paid_by_user_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_paid_by_user_id_users_id_fk" FOREIGN KEY ("paid_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payroll_user_month_idx" ON "payroll_records" USING btree ("user_id", "payroll_month");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payroll_month_idx" ON "payroll_records" USING btree ("payroll_month");
