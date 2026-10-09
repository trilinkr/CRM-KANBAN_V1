"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { updatePayrollPayment } from "@/app/(workspace)/payroll/actions";

export function PayrollEditModal({ recordId, arrears, employeeName }: { recordId: string; arrears: number; employeeName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, isPending] = useActionState(updatePayrollPayment, { ok: false, message: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!state.ok) return;
    dialogRef.current?.close();
    setSaved(true);
    const timeout = window.setTimeout(() => setSaved(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [state.ok]);

  return <>
    <Button type="button" aria-label={`Edit payment for ${employeeName}`} className="bg-white !text-ink px-2.5 ring-1 ring-line hover:bg-canvas" onClick={() => dialogRef.current?.showModal()}><Pencil size={15} /></Button>
    {saved && <div role="status" className="fixed right-5 top-5 z-50 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-xl">Payment updated</div>}
    <dialog ref={dialogRef} className="w-[min(440px,calc(100vw-2rem))] rounded-2xl border border-line bg-canvas p-0 text-ink shadow-2xl backdrop:bg-ink/40">
      <div className="flex items-center justify-between border-b border-line bg-white px-6 py-4"><div><p className="text-sm text-brand">Payroll payment</p><h2 className="mt-1 text-xl font-semibold">Edit payment</h2></div><button type="button" aria-label="Close edit payment form" onClick={() => dialogRef.current?.close()} className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink"><X size={18} /></button></div>
      <form action={formAction} className="space-y-4 p-6"><input type="hidden" name="recordId" value={recordId} /><p className="text-sm text-muted">Update the manual arrears for {employeeName}. Attendance salary remains unchanged.</p><label className="text-sm font-medium">Arrears (₹)<Input name="arrears" type="number" min="0" step="1" defaultValue={arrears} required /></label><div className="flex justify-end gap-3">{state.message && !state.ok && <p role="alert" className="mr-auto self-center text-sm text-red-700">{state.message}</p>}<Button type="button" onClick={() => dialogRef.current?.close()} className="bg-white !text-ink ring-1 ring-line hover:bg-canvas">Cancel</Button><Button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save changes"}</Button></div></form>
    </dialog>
  </>;
}
