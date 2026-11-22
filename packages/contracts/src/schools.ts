import { z } from "zod";

export const schoolTypes = [
  "Primary school",
  "Secondary school",
  "K–12 school",
  "School group",
] as const;

export const schoolWorkspaceIds = [
  "school-admin",
  "teacher",
  "student",
  "parent",
] as const;

export type SchoolWorkspaceId = (typeof schoolWorkspaceIds)[number];

export const schoolApplicationSchema = z.object({
  schoolName: z.string().trim().min(2).max(160),
  location: z.string().trim().min(2).max(160),
  schoolType: z.enum(schoolTypes),
  administratorEmail: z.string().trim().email().max(254),
});

export type CreateSchoolApplicationInput = z.infer<typeof schoolApplicationSchema>;

export const rejectSchoolApplicationSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export type RejectSchoolApplicationInput = z.infer<typeof rejectSchoolApplicationSchema>;

export type SchoolSummary = {
  id: string;
  slug: string;
  name: string;
  location: string;
  schoolCode: string;
  schoolType: string;
};

export type SchoolApplicationSummary = {
  id: string;
  schoolName: string;
  administratorEmail: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  school?: Pick<SchoolSummary, "slug" | "schoolCode"> | null;
};

export type MembershipAccess = {
  allowed: true;
  role: string;
  schoolStatus: "ONBOARDING" | "ACTIVE";
  activationRequired: boolean;
  newlyAccepted: boolean;
  school: Pick<SchoolSummary, "name" | "slug" | "location" | "schoolCode">;
};

export type WorkspaceTone = "mint" | "lavender" | "peach" | "blue";

export type WorkspaceDefinition = {
  id: SchoolWorkspaceId;
  label: string;
  description: string;
  icon: string;
  tone: WorkspaceTone;
};
