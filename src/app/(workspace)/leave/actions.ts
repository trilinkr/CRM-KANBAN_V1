"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { leaveOverrides, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { audit, db } from "@/lib/domain";

const overrideInput = z.object({ userId: z.string().uuid(), leaveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), status: z.enum(["LEAVE", "PRESENT"]), reason: z.string().trim().max(500) });

export async function saveLeaveOverride(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = overrideInput.safeParse({ userId: formData.get("userId"), leaveDate: formData.get("leaveDate"), status: formData.get("status"), reason: formData.get("reason") ?? "" });
  if (!parsed.success) throw new Error("Invalid leave override");
  const target = (await db.select({ id: users.id }).from(users).where(and(eq(users.id, parsed.data.userId), eq(users.active, true))).limit(1))[0];
  if (!target) throw new Error("Active team member not found");
  await db.insert(leaveOverrides).values({ userId: target.id, leaveDate: parsed.data.leaveDate, status: parsed.data.status, reason: parsed.data.reason || null, createdByUserId: admin.id }).onConflictDoUpdate({ target: [leaveOverrides.userId, leaveOverrides.leaveDate], set: { status: parsed.data.status, reason: parsed.data.reason || null, createdByUserId: admin.id, updatedAt: new Date() } });
  await audit(admin.id, "LEAVE_OVERRIDE_SAVED", "LEAVE_OVERRIDE", target.id, { leaveDate: parsed.data.leaveDate, status: parsed.data.status, reason: parsed.data.reason || null });
  revalidatePath("/leave");
  revalidatePath("/attendance");
}
