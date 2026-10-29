"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db, audit } from "@/lib/domain";
import { workspaceSettings } from "@/db/schema";
import { BIRTHDAY_TEMPLATE_KEY } from "@/lib/birthdays";
export async function saveBirthdayTemplate(_state: { ok: boolean; message: string }, form: FormData) {
  const admin = await requireAdmin();
  const template = z.string().trim().min(1).max(2000).safeParse(form.get("template"));
  if (!template.success) return { ok: false, message: "Enter a birthday message between 1 and 2,000 characters." };
  await db.insert(workspaceSettings).values({ key: BIRTHDAY_TEMPLATE_KEY, value: template.data }).onConflictDoUpdate({ target: workspaceSettings.key, set: { value: template.data, updatedAt: new Date() } });
  await audit(admin.id, "BIRTHDAY_TEMPLATE_UPDATED", "WORKSPACE_SETTINGS", null);
  revalidatePath("/", "layout");
  return { ok: true, message: "Birthday message saved." };
}
