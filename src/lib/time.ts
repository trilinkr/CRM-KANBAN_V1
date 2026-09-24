import { getEnv } from "./env";

type DateParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

export function getOrgTimezone() { return getEnv().ORG_TIMEZONE; }

function getDateParts(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)])) as unknown as DateParts;
}

export function getOrgDateKey(date: Date, timeZone = getOrgTimezone()) { const parts = getDateParts(date, timeZone); return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`; }
export function getOrgCalendarParts(date = new Date(), timeZone = getOrgTimezone()) { return getDateParts(date, timeZone); }
export function getOrgMonthKeys(now = new Date(), timeZone = getOrgTimezone()) { const current = getDateParts(now, timeZone); const keys: string[] = []; const daysInMonth = new Date(Date.UTC(current.year, current.month, 0)).getUTCDate(); for (let day = 1; day <= daysInMonth; day += 1) keys.push(`${current.year}-${String(current.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`); return keys; }
export function isScheduledWorkday(dateKey: string) { const [year, month, day] = dateKey.split("-").map(Number); const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); if (weekday === 0) return false; if (weekday !== 6) return true; const saturdayNumber = Math.ceil(day / 7); return saturdayNumber === 2 || saturdayNumber === 4; }

function zonedPartsToUtc(parts: DateParts, timeZone: string) {
  const wallClock = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const observed = getDateParts(new Date(wallClock), timeZone);
  const offset = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, observed.second) - wallClock;
  return new Date(wallClock - offset);
}

export function getOrgDayRange(now = new Date(), timeZone = getOrgTimezone()) {
  const current = getDateParts(now, timeZone);
  const start = zonedPartsToUtc({ ...current, hour: 0, minute: 0, second: 0 }, timeZone);
  const nextDay = new Date(Date.UTC(current.year, current.month - 1, current.day + 1));
  const next = getDateParts(nextDay, "UTC");
  const end = zonedPartsToUtc({ ...next, hour: 0, minute: 0, second: 0 }, timeZone);
  return { start, end };
}

export function getOrgMonthRange(now = new Date(), timeZone = getOrgTimezone()) {
  const current = getDateParts(now, timeZone);
  const start = zonedPartsToUtc({ year: current.year, month: current.month, day: 1, hour: 0, minute: 0, second: 0 }, timeZone);
  const nextMonth = new Date(Date.UTC(current.year, current.month, 1));
  const next = getDateParts(nextMonth, "UTC");
  const end = zonedPartsToUtc({ year: next.year, month: next.month, day: next.day, hour: 0, minute: 0, second: 0 }, timeZone);
  return { start, end };
}

export function formatOrgTime(date: Date, timeZone = getOrgTimezone()) { return new Intl.DateTimeFormat("en-IN", { timeZone, hour: "2-digit", minute: "2-digit", hour12: true }).format(date); }
export function formatOrgDate(date: Date, timeZone = getOrgTimezone()) { return new Intl.DateTimeFormat("en-IN", { timeZone, day: "2-digit", month: "2-digit", year: "numeric" }).format(date); }
export function formatOrgDateTime(date: Date, timeZone = getOrgTimezone()) { return new Intl.DateTimeFormat("en-IN", { timeZone, dateStyle: "medium", timeStyle: "short" }).format(date); }
export function formatOrgMonth(date = new Date(), timeZone = getOrgTimezone()) { return new Intl.DateTimeFormat("en-IN", { timeZone, month: "long", year: "numeric" }).format(date); }

export function formatOrgDateTimeLocal(date: Date, timeZone = getOrgTimezone()) {
  const parts = getDateParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function parseOrgDateTimeLocal(value: string, timeZone = getOrgTimezone()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const parsed = zonedPartsToUtc({ year: Number(year), month: Number(month), day: Number(day), hour: Number(hour), minute: Number(minute), second: 0 }, timeZone);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
