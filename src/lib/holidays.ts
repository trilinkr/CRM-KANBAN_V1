export type FixedHoliday = { month: number; day: number; name: string };

/** Fixed-date holidays used by the TriLinkr India work calendar. */
export const FIXED_INDIAN_HOLIDAYS: readonly FixedHoliday[] = [
  { month: 1, day: 26, name: "Republic Day" },
  { month: 5, day: 1, name: "Labour Day" },
  { month: 8, day: 15, name: "Independence Day" },
  { month: 10, day: 2, name: "Gandhi Jayanti" },
  { month: 12, day: 25, name: "Christmas Day" },
];

export function getFixedHoliday(dateKey: string) {
  const [, month, day] = dateKey.split("-").map(Number);
  return FIXED_INDIAN_HOLIDAYS.find((holiday) => holiday.month === month && holiday.day === day) ?? null;
}
