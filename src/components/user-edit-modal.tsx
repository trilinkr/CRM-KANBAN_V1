"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { updateUserProfile } from "@/app/(workspace)/team/actions";

type UserProfile = { id: string; name: string; email: string; phone: string | null; dateOfBirth: string | null; monthlySalary: number | null; dateOfJoining: string | null };

export function UserEditModal({ user }: { user: UserProfile }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, isPending] = useActionState(updateUserProfile, { ok: false, message: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!state.ok) return;
    dialogRef.current?.close();
    setSaved(true);
    const timeout = window.setTimeout(() => setSaved(false), 3000);
    return () => window.clearTimeout(timeout);
  }, [state.ok]);

  return <>
    <Button type="button" className="bg-white !text-ink ring-1 ring-line hover:bg-canvas" onClick={() => dialogRef.current?.showModal()}><Pencil size={14} className="mr-1.5" /> Edit details</Button>
    {saved && <div role="status" className="fixed right-5 top-5 z-50 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-xl">Details saved</div>}
    <dialog ref={dialogRef} className="w-[min(680px,calc(100vw-2rem))] rounded-2xl border border-line bg-canvas p-0 text-ink shadow-2xl backdrop:bg-ink/40">
      <div className="flex items-center justify-between border-b border-line bg-white px-6 py-4"><div><p className="text-sm text-brand">Team member</p><h2 className="mt-1 text-xl font-semibold">Edit details</h2></div><button type="button" aria-label="Close edit user form" onClick={() => dialogRef.current?.close()} className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink"><X size={18} /></button></div>
      <form action={formAction} className="grid gap-4 p-6 md:grid-cols-2">
        <input type="hidden" name="id" value={user.id} />
        <label className="text-sm font-medium">Name<Input name="name" required defaultValue={user.name} /></label>
        <label className="text-sm font-medium">Official email<Input name="email" type="email" required defaultValue={user.email} /></label>
        <label className="text-sm font-medium">Phone number<Input name="phone" type="tel" defaultValue={user.phone ?? ""} /></label>
        <label className="text-sm font-medium">Date of birth<Input name="dateOfBirth" type="date" defaultValue={user.dateOfBirth ?? ""} /></label>
        <label className="text-sm font-medium">Monthly salary (₹)<Input name="monthlySalary" type="number" min="0" step="1" defaultValue={user.monthlySalary ?? ""} /></label>
        <label className="text-sm font-medium">Date of joining<Input name="dateOfJoining" type="date" defaultValue={user.dateOfJoining ?? ""} /></label>
        <div className="flex justify-end gap-3 md:col-span-2">{state.message && !state.ok && <p role="alert" className="mr-auto self-center text-sm text-red-700">{state.message}</p>}<Button type="button" onClick={() => dialogRef.current?.close()} className="bg-white !text-ink ring-1 ring-line hover:bg-canvas">Cancel</Button><Button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save details"}</Button></div>
      </form>
    </dialog>
  </>;
}
