"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculatePayroll, isPayrollMonth } from "@/lib/payroll";
import { requireAdmin } from "@/lib/auth";
import { audit, db, payrollRecords, users } from "@/lib/domain";
import { getOrgCalendarParts } from "@/lib/time";
const inputSchema = z.object({ userId: z.string().uuid(), month: z.string().refine(isPayrollMonth, "Invalid payroll month"), arrears: z.coerce.number().int().min(0).max(100000000) });
function previousMonth(month: string) { const [year, monthNumber] = month.split("-").map(Number); const date = new Date(Date.UTC(year, monthNumber - 2, 1)); return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }
export async function markPayrollPaid(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = inputSchema.safeParse({ userId: formData.get("userId"), month: formData.get("month"), arrears: formData.get("arrears") || "0" });
  if (!parsed.success) throw new Error("Invalid payroll details");
  const member = (await db.select({ id: users.id, monthlySalary: users.monthlySalary }).from(users).where(and(eq(users.id, parsed.data.userId), eq(users.active, true))).limit(1))[0];
  if (!member || member.monthlySalary === null) throw new Error("Add a monthly salary for this team member first.");
  const existing = (await db.select({ id: payrollRecords.id }).from(payrollRecords).where(and(eq(payrollRecords.userId, member.id), eq(payrollRecords.payrollMonth, parsed.data.month))).limit(1))[0];
  if (existing) throw new Error("Payroll is already marked as paid for this month.");
  const metrics = await calculatePayroll(member.id, parsed.data.month);
  const attendanceSalary = Math.round(member.monthlySalary / metrics.totalDays * metrics.presentDays);
  const previous = (await db.select({ arrears: payrollRecords.arrears }).from(payrollRecords).where(and(eq(payrollRecords.userId, member.id), eq(payrollRecords.payrollMonth, previousMonth(parsed.data.month)))).limit(1))[0];
  const carriedArrears = previous?.arrears ?? 0;
  const totalArrears = carriedArrears + parsed.data.arrears;
  const totalSalaryPaid = attendanceSalary + totalArrears;
  const record = (await db.insert(payrollRecords).values({ userId: member.id, payrollMonth: parsed.data.month, monthlySalary: member.monthlySalary, totalDays: metrics.totalDays, workingDays: metrics.workingDays, presentDays: metrics.presentDays, attendanceSalary, arrears: totalArrears, totalSalaryPaid, paidByUserId: admin.id }).returning({ id: payrollRecords.id }))[0];
  await audit(admin.id, "PAYROLL_MARKED_PAID", "PAYROLL", record.id, { userId: member.id, month: parsed.data.month, presentDays: metrics.presentDays, arrears: totalArrears, carriedArrears, additionalArrears: parsed.data.arrears });
  revalidatePath("/payroll");
}

const editSchema = z.object({ recordId: z.string().uuid(), arrears: z.coerce.number().int().min(0).max(100000000) });
export async function updatePayrollPayment(_previousState: { ok: boolean; message: string }, formData: FormData) {
  const admin = await requireAdmin();
  const parsed = editSchema.safeParse({ recordId: formData.get("recordId"), arrears: formData.get("arrears") });
  if (!parsed.success) return { ok: false, message: "Enter a valid arrears amount." };
  const record = (await db.select().from(payrollRecords).where(eq(payrollRecords.id, parsed.data.recordId)).limit(1))[0];
  if (!record) return { ok: false, message: "Payroll payment not found." };
  const totalSalaryPaid = record.attendanceSalary + parsed.data.arrears;
  await db.update(payrollRecords).set({ arrears: parsed.data.arrears, totalSalaryPaid, updatedAt: new Date() }).where(eq(payrollRecords.id, record.id));
  await audit(admin.id, "PAYROLL_PAYMENT_UPDATED", "PAYROLL", record.id, { month: record.payrollMonth, previousArrears: record.arrears, arrears: parsed.data.arrears, totalSalaryPaid });
  revalidatePath("/payroll");
  revalidatePath(`/payroll/${record.id}`);
  return { ok: true, message: "Payment updated." };
}

export async function removePayrollPayment(formData: FormData) {
  const admin = await requireAdmin();
  const recordId = String(formData.get("recordId"));
  const record = (await db.select().from(payrollRecords).where(eq(payrollRecords.id, recordId)).limit(1))[0];
  if (!record) throw new Error("Payroll payment not found.");
  await audit(admin.id, "PAYROLL_PAYMENT_REMOVED", "PAYROLL", record.id, { userId: record.userId, month: record.payrollMonth, totalSalaryPaid: record.totalSalaryPaid });
  await db.delete(payrollRecords).where(eq(payrollRecords.id, record.id));
  revalidatePath("/payroll");
  revalidatePath(`/payroll/${record.id}`);
}

export async function revokeCurrentMonthPayroll(formData: FormData) {
  const admin = await requireAdmin();
  const recordId = z.string().uuid().safeParse(formData.get("recordId"));
  if (!recordId.success) throw new Error("Invalid payroll payment");
  const current = getOrgCalendarParts();
  const currentMonth = `${current.year}-${String(current.month).padStart(2, "0")}`;
  const record = (await db.select().from(payrollRecords).where(eq(payrollRecords.id, recordId.data)).limit(1))[0];
  if (!record) throw new Error("Payroll payment not found.");
  if (record.payrollMonth !== currentMonth) throw new Error("Only the current month payroll can be revoked.");
  await audit(admin.id, "PAYROLL_CURRENT_MONTH_REVOKED", "PAYROLL", record.id, { userId: record.userId, month: record.payrollMonth, totalSalaryPaid: record.totalSalaryPaid });
  await db.delete(payrollRecords).where(eq(payrollRecords.id, record.id));
  revalidatePath("/payroll");
  revalidatePath(`/payroll/${record.id}`);
}
