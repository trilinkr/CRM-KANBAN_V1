"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculatePayroll, isPayrollMonth } from "@/lib/payroll";
import { paymentSchema } from "@/lib/payslip";
import { requireAdmin } from "@/lib/auth";
import { audit, db, payrollRecords, users } from "@/lib/domain";
import { getOrgCalendarParts } from "@/lib/time";
const inputSchema = z.object({ userId: z.string().uuid(), month: z.string().refine(isPayrollMonth, "Invalid payroll month") });
export async function markPayrollPaid(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = inputSchema.safeParse({ userId: formData.get("userId"), month: formData.get("month") });
  if (!parsed.success) throw new Error("Invalid payroll details");
  const payment = paymentSchema.safeParse({ totalPaid: formData.get("totalPaid"), arrears: formData.get("arrears") || "0" });
  if (!payment.success) throw new Error(payment.error.issues[0]?.message ?? "Enter a valid paid amount.");
  const member = (await db.select({ id: users.id, monthlySalary: users.monthlySalary }).from(users).where(and(eq(users.id, parsed.data.userId), eq(users.active, true))).limit(1))[0];
  if (!member || member.monthlySalary === null) throw new Error("Add a monthly salary for this team member first.");
  const existing = (await db.select({ id: payrollRecords.id }).from(payrollRecords).where(and(eq(payrollRecords.userId, member.id), eq(payrollRecords.payrollMonth, parsed.data.month))).limit(1))[0];
  if (existing) throw new Error("Payroll is already marked as paid for this month.");
  const metrics = await calculatePayroll(member.id, parsed.data.month);
  // Attendance-based figure is kept only as a reference estimate; the payslip uses the amount actually paid.
  const attendanceSalary = Math.round(member.monthlySalary / metrics.totalDays * metrics.presentDays);
  const { totalPaid, arrears } = payment.data;
  const record = (await db.insert(payrollRecords).values({ userId: member.id, payrollMonth: parsed.data.month, monthlySalary: member.monthlySalary, totalDays: metrics.totalDays, workingDays: metrics.workingDays, presentDays: metrics.presentDays, attendanceSalary, arrears, totalSalaryPaid: totalPaid, paidByUserId: admin.id }).returning({ id: payrollRecords.id }))[0];
  await audit(admin.id, "PAYROLL_MARKED_PAID", "PAYROLL", record.id, { userId: member.id, month: parsed.data.month, presentDays: metrics.presentDays, attendanceEstimate: attendanceSalary, totalPaid, arrears });
  revalidatePath("/payroll");
}

export async function updatePayrollPayment(_previousState: { ok: boolean; message: string }, formData: FormData) {
  const admin = await requireAdmin();
  const recordId = z.string().uuid().safeParse(formData.get("recordId"));
  if (!recordId.success) return { ok: false, message: "Payroll payment not found." };
  const payment = paymentSchema.safeParse({ totalPaid: formData.get("totalPaid"), arrears: formData.get("arrears") || "0" });
  if (!payment.success) return { ok: false, message: payment.error.issues[0]?.message ?? "Enter valid amounts." };
  const record = (await db.select().from(payrollRecords).where(eq(payrollRecords.id, recordId.data)).limit(1))[0];
  if (!record) return { ok: false, message: "Payroll payment not found." };
  const { totalPaid, arrears } = payment.data;
  await db.update(payrollRecords).set({ arrears, totalSalaryPaid: totalPaid, updatedAt: new Date() }).where(eq(payrollRecords.id, record.id));
  await audit(admin.id, "PAYROLL_PAYMENT_UPDATED", "PAYROLL", record.id, { month: record.payrollMonth, previousTotalPaid: record.totalSalaryPaid, previousArrears: record.arrears, totalPaid, arrears });
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
