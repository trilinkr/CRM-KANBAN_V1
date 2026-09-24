import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "./schema";
import { getEnv } from "@/lib/env";
import { hashPassword } from "@/lib/auth";

async function main() {
  try {
    const env = getEnv();
    const email = env.ADMIN_EMAIL.toLowerCase();
    const existing = (await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1))[0];
    if (!existing) {
      const name = email.split("@")[0].split(/[._-]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
      await db.insert(users).values({ name, email, passwordHash: await hashPassword(env.ADMIN_TEMP_PASSWORD), role: "ADMIN", forcePasswordChange: true });
      console.log(`Created bootstrap administrator: ${email}`);
    } else {
      console.log(`Administrator already exists: ${email}`);
    }
  } finally {
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Database seed failed");
  process.exit(1);
});
