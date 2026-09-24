"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { activity, audit, db, taskComments, tasks } from "@/lib/domain";
export async function addComment(formData: FormData) { const user = await requireUser(); const taskId = String(formData.get("taskId")); const body = String(formData.get("body") ?? "").trim(); if (!body || body.length > 5000) throw new Error("Comment is required"); const task = (await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1))[0]; if (!task || (task.assignedToUserId !== user.id && task.createdByUserId !== user.id)) throw new Error("Forbidden"); await db.insert(taskComments).values({ taskId, userId: user.id, body }); await activity(taskId, user.id, "COMMENT_ADDED"); await audit(user.id, "TASK_COMMENT_ADDED", "TASK", taskId); revalidatePath(`/tasks/${taskId}`); }
