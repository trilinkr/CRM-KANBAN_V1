CREATE TABLE "task_archives" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "task_id" uuid NOT NULL REFERENCES "tasks"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "task_archives_user_task_idx" ON "task_archives" ("user_id", "task_id");
CREATE INDEX "task_archives_task_idx" ON "task_archives" ("task_id");
