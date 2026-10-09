import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { db, payrollRecords, users } from "@/lib/domain";
import { formatOrgDate, formatOrgDateTime, formatOrgMonth } from "@/lib/time";

function money(value: number) { return "₹" + value.toLocaleString("en-IN"); }
function dateValue(value: string | null) { return value ? formatOrgDate(new Date(value + "T00:00:00Z")) : "—"; }

export default async function PayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const id = (await params).id;
  const record = (await db.select({ record: payrollRecords, employee: users }).from(payrollRecords).innerJoin(users, eq(users.id, payrollRecords.userId)).where(eq(payrollRecords.id, id)).limit(1))[0];
  if (!record || (user.role !== "ADMIN" && record.record.userId !== user.id)) redirect("/payroll");

  const basicPay = Math.round(record.record.attendanceSalary * 0.5);
  const hra = Math.round(record.record.attendanceSalary * 0.3);
  const specialAllowance = record.record.attendanceSalary - basicPay - hra;

  return <div className="mx-auto max-w-3xl space-y-6">
    <div className="flex items-center justify-between"><div><p className="text-sm text-brand">Payslip</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{formatOrgMonth(new Date(record.record.payrollMonth + "-01T00:00:00Z"))}</h1></div><Button type="button" className="bg-white !text-ink ring-1 ring-line hover:bg-canvas"><Link href="/payroll">Back to payroll</Link></Button></div>
    <section className="rounded-2xl border border-line bg-white p-8 shadow-soft">
      <div className="border-b border-line pb-6 text-center">
        <Image src="/trilinkr-logo.png" alt="TriLinkr — The Hiring Trinity" width={1880} height={1576} className="mx-auto h-20 w-56 object-contain" priority />
        <h2 className="mt-3 text-2xl font-semibold">Salary payslip</h2>
        <p className="mt-1 text-sm text-muted">Payslip month: {record.record.payrollMonth}</p>
        <p className="mt-3 text-sm font-medium text-brand"><a href="https://www.trilinkr.com" target="_blank" rel="noreferrer" className="hover:underline">www.trilinkr.com</a> <span className="text-muted">|</span> <a href="mailto:hr@trilinkr.com" className="hover:underline">hr@trilinkr.com</a></p>
      </div>
      <div className="grid gap-4 border-b border-line py-6 sm:grid-cols-2"><div><p className="text-xs uppercase text-muted">Employee name</p><p className="mt-1 font-medium">{record.employee.name}</p></div><div><p className="text-xs uppercase text-muted">Official email</p><p className="mt-1 font-medium">{record.employee.email}</p></div><div><p className="text-xs uppercase text-muted">Phone number</p><p className="mt-1 font-medium">{record.employee.phone || "—"}</p></div><div><p className="text-xs uppercase text-muted">Date of joining</p><p className="mt-1 font-medium">{dateValue(record.employee.dateOfJoining)}</p></div></div>
      <div className="grid gap-4 border-b border-line py-6 sm:grid-cols-3"><div><p className="text-xs uppercase text-muted">Calendar days</p><p className="mt-1 text-lg font-semibold">{record.record.totalDays}</p></div><div><p className="text-xs uppercase text-muted">Working days</p><p className="mt-1 text-lg font-semibold">{record.record.workingDays}</p></div><div><p className="text-xs uppercase text-muted">Days present</p><p className="mt-1 text-lg font-semibold">{record.record.presentDays}</p></div></div>
      <div className="border-b border-line py-6"><h3 className="font-semibold">Salary breakup</h3><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span>Basic Pay</span><span>{money(basicPay)}</span></div><div className="flex justify-between"><span>HRA</span><span>{money(hra)}</span></div><div className="flex justify-between"><span>Special Allowance</span><span>{money(specialAllowance)}</span></div><div className="flex justify-between"><span>Deductions</span><span>Nil</span></div></div><p className="mt-4 text-xs text-muted">Basic Pay 50%, HRA 30%, and Special Allowance 20% of the attendance-based salary.</p></div>
      <div className="space-y-4 py-6"><div className="flex justify-between"><span>Monthly salary</span><span>{money(record.record.monthlySalary)}</span></div><div className="flex justify-between"><span>Attendance-based salary</span><span>{money(record.record.attendanceSalary)}</span></div><div className="flex justify-between"><span>Arrears</span><span>{money(record.record.arrears)}</span></div><div className="flex justify-between border-t border-line pt-4 text-lg font-semibold"><span>Total salary paid</span><span className="text-brand">{money(record.record.totalSalaryPaid)}</span></div></div>
      <div className="border-t border-line pt-5 text-xs text-muted">Paid on {formatOrgDateTime(record.record.paidAt)}</div>
    </section>
  </div>;
}
