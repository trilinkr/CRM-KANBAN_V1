"use server";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { audit, db, attendanceSessions, notify } from "@/lib/domain";

export async function checkIn() { const user = await requireUser(); const open = (await db.select().from(attendanceSessions).where(and(eq(attendanceSessions.userId, user.id), isNull(attendanceSessions.checkOutAt))).limit(1))[0]; if (open) throw new Error("You are already checked in."); const session = (await db.insert(attendanceSessions).values({ userId: user.id, checkInAt: new Date() }).returning())[0]; await audit(user.id, "ATTENDANCE_CHECKED_IN", "ATTENDANCE_SESSION", session.id); await notify(user.id, "ATTENDANCE_CHECK_IN", "Check-in confirmed", "Your attendance session is now open."); revalidatePath("/attendance"); }
export async function checkOut() { const user = await requireUser(); const open = (await db.select().from(attendanceSessions).where(and(eq(attendanceSessions.userId, user.id), isNull(attendanceSessions.checkOutAt))).limit(1))[0]; if (!open) throw new Error("You do not have an open attendance session."); const session = (await db.update(attendanceSessions).set({ checkOutAt: new Date(), updatedAt: new Date() }).where(eq(attendanceSessions.id, open.id)).returning())[0]; await audit(user.id, "ATTENDANCE_CHECKED_OUT", "ATTENDANCE_SESSION", session.id); await notify(user.id, "ATTENDANCE_CHECK_OUT", "Check-out confirmed", "Your attendance session has been closed."); revalidatePath("/attendance"); }
