"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { sendMessage } from "@/app/(workspace)/chat/actions";

type Member = { id: string; name: string; email: string };

export function ChatComposer({ roomId, members }: { roomId: string; members: Member[] }) {
  const [body, setBody] = useState("");
  const mentionMatch = body.match(/(?:^|\s)@([^\s@]*)$/);
  const query = mentionMatch?.[1]?.toLowerCase() ?? "";
  const suggestions = useMemo(() => mentionMatch ? members.filter((member) => member.name.toLowerCase().startsWith(query)).slice(0, 6) : [], [members, mentionMatch, query]);

  function chooseMention(member: Member) {
    if (!mentionMatch) return;
    const start = body.slice(0, mentionMatch.index ?? 0);
    const prefix = start && !start.endsWith(" ") ? `${start} ` : start;
    setBody(`${prefix}@${member.name} `);
  }

  return <div className="border-t border-line bg-white p-4"><form action={sendMessage} className="relative flex items-end gap-3"><input type="hidden" name="roomId" value={roomId} /><div className="relative flex-1"><Input name="body" required maxLength={4000} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a message… Use @Name to mention someone" aria-label="Chat message" />{suggestions.length > 0 && <div className="absolute bottom-full left-0 z-10 mb-2 w-full max-w-sm overflow-hidden rounded-xl border border-line bg-white p-1 shadow-xl" aria-label="People to mention">{suggestions.map((member) => <button key={member.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseMention(member)} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-accent"><span className="block text-sm font-semibold">{member.name}</span><span className="block text-xs text-muted">{member.email}</span></button>)}</div>}</div><Button type="submit" aria-label="Send message" className="h-11 shrink-0 px-4"><Send size={17} /></Button></form><p className="mt-2 text-xs text-muted">Type <span className="font-semibold text-brand">@</span> and a name to mention a teammate.</p></div>;
}
