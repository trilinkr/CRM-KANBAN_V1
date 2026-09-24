import { and, asc, desc, eq, gte, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "./db";
import { auditLogs, attendanceSessions, kanbanBoards, kanbanColumns, notifications, taskActivities, taskComments, tasks, users } from "@/db/schema";
import { alias } from "drizzle-orm/pg-core";

export async function getOrCreateBoard(userId: string) {
  const existing = (await db.select().from(kanbanBoards).where(eq(kanbanBoards.ownerUserId, userId)).limit(1))[0];
  if (existing) return existing;
  const board = (await db.insert(kanbanBoards).values({ ownerUserId: userId, name: "My Board" }).returning())[0];
  await db.insert(kanbanColumns).values(["To Do", "In Progress", "Waiting", "Done"].map((title, position) => ({ boardId: board.id, title, position })));
  return board;
}

export async function getBoard(userId: string) { const board = await getOrCreateBoard(userId); const columns = await db.select().from(kanbanColumns).where(eq(kanbanColumns.boardId, board.id)).orderBy(asc(kanbanColumns.position)); const boardTasks = await db.select({ task: tasks, assignee: users }).from(tasks).innerJoin(users, eq(tasks.assignedToUserId, users.id)).where(eq(tasks.boardId, board.id)).orderBy(asc(tasks.position)); return { board, columns, tasks: boardTasks }; }
export async function audit(actorUserId: string | null, action: string, entityType: string, entityId: string | null, metadata?: Record<string, unknown>) { await db.insert(auditLogs).values({ actorUserId, action, entityType, entityId, metadata }); }
export async function notify(recipientUserId: string, type: string, title: string, message: string, relatedTaskId?: string) { await db.insert(notifications).values({ recipientUserId, type, title, message, relatedTaskId }); }
export async function activity(taskId: string, actorUserId: string, action: string, metadata?: Record<string, unknown>) { await db.insert(taskActivities).values({ taskId, actorUserId, action, metadata }); }
export async function getUnreadCount(userId: string) { const row = (await db.select({ count: sql<number>`count(*)` }).from(notifications).where(and(eq(notifications.recipientUserId, userId), isNull(notifications.readAt))))[0]; return Number(row?.count ?? 0); }
export async function getTodayAttendance(userId: string) { const start = new Date(); start.setUTCHours(0, 0, 0, 0); const end = new Date(start); end.setUTCDate(end.getUTCDate() + 1); return db.select().from(attendanceSessions).where(and(eq(attendanceSessions.userId, userId), lt(attendanceSessions.checkInAt, end), or(isNull(attendanceSessions.checkOutAt), gte(attendanceSessions.checkOutAt, start)))).orderBy(desc(attendanceSessions.checkInAt)); }
export async function getTask(taskId: string) { const creator = alias(users, "creator"); const assignee = alias(users, "assignee"); return (await db.select({ task: tasks, creator, assignee }).from(tasks).innerJoin(creator, eq(tasks.createdByUserId, creator.id)).innerJoin(assignee, eq(tasks.assignedToUserId, assignee.id)).where(eq(tasks.id, taskId)).limit(1))[0]; }
export { db, users, tasks, notifications, attendanceSessions, taskComments, taskActivities, kanbanColumns, kanbanBoards, auditLogs };
