"use server";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db, notifications } from "@/lib/domain";
export async function markRead(formData: FormData) { const user = await requireUser(); await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, String(formData.get("id"))), eq(notifications.recipientUserId, user.id))); revalidatePath("/notifications"); }
export async function markAllRead() { const user = await requireUser(); await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.recipientUserId, user.id), isNull(notifications.readAt))); revalidatePath("/notifications"); }
