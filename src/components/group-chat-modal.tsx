"use client";

import { useRef } from "react";
import { Plus, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { createGroupRoom } from "@/app/(workspace)/chat/actions";

type Member = { id: string; name: string; email: string };

export function GroupChatModal({ members, currentUserId }: { members: Member[]; currentUserId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  return <><Button type="button" onClick={() => dialogRef.current?.showModal()} className="bg-white !text-ink ring-1 ring-line hover:bg-canvas"><Plus size={16} className="mr-2" /> New group</Button><dialog ref={dialogRef} className="w-[min(560px,calc(100vw-2rem))] rounded-2xl border border-line bg-canvas p-0 text-ink shadow-2xl backdrop:bg-ink/40"><div className="flex items-center justify-between border-b border-line bg-white px-6 py-4"><div><p className="text-sm text-brand">Private group</p><h2 className="mt-1 text-xl font-semibold">Create a group chat</h2></div><button type="button" aria-label="Close group form" onClick={() => dialogRef.current?.close()} className="rounded-lg p-2 text-muted hover:bg-canvas hover:text-ink"><X size={18} /></button></div><form action={createGroupRoom} className="space-y-5 p-6"><label className="block text-sm font-medium">Group name<Input name="name" required maxLength={80} placeholder="e.g. Hiring sprint" /></label><div><p className="text-sm font-medium">Add members <span className="font-normal text-muted">(optional — you can create a private group for yourself)</span></p><div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-line bg-white p-3">{members.filter((member) => member.id !== currentUserId).map((member) => <label key={member.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-canvas"><input type="checkbox" name="memberIds" value={member.id} className="h-4 w-4 accent-orange-600" /><span><span className="block text-sm font-medium">{member.name}</span><span className="block text-xs text-muted">{member.email}</span></span></label>)}</div></div><div className="flex justify-end gap-3"><Button type="button" onClick={() => dialogRef.current?.close()} className="bg-white !text-ink ring-1 ring-line hover:bg-canvas">Cancel</Button><Button type="submit">Create group</Button></div></form></dialog></>;
}
