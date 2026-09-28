"use client";

import { useRef } from "react";
import { Pencil, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { updateLead } from "@/app/(workspace)/leads/actions";

const statuses = [
  ["NEW", "New"],
  ["INTRO_SENT", "Intro Sent"],
  ["FOLLOW_UP", "Follow up"],
  ["WHATSAPP", "WhatsApp"],
  ["ONBOARDED", "Onboarded"],
  ["DROPPED", "Dropped"],
] as const;

type LeadDraft = {
  id: string;
  type: "EMPLOYER" | "CONSULTANT";
  ownerUserId: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  linkedinUrl: string;
  status: (typeof statuses)[number][0];
};

export function LeadEditModal({ lead, owners }: { lead: LeadDraft; owners: Array<{ id: string; name: string; email: string }> }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return <>
    <Button type="button" className="bg-white !text-ink ring-1 ring-line hover:bg-canvas" onClick={() => dialogRef.current?.showModal()}><Pencil size={16} className="mr-2" /> Edit lead</Button>
    <dialog ref={dialogRef} className="w-[min(720px,calc(100vw-2rem))] rounded-2xl border border-line bg-canvas p-0 text-ink shadow-2xl backdrop:bg-ink/40">
      <div className="flex items-center justify-between border-b border-line bg-white px-6 py-4"><div><p className="text-sm text-brand">Lead details</p><h2 className="mt-1 text-xl font-semibold">Edit lead</h2></div><button type="button" aria-label="Close edit lead form" onClick={() => dialogRef.current?.close()} className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink"><X size={18} /></button></div>
      <form action={updateLead} className="grid gap-4 p-6 md:grid-cols-2">
        <input type="hidden" name="leadId" value={lead.id} />
        <label className="text-sm font-medium">Lead type<select name="type" defaultValue={lead.type} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-accent"><option value="EMPLOYER">Employer</option><option value="CONSULTANT">Consultant</option></select></label>
        <label className="text-sm font-medium">Lead owner<select name="ownerUserId" required defaultValue={lead.ownerUserId} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-accent">{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name} · {owner.email}</option>)}</select></label>
        <label className="text-sm font-medium">Company name<Input name="companyName" required defaultValue={lead.companyName} /></label>
        <label className="text-sm font-medium">Contact person name<Input name="contactName" required defaultValue={lead.contactName} /></label>
        <label className="text-sm font-medium">Phone number<Input name="phone" required defaultValue={lead.phone} /></label>
        <label className="text-sm font-medium">Email ID<Input name="email" type="email" defaultValue={lead.email} /></label>
        <label className="text-sm font-medium">LinkedIn ID / URL<Input name="linkedinUrl" type="url" defaultValue={lead.linkedinUrl} /></label>
        <label className="text-sm font-medium">Lead status<select name="status" defaultValue={lead.status} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-accent">{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <div className="flex justify-end gap-3 md:col-span-2"><Button type="button" onClick={() => dialogRef.current?.close()} className="bg-white !text-ink ring-1 ring-line hover:bg-canvas">Cancel</Button><Button type="submit">Save changes</Button></div>
      </form>
    </dialog>
  </>;
}
