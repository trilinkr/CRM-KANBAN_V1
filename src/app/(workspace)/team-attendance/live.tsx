import Link from "next/link";
import { and, eq, gt, gte, isNull, lt, or } from "drizzle-orm";
import { ChevronLeft, ChevronRight, Clock3, Download, UsersRound } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { attendanceSessions, db, leaveOverrides, users } from "@/lib/domain";
import { formatDuration, totalDurationWithinRange } from "@/lib/attendance";
import { getOrgDateKey, getOrgDayRange, isScheduledWorkday } from "@/lib/time";
import { Badge, Button } from "@/components/ui";

type Period = "week" | "month";
type GridStatus = "Present" | "Working" | "Leave" | "Off";

function isDateKey(value: string | undefined): value is string { return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value)); }
function keyDate(key: string) { const [year, month, day] = key.split("-").map(Number); return new Date(Date.UTC(year, month - 1, day, 12)); }
function addDays(date: Date, amount: number) { const next = new Date(date); next.setUTCDate(next.getUTCDate() + amount); return next; }
function dateKey(date: Date) { return date.toISOString().slice(0, 10); }
function getKeys(period: Period, anchor: string) {
  const date = keyDate(anchor);
  if (period === "week") {
    const mondayOffset = (date.getUTCDay() + 6) % 7;
    const first = addDays(date, -mondayOffset);
    return Array.from({ length: 7 }, (_, index) => dateKey(addDays(first, index)));
  }
  const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
  const days = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12)).getUTCDate();
  return Array.from({ length: days }, (_, index) => dateKey(addDays(first, index)));
}
function displayDay(key: string) { return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "2-digit" }).format(keyDate(key)); }
function displayRange(keys: string[], period: Period) { if (period === "month") return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(keyDate(keys[0])); return `${displayDay(keys[0])} – ${displayDay(keys.at(-1)!)}`; }
function statusClasses(status: GridStatus) { return { Present: "bg-emerald-50 text-emerald-700", Working: "bg-orange-50 text-brand", Leave: "bg-rose-50 text-rose-700", Off: "bg-slate-100 text-slate-500" }[status]; }

