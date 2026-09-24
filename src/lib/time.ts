import { getEnv } from "./env";

type DateParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

export function getOrgTimezone() { return getEnv().ORG_TIMEZONE; }

function getDateParts(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)])) as unknown as DateParts;
}

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

export function formatOrgTime(date: Date, timeZone = getOrgTimezone()) { return new Intl.DateTimeFormat("en-IN", { timeZone, hour: "2-digit", minute: "2-digit", hour12: true }).format(date); }
export function formatOrgDate(date: Date, timeZone = getOrgTimezone()) { return new Intl.DateTimeFormat("en-IN", { timeZone, day: "2-digit", month: "2-digit", year: "numeric" }).format(date); }
export function formatOrgDateTime(date: Date, timeZone = getOrgTimezone()) { return new Intl.DateTimeFormat("en-IN", { timeZone, dateStyle: "medium", timeStyle: "short" }).format(date); }

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
