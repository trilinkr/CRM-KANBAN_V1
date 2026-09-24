export type AttendanceSessionLike = { checkInAt: Date; checkOutAt: Date | null };
export function durationMs(session: AttendanceSessionLike, now = new Date()) { return Math.max(0, (session.checkOutAt ?? now).getTime() - session.checkInAt.getTime()); }
export function totalDurationMs(sessions: AttendanceSessionLike[], now = new Date()) { return sessions.reduce((sum, session) => sum + durationMs(session, now), 0); }
export function durationWithinRange(session: AttendanceSessionLike, start: Date, end: Date, now = new Date()) { const from = Math.max(session.checkInAt.getTime(), start.getTime()); const to = Math.min((session.checkOutAt ?? now).getTime(), end.getTime()); return Math.max(0, to - from); }
export function totalDurationWithinRange(sessions: AttendanceSessionLike[], start: Date, end: Date, now = new Date()) { return sessions.reduce((sum, session) => sum + durationWithinRange(session, start, end, now), 0); }
export function formatDuration(ms: number) { const minutes = Math.floor(ms / 60000); return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`; }
