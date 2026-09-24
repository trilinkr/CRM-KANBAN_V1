import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { attendanceSessions, db } from "@/lib/domain";
import { formatDuration } from "@/lib/attendance";
import { formatOrgDate, formatOrgTime } from "@/lib/time";

export default async function AttendanceHistoryPage() {
  const user = await requireUser();
  const sessions = await db.select().from(attendanceSessions).where(eq(attendanceSessions.userId, user.id)).orderBy(desc(attendanceSessions.checkInAt)).limit(100);
  return <div className="space-y-6"><div><p className="text-sm text-brand">Attendance</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Attendance history</h1><p className="mt-2 text-muted">Your recent attendance sessions in India Standard Time.</p></div><div className="overflow-x-auto rounded-2xl border border-line bg-white"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Date</th><th className="px-5 py-4">Check in</th><th className="px-5 py-4">Check out</th><th className="px-5 py-4">Duration</th><th className="px-5 py-4">Status</th></tr></thead><tbody>{sessions.map((session) => <tr key={session.id} className="border-b border-line last:border-0"><td className="px-5 py-4">{formatOrgDate(session.checkInAt)}</td><td className="px-5 py-4">{formatOrgTime(session.checkInAt)}</td><td className="px-5 py-4">{session.checkOutAt ? formatOrgTime(session.checkOutAt) : "Open"}</td><td className="px-5 py-4 font-medium">{formatDuration(Math.max(0, (session.checkOutAt ?? new Date()).getTime() - session.checkInAt.getTime()))}</td><td className="px-5 py-4">{session.checkOutAt ? "Checked out" : "Working"}</td></tr>)}</tbody></table>{!sessions.length && <p className="p-10 text-center text-sm text-muted">No attendance history yet.</p>}</div></div>;
}
