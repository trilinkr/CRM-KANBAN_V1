import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { workspaceSettings } from "@/db/schema";
import { BIRTHDAY_TEMPLATE_KEY, DEFAULT_BIRTHDAY_TEMPLATE } from "@/lib/birthdays";
import { BirthdayTemplateForm } from "@/components/birthday-template-form";
export default async function SettingsPage() {
  await requireAdmin();
  const [setting] = await db.select({ value: workspaceSettings.value }).from(workspaceSettings).where(eq(workspaceSettings.key, BIRTHDAY_TEMPLATE_KEY)).limit(1);
  return <div className="max-w-2xl space-y-6"><div><p className="text-sm text-brand">Administration</p><h1 className="mt-1 text-3xl font-semibold">Settings</h1></div><BirthdayTemplateForm template={setting?.value ?? DEFAULT_BIRTHDAY_TEMPLATE} /></div>;
}
