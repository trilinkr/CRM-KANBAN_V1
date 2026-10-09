"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { leaveOverrides, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { audit, db } from "@/lib/domain";

const overrideInput = z.object({ userId: z.string().uuid(), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), status: z.enum(["LEAVE", "PRESENT"]), reason: z.string().trim().max(500) });

function getDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start.toISOString().slice(0, 10) !== startDate || end.toISOString().slice(0, 10) !== endDate || end < start) return null;
  const days: string[] = [];
  for (const current = new Date(start); current <= end; current.setUTCDate(current.getUTCDate() + 1)) {
    days.push(current.toISOString().slice(0, 10));
    if (days.length > 31) return null;
  }
  return days;
}

export async function saveLeaveOverride(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = overrideInput.safeParse({ userId: formData.get("userId"), startDate: formData.get("startDate"), endDate: formData.get("endDate"), status: formData.get("status"), reason: formData.get("reason") ?? "" });
  if (!parsed.success) throw new Error("Invalid leave override");
  const dates = getDateRange(parsed.data.startDate, parsed.data.endDate);
  if (!dates) throw new Error("Choose a valid date range of up to 31 days");
  const target = (await db.select({ id: users.id }).from(users).where(and(eq(users.id, parsed.data.userId), eq(users.active, true))).limit(1))[0];
  if (!target) throw new Error("Active team member not found");
  await db.transaction(async (tx) => {
    for (const leaveDate of dates) {
      await tx.insert(leaveOverrides).values({ userId: target.id, leaveDate, status: parsed.data.status, reason: parsed.data.reason || null, createdByUserId: admin.id }).onConflictDoUpdate({ target: [leaveOverrides.userId, leaveOverrides.leaveDate], set: { status: parsed.data.status, reason: parsed.data.reason || null, createdByUserId: admin.id, updatedAt: new Date() } });
    }
  });
  await audit(admin.id, "LEAVE_OVERRIDE_SAVED", "LEAVE_OVERRIDE", target.id, { startDate: parsed.data.startDate, endDate: parsed.data.endDate, days: dates.length, status: parsed.data.status, reason: parsed.data.reason || null });
  revalidatePath("/leave");
  revalidatePath("/attendance");
}
