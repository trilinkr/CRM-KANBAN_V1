"use client";
import { useActionState } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { setLeadArchived } from "@/app/(workspace)/leads/actions";
export function LeadArchiveButton({ leadId, archived, company }: { leadId: string; archived: boolean; company: string }) {
  const [state, action, pending] = useActionState(setLeadArchived, { ok: false, message: "" });
  const label = (archived ? "Restore " : "Archive ") + company;
  return <form action={action}><input type="hidden" name="leadId" value={leadId} /><input type="hidden" name="archived" value={String(!archived)} /><button type="submit" disabled={pending} aria-label={label} title={label} className="rounded-lg p-2 text-muted transition hover:bg-accent hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40">{archived ? <ArchiveRestore size={17} /> : <Archive size={17} />}</button>{!state.ok && state.message && <p role="alert" className="text-xs text-red-700">{state.message}</p>}</form>;
}
