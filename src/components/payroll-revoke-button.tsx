"use client";

import { RotateCcw } from "lucide-react";
import { revokeCurrentMonthPayroll } from "@/app/(workspace)/payroll/actions";

export function PayrollRevokeButton({ recordId, employeeName, month }: { recordId: string; employeeName: string; month: string }) {
  return <form action={revokeCurrentMonthPayroll} onSubmit={(event) => { if (!window.confirm(`Revoke ${employeeName}'s payroll for ${month}? It will return to Pending.`)) event.preventDefault(); }}><input type="hidden" name="recordId" value={recordId} /><button type="submit" aria-label={`Revoke current month payroll for ${employeeName}`} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand ring-1 ring-line hover:bg-accent"><RotateCcw size={14} className="mr-1.5 inline" /> Revoke</button></form>;
}
