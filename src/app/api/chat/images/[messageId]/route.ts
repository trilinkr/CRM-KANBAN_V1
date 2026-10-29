import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatImages, chatMessages, chatRoomMembers } from "@/db/schema";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ messageId: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  const user = await getCurrentUser();
  if (!user || user.forcePasswordChange) return new Response("Unauthorized", { status: 401, headers });
  const parsed = z.string().uuid().safeParse((await params).messageId);
  if (!parsed.success) return new Response("Not found", { status: 404, headers });
  const [image] = await db.select({ data: chatImages.data }).from(chatImages).innerJoin(chatMessages, eq(chatMessages.id, chatImages.messageId)).innerJoin(chatRoomMembers, and(eq(chatRoomMembers.roomId, chatMessages.roomId), eq(chatRoomMembers.userId, user.id))).where(eq(chatImages.messageId, parsed.data)).limit(1);
  if (!image) return new Response("Not found", { status: 404, headers });
  return new Response(new Uint8Array(image.data), { headers: { ...headers, "Content-Type": "image/webp", "Content-Disposition": 'inline; filename="chat-image.webp"' } });
}
