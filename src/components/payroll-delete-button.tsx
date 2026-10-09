"use client";

import { Trash2 } from "lucide-react";
import { removePayrollPayment } from "@/app/(workspace)/payroll/actions";

export function PayrollDeleteButton({ recordId, employeeName, month }: { recordId: string; employeeName: string; month: string }) {
  return <form action={removePayrollPayment} onSubmit={(event) => { if (!window.confirm(`Remove ${employeeName}'s payment for ${month}?`)) event.preventDefault(); }}><input type="hidden" name="recordId" value={recordId} /><button type="submit" aria-label={`Remove payment for ${employeeName}`} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-700"><Trash2 size={17} /></button></form>;
}
