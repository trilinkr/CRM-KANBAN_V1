import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { attendanceSessions, db, users } from "@/lib/domain";
import { formatOrgDateTime, formatOrgDateTimeLocal } from "@/lib/time";
import { correctAttendance } from "../actions";

export default async function AttendanceDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  await requireAdmin();
  const { userId } = await params;
  const member = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!member) return null;
  const sessions = await db.select().from(attendanceSessions).where(eq(attendanceSessions.userId, userId)).orderBy(desc(attendanceSessions.checkInAt)).limit(100);
  return <div className="space-y-6"><div><Link href="/team-attendance" className="text-sm font-medium text-brand">← Team attendance</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">{member.name}</h1><p className="mt-2 text-muted">Attendance history and corrections in India Standard Time.</p></div><div className="space-y-4">{sessions.map((session) => <section key={session.id} className="rounded-2xl border border-line bg-white p-6"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-sm font-medium">{formatOrgDateTime(session.checkInAt)} → {session.checkOutAt ? formatOrgDateTime(session.checkOutAt) : "Open"}</p><p className="mt-1 text-xs text-muted">{session.correctedByUserId ? `Corrected: ${session.correctionReason}` : "Original session"}</p></div></div><form action={correctAttendance} className="mt-5 grid gap-3 md:grid-cols-4"><input type="hidden" name="sessionId" value={session.id} /><label className="text-xs font-medium">Check in<input name="checkInAt" type="datetime-local" defaultValue={formatOrgDateTimeLocal(session.checkInAt)} required className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" /></label><label className="text-xs font-medium">Check out<input name="checkOutAt" type="datetime-local" defaultValue={session.checkOutAt ? formatOrgDateTimeLocal(session.checkOutAt) : undefined} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" /></label><label className="text-xs font-medium md:col-span-2">Reason<input name="reason" required minLength={3} placeholder="Why is this correction needed?" className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" /></label><button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white md:col-start-4">Save correction</button></form></section>)}{!sessions.length && <p className="rounded-2xl border border-line bg-white p-10 text-center text-sm text-muted">No attendance sessions found.</p>}</div></div>;
}
