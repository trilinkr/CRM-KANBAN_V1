import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leadAccess } from "@/db/schema";

export type LeadType = "EMPLOYER" | "CONSULTANT";

export async function canAccessLeadType(userId: string, role: string, type: LeadType) {
  if (role === "ADMIN") return true;
  return Boolean((await db.select({ id: leadAccess.id }).from(leadAccess).where(and(eq(leadAccess.userId, userId), eq(leadAccess.leadType, type))).limit(1))[0]);
}

export async function getLeadAccessMap() {
  const rows = await db.select({ userId: leadAccess.userId, type: leadAccess.leadType }).from(leadAccess);
  return new Set(rows.map((row) => `${row.userId}:${row.type}`));
}

export async function hasAnyLeadAccess(userId: string, role: string) {
  if (role === "ADMIN") return true;
  return Boolean((await db.select({ id: leadAccess.id }).from(leadAccess).where(eq(leadAccess.userId, userId)).limit(1))[0]);
}
