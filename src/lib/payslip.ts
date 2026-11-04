import { z } from "zod";

const amount = z.coerce.number().int("Use whole rupees only.").min(0, "Amounts cannot be negative.").max(100000000);

/** Amount actually paid to the employee, and how much of it was arrears. */
export const paymentSchema = z.object({ totalPaid: amount, arrears: amount }).refine((value) => value.arrears <= value.totalPaid, { message: "Arrears cannot be more than the total paid.", path: ["arrears"] });

/**
 * The payslip is built from the amount actually paid:
 * salary = total paid − arrears, split into Basic 50%, HRA 30%, Special Allowance 20%.
 */
export function payslipBreakup(totalPaid: number, arrears: number) {
  const salaryPaid = Math.max(0, totalPaid - arrears);
  const basicPay = Math.round(salaryPaid * 0.5);
  const hra = Math.round(salaryPaid * 0.3);
  const specialAllowance = salaryPaid - basicPay - hra;
  return { salaryPaid, basicPay, hra, specialAllowance, arrears, totalPaid };
}
