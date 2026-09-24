import { describe, expect, it } from "vitest";
import { formatDuration, totalDurationMs, totalDurationWithinRange } from "@/lib/attendance";

describe("attendance totals", () => { it("sums sessions rather than spanning breaks", () => { const sessions = [{ checkInAt: new Date("2026-09-23T09:05:00Z"), checkOutAt: new Date("2026-09-23T12:30:00Z") }, { checkInAt: new Date("2026-09-23T13:15:00Z"), checkOutAt: new Date("2026-09-23T16:10:00Z") }]; expect(formatDuration(totalDurationMs(sessions))).toBe("6h 20m"); }); });
describe("attendance day boundaries", () => { it("clips a midnight-crossing session to the requested calendar day", () => { const sessions = [{ checkInAt: new Date("2026-09-22T23:30:00Z"), checkOutAt: new Date("2026-09-23T01:30:00Z") }]; expect(formatDuration(totalDurationWithinRange(sessions, new Date("2026-09-23T00:00:00Z"), new Date("2026-09-24T00:00:00Z")))).toBe("1h 30m"); }); });
