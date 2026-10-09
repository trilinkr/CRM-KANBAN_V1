"use client";

import { Trash2 } from "lucide-react";
import { deleteMessage } from "@/app/(workspace)/chat/actions";

export function ChatDeleteMessageButton({ messageId, canDelete }: { messageId: string; canDelete: boolean }) {
  if (!canDelete) return null;
  return <form action={deleteMessage} onSubmit={(event) => { if (!window.confirm("Delete this message for everyone?")) event.preventDefault(); }}><input type="hidden" name="messageId" value={messageId} /><button type="submit" aria-label="Delete message for everyone" className="rounded-md p-1 text-current opacity-60 transition hover:opacity-100"><Trash2 size={13} /></button></form>;
}
