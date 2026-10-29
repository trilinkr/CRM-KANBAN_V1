"use client";
import { useActionState, useState } from "react";
import { saveBirthdayTemplate } from "@/app/(workspace)/settings/actions";
import { birthdayMessage } from "@/lib/birthdays";
import { Button } from "@/components/ui";
export function BirthdayTemplateForm({ template }: { template: string }) {
  const [draft, setDraft] = useState(template);
  const [state, action, pending] = useActionState(saveBirthdayTemplate, { ok: false, message: "" });
  return <form action={action} className="space-y-4 rounded-2xl border border-line bg-white p-6"><h2 className="text-lg font-semibold">Birthday WhatsApp message</h2><p className="text-sm text-muted">Use {"{name}"} for the team member’s name. WhatsApp opens with this message ready for you to review and send.</p><label className="block text-sm font-medium">Message template<textarea name="template" value={draft} onChange={(event) => setDraft(event.target.value)} required maxLength={2000} rows={6} className="mt-2 w-full rounded-lg border border-line p-3 focus:border-brand focus:outline-none" /></label><div className="rounded-xl bg-canvas p-4"><p className="mb-2 text-xs font-semibold text-muted">Preview</p><p className="whitespace-pre-wrap text-sm">{birthdayMessage(draft, "Team Member")}</p></div>{state.message && <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{state.message}</p>}<Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save birthday message"}</Button></form>;
}
