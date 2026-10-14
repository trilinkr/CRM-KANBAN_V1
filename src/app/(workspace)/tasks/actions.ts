"use server";
import { and, eq, inArray, isNotNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { taskArchives, tasks } from "@/db/schema";
import { audit } from "@/lib/domain";
export async function archiveTasks(_state: { ok: boolean; message: string }, form: FormData) {
  const user = await requireUser();
  const parsed = z.array(z.string().uuid()).min(1).max(500).safeParse(form.getAll("taskIds"));
  if (!parsed.success) return { ok: false, message: "Select at least one completed task (up to 500)." };
  const ids = [...new Set(parsed.data)];
  const restore = form.get("restore") === "true";
  const result = await db.transaction(async (tx) => {
    const eligible = await tx.select({ id: tasks.id }).from(tasks).where(and(inArray(tasks.id, ids), or(eq(tasks.createdByUserId, user.id), eq(tasks.assignedToUserId, user.id)), restore ? undefined : isNotNull(tasks.completedAt))).for("update");
    if (eligible.length !== ids.length) return false;
    if (restore) await tx.delete(taskArchives).where(and(eq(taskArchives.userId, user.id), inArray(taskArchives.taskId, ids)));
    else await tx.insert(taskArchives).values(ids.map((taskId) => ({ taskId, userId: user.id }))).onConflictDoNothing();
    return true;
  });
  if (!result) return { ok: false, message: "Only your completed tasks can be archived. Refresh and check your selection." };
  await audit(user.id, restore ? "TASKS_RESTORED" : "TASKS_ARCHIVED", "TASK", null, { taskIds: ids });
  revalidatePath("/tasks");
  return { ok: true, message: ids.length + (restore ? " task(s) restored." : " task(s) archived.") };
}
