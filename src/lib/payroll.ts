import { and, eq, gte, lte, lt } from "drizzle-orm";
import { attendanceSessions, leaveOverrides } from "@/db/schema";
import { db } from "./db";
import { getFixedHoliday } from "./holidays";
import { getOrgDateKey, getOrgMonthKeysForMonth, getOrgMonthRangeForMonth, isScheduledWorkday } from "./time";

export function isPayrollMonth(month: string) { return /^(\d{4})-(0[1-9]|1[0-2])$/.test(month); }

export async function calculatePayroll(userId: string, month: string) {
  if (!isPayrollMonth(month)) throw new Error("Invalid payroll month");
  const keys = getOrgMonthKeysForMonth(month);
  const range = getOrgMonthRangeForMonth(month);
  if (!range || !keys.length) throw new Error("Invalid payroll month");
  const [sessions, overrides] = await Promise.all([
    db.select({ checkInAt: attendanceSessions.checkInAt }).from(attendanceSessions).where(and(eq(attendanceSessions.userId, userId), gte(attendanceSessions.checkInAt, range.start), lt(attendanceSessions.checkInAt, range.end))),
    db.select({ leaveDate: leaveOverrides.leaveDate, status: leaveOverrides.status }).from(leaveOverrides).where(and(eq(leaveOverrides.userId, userId), gte(leaveOverrides.leaveDate, keys[0]), lte(leaveOverrides.leaveDate, keys[keys.length - 1]))),
  ]);
  const presentDates = new Set(sessions.map((session) => getOrgDateKey(session.checkInAt)));
  const overrideByDate = new Map(overrides.map((override) => [override.leaveDate, override.status]));
  const scheduledKeys = keys.filter(isScheduledWorkday);
  const presentDays = scheduledKeys.filter((dateKey) => presentDates.has(dateKey) || overrideByDate.get(dateKey) === "PRESENT" || Boolean(getFixedHoliday(dateKey))).length;
  return { totalDays: keys.length, workingDays: scheduledKeys.length, presentDays };
}