export default async function LiveTeamAttendancePage({ searchParams }: { searchParams: Promise<{ period?: string; date?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const period: Period = params.period === "month" ? "month" : "week";
  const today = getOrgDateKey(new Date());
  const anchor = isDateKey(params.date) ? params.date : today;
  const keys = getKeys(period, anchor);
  const dayRanges = keys.map((key) => ({ key, ...getOrgDayRange(keyDate(key)) }));
  const rangeStart = dayRanges[0].start;
  const rangeEnd = dayRanges.at(-1)!.end;
  const [members, sessions, overrides] = await Promise.all([
    db.select().from(users).where(eq(users.active, true)).orderBy(users.name),
    db.select().from(attendanceSessions).where(and(lt(attendanceSessions.checkInAt, rangeEnd), or(isNull(attendanceSessions.checkOutAt), gt(attendanceSessions.checkOutAt, rangeStart)))),
    db.select().from(leaveOverrides).where(and(gte(leaveOverrides.leaveDate, keys[0]), lt(leaveOverrides.leaveDate, dateKey(addDays(keyDate(keys.at(-1)!), 1))))),
  ]);
  const sessionsByUserDay = new Map<string, typeof sessions>();
  for (const session of sessions) { const key = `${session.userId}:${getOrgDateKey(session.checkInAt)}`; sessionsByUserDay.set(key, [...(sessionsByUserDay.get(key) ?? []), session]); }
  const overrideByUserDay = new Map(overrides.map((override) => [`${override.userId}:${override.leaveDate}`, override]));
  const rows = members.map((member) => {
    const cells = dayRanges.map((day) => {
      const daySessions = sessionsByUserDay.get(`${member.id}:${day.key}`) ?? [];
      const override = overrideByUserDay.get(`${member.id}:${day.key}`);
      const status: GridStatus = !isScheduledWorkday(day.key) ? "Off" : daySessions.length ? daySessions.some((session) => !session.checkOutAt) ? "Working" : "Present" : override?.status === "PRESENT" ? "Present" : "Leave";
      return { ...day, status, sessions: daySessions, duration: totalDurationWithinRange(daySessions, day.start, day.end), reason: override?.reason ?? null };
    });
    return { member, cells, total: cells.reduce((sum, cell) => sum + cell.duration, 0), present: cells.filter((cell) => cell.status === "Present" || cell.status === "Working").length, leave: cells.filter((cell) => cell.status === "Leave").length };
  });
  const previous = dateKey(addDays(keyDate(keys[0]), period === "week" ? -7 : -1));
  const next = dateKey(addDays(keyDate(keys.at(-1)!), 1));
  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-brand">Administration</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Team attendance</h1><p className="mt-2 text-muted">A consolidated attendance sheet in India Standard Time.</p></div><div className="flex items-center gap-2"><Badge tone="green"><UsersRound size={14} className="mr-1 inline" /> {members.length} active staff</Badge><Link href="/team-attendance"><Button className="bg-white !text-ink ring-1 ring-line hover:bg-canvas"><Download size={16} className="mr-2" /> Current week</Button></Link></div></div><section className="rounded-2xl border border-line bg-white p-4 shadow-soft"><form className="flex flex-wrap items-end gap-3" method="get"><label className="text-xs font-semibold uppercase tracking-wide text-muted">View<select name="period" defaultValue={period} className="mt-1 block rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-accent"><option value="week">Weekly</option><option value="month">Monthly</option></select></label><label className="text-xs font-semibold uppercase tracking-wide text-muted">Anchor date<input name="date" type="date" defaultValue={anchor} className="mt-1 block rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-accent" /></label><Button type="submit">Apply filter</Button><div className="ml-auto flex items-center gap-2"><Link href={`/team-attendance?period=${period}&date=${previous}`} aria-label="Previous period" className="rounded-lg border border-line p-2.5 text-muted hover:bg-canvas hover:text-ink"><ChevronLeft size={17} /></Link><span className="min-w-36 text-center text-sm font-semibold">{displayRange(keys, period)}</span><Link href={`/team-attendance?period=${period}&date=${next}`} aria-label="Next period" className="rounded-lg border border-line p-2.5 text-muted hover:bg-canvas hover:text-ink"><ChevronRight size={17} /></Link></div></form></section><div className="flex flex-wrap items-center gap-2 text-xs text-muted"><span className="font-semibold text-ink">Legend:</span>{(["Present", "Working", "Leave", "Off"] as GridStatus[]).map((status) => <span key={status} className={`rounded-full px-2.5 py-1 font-semibold ${statusClasses(status)}`}>{status}</span>)}<span className="ml-1">Leave is automatic when a scheduled workday has no check-in. Saturdays/Sundays follow the configured work calendar.</span></div><div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-soft"><table className="w-full min-w-max border-collapse text-left text-sm"><thead className="bg-canvas text-xs uppercase tracking-wide text-muted"><tr><th className="sticky left-0 z-10 min-w-52 border-b border-r border-line bg-canvas px-4 py-4">Employee</th>{keys.map((key) => <th key={key} className="min-w-24 border-b border-line px-3 py-4 text-center">{displayDay(key)}</th>)}<th className="min-w-24 border-b border-l border-line px-3 py-4 text-center">Present</th><th className="min-w-24 border-b border-line px-3 py-4 text-center">Leave</th><th className="min-w-28 border-b border-line px-3 py-4 text-center">Total hours</th></tr></thead><tbody>{rows.map(({ member, cells, total, present, leave }) => <tr key={member.id} className="border-b border-line last:border-0"><td className="sticky left-0 z-[1] border-r border-line bg-white px-4 py-4"><Link href={`/team-attendance/${member.id}`} className="font-semibold text-brand hover:underline">{member.name}</Link><p className="mt-1 text-xs text-muted">{member.email}</p></td>{cells.map((cell) => <td key={cell.key} title={cell.reason ?? undefined} className="px-2 py-3 text-center"><div className={`mx-auto flex min-h-14 min-w-20 flex-col items-center justify-center rounded-xl px-2 py-2 ${statusClasses(cell.status)}`}><span className="text-xs font-bold">{cell.status}</span>{cell.duration > 0 && <span className="mt-1 text-[11px] opacity-80">{formatDuration(cell.duration)}</span>}{cell.status === "Leave" && cell.reason && <span className="mt-1 max-w-20 truncate text-[10px] opacity-80">{cell.reason}</span>}</div></td>)}<td className="border-l border-line px-3 py-4 text-center font-semibold">{present}</td><td className="px-3 py-4 text-center font-semibold text-rose-700">{leave}</td><td className="px-3 py-4 text-center font-semibold"><span className="inline-flex items-center gap-1"><Clock3 size={14} className="text-brand" />{formatDuration(total)}</span></td></tr>)}</tbody></table>{!rows.length && <p className="p-10 text-center text-sm text-muted">No active staff found.</p>}</div></div>;
}
