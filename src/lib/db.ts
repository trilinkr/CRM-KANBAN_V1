import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { getEnv } from "./env";
import * as schema from "@/db/schema";

const client = postgres(getEnv().DATABASE_URL, { prepare: false, max: 1 });
export const db = drizzle(client, { schema });
