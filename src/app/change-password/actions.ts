"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireUser, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { passwordSchema } from "@/lib/validation";
import { audit } from "@/lib/domain";

export async function changePassword(formData: FormData) { const user = await requireUser(); const password = String(formData.get("password") ?? ""); const confirm = String(formData.get("confirmPassword") ?? ""); if (password !== confirm || !passwordSchema.safeParse(password).success) redirect("/change-password?error=invalid"); await db.update(users).set({ passwordHash: await hashPassword(password), forcePasswordChange: false, updatedAt: new Date() }).where(eq(users.id, user.id)); await audit(user.id, "PASSWORD_CHANGED", "USER", user.id); redirect("/dashboard"); }
