"use client";

import { useRef, useState } from "react";
import { updateLeadStatus } from "@/app/(workspace)/leads/actions";
import { Badge } from "@/components/ui";

const statusLabels = { NEW: "New", INTRO_SENT: "Intro Sent", FOLLOW_UP: "Follow up", WHATSAPP: "WhatsApp", ONBOARDED: "Onboarded", DROPPED: "Dropped" } as const;
const statusTones = { NEW: "neutral", INTRO_SENT: "amber", FOLLOW_UP: "amber", WHATSAPP: "green", ONBOARDED: "green", DROPPED: "red" } as const;
type Status = keyof typeof statusLabels;

export function LeadStatusCell({ leadId, status }: { leadId: string; status: Status }) {
  const [editing, setEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  if (editing) return <form ref={formRef} action={updateLeadStatus} className="min-w-32"><input type="hidden" name="leadId" value={leadId} /><select name="status" autoFocus defaultValue={status} aria-label="Change lead status" onChange={() => { formRef.current?.requestSubmit(); setEditing(false); }} onBlur={() => setEditing(false)} className="w-full rounded-lg border border-brand bg-white px-2.5 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-accent"><option value="NEW">New</option><option value="INTRO_SENT">Intro Sent</option><option value="FOLLOW_UP">Follow up</option><option value="WHATSAPP">WhatsApp</option><option value="ONBOARDED">Onboarded</option><option value="DROPPED">Dropped</option></select></form>;
  return <button type="button" onDoubleClick={() => setEditing(true)} title="Double-click to change status" className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-accent"><Badge tone={statusTones[status]}>{statusLabels[status]}</Badge></button>;
}
