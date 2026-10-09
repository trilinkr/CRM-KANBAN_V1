ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "date_of_birth" date;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "monthly_salary" integer;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "date_of_joining" date;
