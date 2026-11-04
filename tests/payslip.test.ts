import { describe, expect, it } from "vitest";
import { paymentSchema, payslipBreakup } from "@/lib/payslip";

describe("payslip from paid amount", () => {
  it("splits ₹12,400 paid with ₹400 arrears into a ₹12,000 salary", () => {
    expect(payslipBreakup(12400, 400)).toEqual({ salaryPaid: 12000, basicPay: 6000, hra: 3600, specialAllowance: 2400, arrears: 400, totalPaid: 12400 });
  });
  it("keeps the breakup summing exactly to the salary when rounding", () => {
    const slip = payslipBreakup(11129, 0);
    expect(slip.basicPay + slip.hra + slip.specialAllowance).toBe(11129);
  });
  it("rejects arrears larger than the total paid", () => {
    expect(paymentSchema.safeParse({ totalPaid: "300", arrears: "400" }).success).toBe(false);
    expect(paymentSchema.safeParse({ totalPaid: "12400", arrears: "400" }).success).toBe(true);
    expect(paymentSchema.safeParse({ totalPaid: "-1", arrears: "0" }).success).toBe(false);
  });
});
