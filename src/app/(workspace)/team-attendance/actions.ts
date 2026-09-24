"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { audit, db, attendanceSessions } from "@/lib/domain";
import { parseOrgDateTimeLocal } from "@/lib/time";

const correction = z.object({ sessionId: z.string().uuid(), checkInAt: z.string().min(1), checkOutAt: z.string().nullable(), reason: z.string().trim().min(3).max(500) });

export async function correctAttendance(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = correction.safeParse({ sessionId: formData.get("sessionId"), checkInAt: formData.get("checkInAt"), checkOutAt: formData.get("checkOutAt") || null, reason: formData.get("reason") });
  if (!parsed.success) throw new Error("Invalid attendance correction");
  const checkInAt = parseOrgDateTimeLocal(parsed.data.checkInAt);
  const checkOutAt = parsed.data.checkOutAt ? parseOrgDateTimeLocal(parsed.data.checkOutAt) : null;
  if (!checkInAt || (parsed.data.checkOutAt && !checkOutAt)) throw new Error("Invalid attendance time");
  const original = (await db.select().from(attendanceSessions).where(eq(attendanceSessions.id, parsed.data.sessionId)).limit(1))[0];
  if (!original) throw new Error("Attendance session not found");
  if (checkOutAt && checkOutAt <= checkInAt) throw new Error("Check-out must be after check-in");
  const updated = (await db.update(attendanceSessions).set({ checkInAt, checkOutAt, correctedByUserId: admin.id, correctionReason: parsed.data.reason, updatedAt: new Date() }).where(and(eq(attendanceSessions.id, original.id), eq(attendanceSessions.userId, original.userId))).returning())[0];
  await audit(admin.id, "ATTENDANCE_CORRECTED", "ATTENDANCE_SESSION", updated.id, { employeeId: original.userId, original: { checkInAt: original.checkInAt.toISOString(), checkOutAt: original.checkOutAt?.toISOString() ?? null }, corrected: { checkInAt: updated.checkInAt.toISOString(), checkOutAt: updated.checkOutAt?.toISOString() ?? null }, reason: parsed.data.reason });
  revalidatePath("/team-attendance");
  revalidatePath(`/team-attendance/${original.userId}`);
}
