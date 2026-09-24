"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { users } from "@/db/schema";

export async function login(formData: FormData) { const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") }); if (!parsed.success) redirect("/login?error=invalid"); const user = (await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1))[0]; if (!user || !user.active || !(await verifyPassword(user.passwordHash, parsed.data.password))) redirect("/login?error=invalid"); await createSession(user.id); redirect(user.forcePasswordChange ? "/change-password" : "/dashboard"); }
