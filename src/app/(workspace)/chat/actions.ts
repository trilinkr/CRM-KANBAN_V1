"use server";

import { and, eq, sql } from "drizzle-orm";
import { chatImages } from "@/db/schema";
import { validateChatImage } from "@/lib/validate-chat-image";
import { MAX_CHAT_STORAGE_BYTES } from "@/lib/chat-image-limits";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { audit, chatMessages, chatRoomMembers, chatRooms, db, notify, users } from "@/lib/domain";

const messageInput = z.object({ roomId: z.string().uuid(), body: z.string().trim().max(4000) });
const privateRoomInput = z.object({ userId: z.string().uuid() });
const groupInput = z.object({ name: z.string().trim().min(2).max(80), memberIds: z.array(z.string().uuid()).max(50) });
const groupNameInput = z.object({ roomId: z.string().uuid(), name: z.string().trim().min(2).max(80) });

async function accessibleRoom(roomId: string, userId: string) {
  return (await db.select({ room: chatRooms }).from(chatRoomMembers).innerJoin(chatRooms, eq(chatRoomMembers.roomId, chatRooms.id)).where(and(eq(chatRoomMembers.roomId, roomId), eq(chatRoomMembers.userId, userId))).limit(1))[0]?.room;
}

export async function sendMessage(_previousState: { ok: boolean; message: string }, formData: FormData) {
  const user = await requireUser();
  const parsed = messageInput.safeParse({ roomId: formData.get("roomId"), body: formData.get("body") });
  if (!parsed.success) return { ok: false, message: "Enter a valid message (up to 4,000 characters)." };
  const attachment = formData.get("image");
  const file = attachment instanceof File && attachment.size > 0 ? attachment : null;
  if (!parsed.data.body && !file) return { ok: false, message: "Add a message or an image." };
  const room = await accessibleRoom(parsed.data.roomId, user.id);
  if (!room) return { ok: false, message: "You are not a member of this conversation." };
  let image: Buffer | null = null;
  if (file) {
    try { image = await validateChatImage(file); }
    catch { return { ok: false, message: "Unable to prepare the image. Use a still JPG, PNG, or WebP under 350 KB and 1,600 pixels." }; }
  }
  const sent = await db.transaction(async (tx) => {
    // Lock the room against deletion until the message and optional image are saved.
    const [currentRoom] = await tx.select({ id: chatRooms.id }).from(chatRooms).where(eq(chatRooms.id, room.id)).for("update");
    if (!currentRoom) return false;
    if (image) {
      await tx.execute(sql`select pg_advisory_xact_lock(736415)`);
      const [usage] = await tx.select({ bytes: sql<number>`coalesce(sum(${chatImages.size}), 0)` }).from(chatImages);
      if (Number(usage.bytes) + image.length > MAX_CHAT_STORAGE_BYTES) return false;
    }
    const [message] = await tx.insert(chatMessages).values({ roomId: room.id, senderUserId: user.id, body: parsed.data.body }).returning({ id: chatMessages.id });
    if (image) await tx.insert(chatImages).values({ messageId: message.id, data: image, size: image.length });
    await tx.update(chatRooms).set({ updatedAt: new Date() }).where(eq(chatRooms.id, room.id));
    return true;
  });
  if (!sent) return { ok: false, message: "Image storage is full or this conversation is no longer available. Remove older image messages or contact your admin." };

  const roomMembers = await db.select({ member: users }).from(chatRoomMembers).innerJoin(users, eq(chatRoomMembers.userId, users.id)).where(eq(chatRoomMembers.roomId, room.id));
  const body = parsed.data.body.toLowerCase();
  await Promise.all(roomMembers.filter(({ member }) => member.id !== user.id && body.includes(`@${member.name.toLowerCase()}`)).map(({ member }) => notify(member.id, "CHAT_MENTION", `${user.name} mentioned you`, `${user.name} mentioned you in ${room.name}.`)));
  revalidatePath("/chat");
  return { ok: true, message: "Message sent." };
}

export async function deleteMessage(formData: FormData) {
  const user = await requireUser();
  const messageId = z.string().uuid().safeParse(formData.get("messageId"));
  if (!messageId.success) throw new Error("Invalid message");
  const message = (await db.select({ message: chatMessages, room: chatRooms }).from(chatMessages).innerJoin(chatRooms, eq(chatMessages.roomId, chatRooms.id)).where(eq(chatMessages.id, messageId.data)).limit(1))[0];
  if (!message) throw new Error("Message not found");
  const room = await accessibleRoom(message.room.id, user.id);
  if (!room || (message.message.senderUserId !== user.id && user.role !== "ADMIN")) throw new Error("You cannot delete this message");
  await db.delete(chatMessages).where(eq(chatMessages.id, message.message.id));
  await db.update(chatRooms).set({ updatedAt: new Date() }).where(eq(chatRooms.id, message.room.id));
  await audit(user.id, "CHAT_MESSAGE_DELETED", "CHAT_MESSAGE", message.message.id, { roomId: message.room.id, deletedByAdmin: user.role === "ADMIN" && message.message.senderUserId !== user.id });
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

export async function createGroupRoom(formData: FormData) {
  const user = await requireUser();
  const parsed = groupInput.safeParse({ name: formData.get("name"), memberIds: formData.getAll("memberIds").map(String) });
  if (!parsed.success) throw new Error("Enter a group name and choose valid members");
  const memberIds = [...new Set([user.id, ...parsed.data.memberIds])];
  const activeMembers = await db.select({ id: users.id }).from(users).where(and(eq(users.active, true)));
  const activeIds = new Set(activeMembers.map((member) => member.id));
  if (memberIds.some((id) => !activeIds.has(id))) throw new Error("One or more selected members are unavailable");
  const room = (await db.insert(chatRooms).values({ name: parsed.data.name, type: "GROUP", createdByUserId: user.id }).returning())[0];
  await db.insert(chatRoomMembers).values(memberIds.map((userId) => ({ roomId: room.id, userId })));
  revalidatePath("/chat");
  redirect(`/chat?room=${room.id}`);
}

export async function updateGroupName(formData: FormData) {
  const user = await requireUser();
  const parsed = groupNameInput.safeParse({ roomId: formData.get("roomId"), name: formData.get("name") });
  if (!parsed.success) throw new Error("Enter a valid group name");
  const room = await accessibleRoom(parsed.data.roomId, user.id);
  if (!room || room.type !== "GROUP") throw new Error("Group not found");
  if (room.createdByUserId !== user.id && user.role !== "ADMIN") throw new Error("Only the group creator or an admin can rename this group");
  await db.update(chatRooms).set({ name: parsed.data.name, updatedAt: new Date() }).where(eq(chatRooms.id, room.id));
  revalidatePath("/chat");
  redirect(`/chat?room=${room.id}`);
}

export async function deleteGroupRoom(formData: FormData) {
  const admin = await requireAdmin();
  const roomId = z.string().uuid().safeParse(formData.get("roomId"));
  if (!roomId.success) throw new Error("Invalid group");
  const room = (await db.select().from(chatRooms).where(eq(chatRooms.id, roomId.data)).limit(1))[0];
  if (!room || room.type !== "GROUP") throw new Error("Group not found");
  await db.delete(chatRooms).where(eq(chatRooms.id, room.id));
  await audit(admin.id, "CHAT_GROUP_DELETED", "CHAT_ROOM", room.id, { name: room.name });
  revalidatePath("/chat");
  redirect("/chat");
}
