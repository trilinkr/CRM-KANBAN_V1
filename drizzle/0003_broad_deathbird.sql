CREATE TYPE "public"."leave_status" AS ENUM('LEAVE', 'PRESENT');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leave_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"leave_date" date NOT NULL,
	"status" "leave_status" NOT NULL,
	"reason" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leave_overrides" ADD CONSTRAINT "leave_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leave_overrides" ADD CONSTRAINT "leave_overrides_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "leave_override_user_date_idx" ON "leave_overrides" USING btree ("user_id","leave_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "leave_override_date_idx" ON "leave_overrides" USING btree ("leave_date");