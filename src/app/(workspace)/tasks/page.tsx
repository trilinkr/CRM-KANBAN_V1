import { and, asc, eq, isNull, isNotNull, or } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, tasks, users } from "@/lib/domain";
import { taskArchives } from "@/db/schema";
import { formatOrgDate } from "@/lib/time";
import { TaskArchiveList } from "@/components/task-archive-list";
export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requireUser();
  const archived = (await searchParams).view === "archive";
  const rows = await db.select({ task: tasks, assignee: users }).from(tasks).innerJoin(users, eq(tasks.assignedToUserId, users.id)).leftJoin(taskArchives, and(eq(taskArchives.taskId, tasks.id), eq(taskArchives.userId, user.id))).where(and(or(eq(tasks.createdByUserId, user.id), eq(tasks.assignedToUserId, user.id)), archived ? isNotNull(taskArchives.id) : isNull(taskArchives.id))).orderBy(asc(tasks.completedAt), asc(tasks.dueDate));
  return <div className="space-y-6"><div><p className="text-sm text-brand">Work tracking</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{archived ? "Archived Tasks" : "My Tasks"}</h1><p className="mt-2 text-muted">Tasks you created or that are assigned to you.</p></div><TaskArchiveList archived={archived} rows={rows.map(({ task, assignee }) => ({ id: task.id, title: task.title, assignee: assignee.name, priority: task.priority, completed: Boolean(task.completedAt), due: task.dueDate ? formatOrgDate(task.dueDate) : "—" }))} /></div>;
}
