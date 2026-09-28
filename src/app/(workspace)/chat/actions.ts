"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { chatMessages, chatRoomMembers, chatRooms, db, notify, users } from "@/lib/domain";

const messageInput = z.object({ roomId: z.string().uuid(), body: z.string().trim().min(1, "Message cannot be empty").max(4000) });
const privateRoomInput = z.object({ userId: z.string().uuid() });

async function accessibleRoom(roomId: string, userId: string) {
  return (await db.select({ room: chatRooms }).from(chatRoomMembers).innerJoin(chatRooms, eq(chatRoomMembers.roomId, chatRooms.id)).where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, userId))).limit(1))[0]?.room;
}

export async function sendMessage(formData: FormData) {
  const user = await requireUser();
  const parsed = messageInput.safeParse({ roomId: formData.get("roomId"), body: formData.get("body") });
  if (!parsed.success) throw new Error("Invalid chat message");
  const room = await accessibleRoom(parsed.data.roomId, user.id);
  if (!room) throw new Error("You are not a member of this conversation");
  await db.insert(chatMessages).values({ roomId: room.id, senderUserId: user.id, body: parsed.data.body });
  await db.update(chatRooms).set({ updatedAt: new Date() }).where(eq(chatRooms.id, room.id));

  const roomMembers = await db.select({ member: users }).from(chatRoomMembers).innerJoin(users, eq(chatRoomMembers.userId, users.id)).where(eq(chatRoomMembers.roomId, room.id));
  const body = parsed.data.body.toLowerCase();
  await Promise.all(roomMembers.filter(({ member }) => member.id !== user.id && body.includes(`@${member.name.toLowerCase()}`)).map(({ member }) => notify(member.id, "CHAT_MENTION", `${user.name} mentioned you`, `${user.name} mentioned you in ${room.name}.`)));
  revalidatePath("/chat");
}

export async function createPrivateRoom(formData: FormData) {
  const user = await requireUser();
  const parsed = privateRoomInput.safeParse({ userId: formData.get("userId") });
  if (!parsed.success || parsed.data.userId === user.id) throw new Error("Choose another active team member");
  const target = (await db.select().from(users).where(and(eq(users.id, parsed.data.userId), eq(users.active, true))).limit(1))[0];
  if (!target) throw new Error("Team member not found");
  const directKey = [user.id, target.id].sort().join(":");
  let room = (await db.select().from(chatRooms).where(eq(chatRooms.directKey, directKey)).limit(1))[0];
  if (!room) {
    room = (await db.insert(chatRooms).values({ name: target.name, type: "PRIVATE", directKey, createdByUserId: user.id }).returning())[0];
    await db.insert(chatRoomMembers).values([{ roomId: room.id, userId: user.id }, { roomId: room.id, userId: target.id }]);
  }
  revalidatePath("/chat");
  redirect(`/chat?room=${room.id}`);
}
