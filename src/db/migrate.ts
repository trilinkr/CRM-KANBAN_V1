import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "@/lib/db";

async function main() {
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
  } finally {
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Database migration failed");
  process.exit(1);
});
