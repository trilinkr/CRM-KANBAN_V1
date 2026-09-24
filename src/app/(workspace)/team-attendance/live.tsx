import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db, getTodayAttendance, users } from "@/lib/domain";
import { formatDuration, totalDurationMs } from "@/lib/attendance";
import { formatOrgTime } from "@/lib/time";

export default async function LiveTeamAttendancePage() {
  await requireAdmin();
  const members = await db.select().from(users).where(eq(users.active, true));
  const rows = await Promise.all(members.map(async (member) => { const sessions = await getTodayAttendance(member.id); const open = sessions.some((session) => !session.checkOutAt); return { member, sessions, open }; }));
  return <div className="space-y-6"><div><p className="text-sm text-brand">Administration</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Team attendance</h1><p className="mt-2 text-muted">Today’s consolidated working time in India Standard Time.</p></div><div className="overflow-x-auto rounded-2xl border border-line bg-white"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-4">Employee</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">First check-in</th><th className="px-5 py-4">Last check-out</th><th className="px-5 py-4">Sessions</th><th className="px-5 py-4">Daily total</th></tr></thead><tbody>{rows.map(({ member, sessions, open }) => <tr key={member.id} className="border-b border-line last:border-0"><td className="px-5 py-4 font-medium"><Link href={`/team-attendance/${member.id}`} className="text-brand hover:underline">{member.name}</Link></td><td className="px-5 py-4">{open ? "Working" : sessions.length ? "Checked Out" : "Not Started"}</td><td className="px-5 py-4">{sessions.at(-1) ? formatOrgTime(sessions.at(-1)!.checkInAt) : "—"}</td><td className="px-5 py-4">{sessions[0]?.checkOutAt ? formatOrgTime(sessions[0].checkOutAt) : "—"}</td><td className="px-5 py-4">{sessions.length}</td><td className="px-5 py-4 font-medium">{formatDuration(totalDurationMs(sessions))}</td></tr>)}</tbody></table></div></div>;
}
