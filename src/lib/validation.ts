import { z } from "zod";

export const trilinkrEmail = z.string().trim().toLowerCase().email().refine((email) => email.endsWith("@trilinkr.com"), "Use a TriLinkr email address.");
export const loginSchema = z.object({ email: trilinkrEmail, password: z.string().min(1) });
export const passwordSchema = z.string().min(12).max(128).regex(/[A-Z]/, "Use an uppercase letter.").regex(/[a-z]/, "Use a lowercase letter.").regex(/[0-9]/, "Use a number.");
