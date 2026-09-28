"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { audit, db, leadAccess, leadComments, leads, users } from "@/lib/domain";
import { canAccessLeadType, type LeadType } from "@/lib/leads";

const leadStatus = z.enum(["NEW", "INTRO_SENT", "FOLLOW_UP", "WHATSAPP", "ONBOARDED", "DROPPED"]);
const leadType = z.enum(["EMPLOYER", "CONSULTANT"]);
const optionalEmail = z.string().trim().email().or(z.literal(""));
const leadInput = z.object({ type: leadType, companyName: z.string().trim().min(1).max(180), contactName: z.string().trim().min(1).max(140), phone: z.string().trim().min(5).max(40), email: optionalEmail, linkedinUrl: z.string().trim().url().or(z.literal("")), status: leadStatus, comments: z.string().trim().max(5000) });

async function requireLeadTypeAccess(userId: string, role: string, type: LeadType) { if (!(await canAccessLeadType(userId, role, type))) throw new Error("You do not have access to this lead segment"); }
async function requireLead(leadId: string) { const lead = (await db.select().from(leads).where(eq(leads.id, leadId)).limit(1))[0]; if (!lead) throw new Error("Lead not found"); return lead; }

export async function createLead(formData: FormData) {
  const user = await requireUser();
  const parsed = leadInput.safeParse({ type: formData.get("type"), companyName: formData.get("companyName"), contactName: formData.get("contactName"), phone: formData.get("phone"), email: formData.get("email") ?? "", linkedinUrl: formData.get("linkedinUrl") ?? "", status: formData.get("status"), comments: formData.get("comments") ?? "" });
  if (!parsed.success) throw new Error("Invalid lead details");
  await requireLeadTypeAccess(user.id, user.role, parsed.data.type);
  const lead = (await db.insert(leads).values({ type: parsed.data.type, companyName: parsed.data.companyName, contactName: parsed.data.contactName, phone: parsed.data.phone, email: parsed.data.email || null, linkedinUrl: parsed.data.linkedinUrl || null, status: parsed.data.status, createdByUserId: user.id }).returning())[0];
  if (parsed.data.comments) await db.insert(leadComments).values({ leadId: lead.id, userId: user.id, body: parsed.data.comments });
  await audit(user.id, "LEAD_CREATED", "LEAD", lead.id, { type: lead.type, status: lead.status });
  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

export async function updateLeadStatus(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("leadId"));
  const status = leadStatus.safeParse(formData.get("status"));
  if (!status.success) throw new Error("Invalid lead status");
  const lead = await requireLead(id);
  await requireLeadTypeAccess(user.id, user.role, lead.type);
  await db.update(leads).set({ status: status.data, updatedAt: new Date() }).where(eq(leads.id, lead.id));
  await audit(user.id, "LEAD_STATUS_CHANGED", "LEAD", lead.id, { from: lead.status, to: status.data });
  revalidatePath("/leads");
  revalidatePath(`/leads/${lead.id}`);
}

export async function addLeadComment(formData: FormData) {
  const user = await requireUser();
  const leadId = String(formData.get("leadId"));
  const body = z.string().trim().min(1).max(5000).safeParse(formData.get("body"));
  if (!body.success) throw new Error("Follow-up comment cannot be empty");
  const lead = await requireLead(leadId);
  await requireLeadTypeAccess(user.id, user.role, lead.type);
  await db.insert(leadComments).values({ leadId, userId: user.id, body: body.data });
  await db.update(leads).set({ updatedAt: new Date() }).where(eq(leads.id, leadId));
  revalidatePath(`/leads/${leadId}`);
}

export async function deleteLeadComment(formData: FormData) {
  const admin = await requireAdmin();
  const commentId = String(formData.get("commentId"));
  const comment = (await db.select().from(leadComments).where(eq(leadComments.id, commentId)).limit(1))[0];
  if (!comment) throw new Error("Comment not found");
  await db.update(leadComments).set({ deletedAt: new Date(), deletedByUserId: admin.id }).where(and(eq(leadComments.id, commentId), eq(leadComments.leadId, comment.leadId)));
  await audit(admin.id, "LEAD_COMMENT_DELETED", "LEAD_COMMENT", comment.id, { leadId: comment.leadId });
  revalidatePath(`/leads/${comment.leadId}`);
}

export async function setLeadAccess(formData: FormData) {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId"));
  const type = leadType.safeParse(formData.get("type"));
  const enabled = formData.get("enabled") === "true";
  if (!type.success || !(await db.select({ id: users.id }).from(users).where(and(eq(users.id, userId), eq(users.active, true))).limit(1))[0]) throw new Error("Invalid team member");
  if (enabled) await db.insert(leadAccess).values({ userId, leadType: type.data, grantedByUserId: admin.id }).onConflictDoNothing();
  else await db.delete(leadAccess).where(and(eq(leadAccess.userId, userId), eq(leadAccess.leadType, type.data)));
  await audit(admin.id, enabled ? "LEAD_ACCESS_GRANTED" : "LEAD_ACCESS_REMOVED", "USER", userId, { leadType: type.data });
  revalidatePath("/team");
  revalidatePath("/leads");
}
