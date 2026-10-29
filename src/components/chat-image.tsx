"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef } from "react";
export function ChatImage({ messageId }: { messageId: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const src = "/api/chat/images/" + messageId;
  return <><button type="button" aria-label="Open attached image" onClick={() => dialog.current?.showModal()} className="my-2 block"><img src={src} alt="Chat attachment" loading="lazy" className="max-h-56 max-w-full rounded-lg object-contain" /></button><dialog ref={dialog} className="max-h-[90dvh] w-[min(1000px,95vw)] overflow-auto rounded-xl bg-white p-3 text-ink backdrop:bg-black/70"><div className="mb-2 flex justify-end"><button type="button" onClick={() => dialog.current?.close()} className="rounded-lg px-3 py-2">Close image</button></div><img src={src} alt="Full chat attachment" className="mx-auto max-h-[75dvh] max-w-full object-contain" /></dialog></>;
}
