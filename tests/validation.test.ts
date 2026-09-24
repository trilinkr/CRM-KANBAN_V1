import { describe, expect, it } from "vitest";
import { trilinkrEmail, passwordSchema } from "@/lib/validation";
describe("server validation", () => { it("accepts only TriLinkr email addresses", () => { expect(trilinkrEmail.safeParse("member@trilinkr.com").success).toBe(true); expect(trilinkrEmail.safeParse("member@example.com").success).toBe(false); }); it("requires a strong temporary or new password", () => { expect(passwordSchema.safeParse("Short1").success).toBe(false); expect(passwordSchema.safeParse("A secure password 123").success).toBe(true); }); });
