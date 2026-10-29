"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui";
import { sendMessage } from "@/app/(workspace)/chat/actions";

type Member = { id: string; name: string; email: string };

export function ChatComposer({ roomId, members }: { roomId: string; members: Member[] }) {
  const [body, setBody] = useState("");
  const [draftBeforeSend, setDraftBeforeSend] = useState("");
  const [state, formAction, isPending] = useActionState(sendMessage, { ok: false, message: "" });
  useEffect(() => {
    if (isPending) return;
    if (state.ok) setDraftBeforeSend("");
    else if (state.message && draftBeforeSend) {
      setBody(draftBeforeSend);
      setDraftBeforeSend("");
    }
  }, [draftBeforeSend, isPending, state.message, state.ok]);
  const mentionMatch = body.match(/(?:^|\s)@([^\s@]*)$/);
  const query = mentionMatch?.[1]?.toLowerCase() ?? "";
  const suggestions = useMemo(() => mentionMatch ? members.filter((member) => member.name.toLowerCase().startsWith(query)).slice(0, 6) : [], [members, mentionMatch, query]);

  function chooseMention(member: Member) {
    if (!mentionMatch) return;
    const start = body.slice(0, mentionMatch.index ?? 0);
    const prefix = start && !start.endsWith(" ") ? `${start} ` : start;
    setBody(`${prefix}@${member.name} `);
  }

  function submit(formData: FormData) {
    setDraftBeforeSend(body);
    setBody("");
    formAction(formData);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return <div className="shrink-0 border-t border-line bg-white p-4"><form action={submit} className="relative flex items-end gap-3"><input type="hidden" name="roomId" value={roomId} /><div className="relative flex-1"><textarea name="body" required maxLength={4000} rows={3} value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={handleKeyDown} placeholder="Write a message… Use @Name to mention someone" aria-label="Chat message" className="max-h-40 w-full resize-y rounded-lg border border-line bg-white px-3 py-2.5 text-sm leading-6 outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-accent" />{suggestions.length > 0 && <div className="absolute bottom-full left-0 z-10 mb-2 w-full max-w-sm overflow-hidden rounded-xl border border-line bg-white p-1 shadow-xl" aria-label="People to mention">{suggestions.map((member) => <button key={member.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseMention(member)} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-accent"><span className="block text-sm font-semibold">{member.name}</span><span className="block text-xs text-muted">{member.email}</span></button>)}</div>}</div><Button type="submit" disabled={isPending} aria-label="Send message" className="h-11 shrink-0 px-4"><Send size={17} /></Button></form><p className="mt-2 text-xs text-muted">Enter for a new line · Ctrl/⌘+Enter to send · Type <span className="font-semibold text-brand">@</span> and a name to mention a teammate.</p>{state.message && !state.ok && <p role="alert" className="mt-2 text-xs text-red-700">{state.message}</p>}</div>;
}
