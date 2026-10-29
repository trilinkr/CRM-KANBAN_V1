"use client";
/* eslint-disable @next/next/no-img-element */
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import { Button } from "@/components/ui";
import { sendMessage } from "@/app/(workspace)/chat/actions";
import { compressChatImage } from "@/lib/compress-chat-image";
type Member = { id: string; name: string; email: string };
export function ChatComposer({ roomId, members }: { roomId: string; members: Member[] }) {
  const [body, setBody] = useState("");
  const [image, setImage] = useState<Blob | null>(null);
  const [preview, setPreview] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [imageError, setImageError] = useState("");
  const picker = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(async (previous: { ok: boolean; message: string }, data: FormData) => {
    if (image) data.set("image", image, "image.webp");
    try {
      const result = await sendMessage(previous, data);
      if (result.ok) { setBody(""); setImage(null); setImageError(""); }
      return result;
    } catch { return { ok: false, message: "Message could not be sent. Your draft is kept; please try again." }; }
  }, { ok: false, message: "" });
  useEffect(() => {
    if (!image) { setPreview(""); return; }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);
  const mentionMatch = body.match(/(?:^|\s)@([^\s@]*)$/);
  const query = mentionMatch?.[1]?.toLowerCase() ?? "";
  const suggestions = useMemo(() => mentionMatch ? members.filter((member) => member.name.toLowerCase().startsWith(query)).slice(0, 6) : [], [members, mentionMatch, query]);
  function chooseMention(member: Member) {
    if (!mentionMatch) return;
    const start = body.slice(0, mentionMatch.index ?? 0);
    const prefix = start && !start.endsWith(" ") ? start + " " : start;
    setBody(prefix + "@" + member.name + " ");
  }
  async function selectImage(file: File | undefined) {
    if (!file) return;
    setPreparing(true); setImageError("");
    try { setImage(await compressChatImage(file)); }
    catch (error) { setImageError(error instanceof Error ? error.message : "Could not prepare this image."); }
    finally { setPreparing(false); if (picker.current) picker.current.value = ""; }
  }
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (!preparing && !isPending) event.currentTarget.form?.requestSubmit();
    }
  }
  return <div className="shrink-0 border-t border-line bg-white p-4">{image && preview && <div className="mb-2 flex items-center gap-3"><img src={preview} alt="Attachment preview" className="h-16 w-20 rounded-lg border border-line object-contain" /><span className="text-xs text-muted">{Math.ceil(image.size / 1024)} KB · compressed image</span><button type="button" disabled={isPending} aria-label="Remove attachment" onClick={() => setImage(null)} className="rounded-lg p-2 text-muted"><X size={16} /></button></div>}<form action={formAction} className="relative flex items-end gap-3"><input type="hidden" name="roomId" value={roomId} /><input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={preparing || isPending} onChange={(event) => void selectImage(event.target.files?.[0])} aria-label="Choose image attachment" /><button type="button" disabled={preparing || isPending} onClick={() => picker.current?.click()} aria-label="Attach image" title="Attach image (compressed automatically)" className="h-11 shrink-0 rounded-lg p-2 text-brand hover:bg-accent disabled:opacity-40"><ImagePlus size={20} /></button><div className="relative min-w-0 flex-1"><textarea name="body" required={!image} maxLength={4000} rows={3} value={body} disabled={isPending} onChange={(event) => setBody(event.target.value)} onKeyDown={handleKeyDown} placeholder="Write a message or attach an image…" aria-label="Chat message" className="max-h-40 w-full resize-y rounded-lg border border-line bg-white px-3 py-2.5 text-sm leading-6 outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-accent" />{suggestions.length > 0 && <div className="absolute bottom-full left-0 z-10 mb-2 w-full max-w-sm overflow-hidden rounded-xl border border-line bg-white p-1 shadow-xl" aria-label="People to mention">{suggestions.map((member) => <button key={member.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseMention(member)} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-accent"><span className="block text-sm font-semibold">{member.name}</span><span className="block text-xs text-muted">{member.email}</span></button>)}</div>}</div><Button type="submit" disabled={isPending || preparing} aria-label="Send message" className="h-11 shrink-0 px-4"><Send size={17} /></Button></form><p className="mt-2 text-xs text-muted">{preparing ? "Compressing image…" : "Enter for a new line · Ctrl/⌘+Enter to send · @ to mention · JPG, PNG, WebP"}</p>{imageError && <p role="alert" className="mt-2 text-xs text-red-700">{imageError}</p>}{state.message && !state.ok && <p role="alert" className="mt-2 text-xs text-red-700">{state.message}</p>}</div>;
}
