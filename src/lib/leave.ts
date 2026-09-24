import { and, eq, gte, lte, lt } from "drizzle-orm";
import { attendanceSessions, leaveOverrides } from "@/db/schema";
import { db } from "./db";
import { getOrgDateKey, getOrgMonthKeys, getOrgMonthRange, isScheduledWorkday } from "./time";

export type LeaveDayStatus = "PRESENT" | "LEAVE" | "PENDING" | "OFF";
export type LeaveDay = { dateKey: string; status: LeaveDayStatus; overridden: boolean };

export async function getLeaveCalendar(userId: string, now = new Date()) {
  const keys = getOrgMonthKeys(now);
  const currentKey = getOrgDateKey(now);
  const { start, end } = getOrgMonthRange(now);
  const [sessions, overrides] = await Promise.all([
    db.select({ checkInAt: attendanceSessions.checkInAt }).from(attendanceSessions).where(and(eq(attendanceSessions.userId, userId), gte(attendanceSessions.checkInAt, start), lt(attendanceSessions.checkInAt, end))),
    db.select().from(leaveOverrides).where(and(eq(leaveOverrides.userId, userId), gte(leaveOverrides.leaveDate, keys[0]), lte(leaveOverrides.leaveDate, keys[keys.length - 1]))),
  ]);
  const presentDays = new Set(sessions.map((session) => getOrgDateKey(session.checkInAt)));
  const overrideByDate = new Map(overrides.map((override) => [override.leaveDate, override]));
  const days: LeaveDay[] = keys.map((dateKey) => {
    if (!isScheduledWorkday(dateKey)) return { dateKey, status: "OFF", overridden: false };
    const override = overrideByDate.get(dateKey);
    if (override) return { dateKey, status: override.status, overridden: true };
    if (presentDays.has(dateKey)) return { dateKey, status: "PRESENT", overridden: false };
    return { dateKey, status: dateKey < currentKey ? "LEAVE" : "PENDING", overridden: false };
  });
  return { days, leaveDays: days.filter((day) => day.status === "LEAVE").length, presentDays: days.filter((day) => day.status === "PRESENT").length, pendingDays: days.filter((day) => day.status === "PENDING").length };
}
