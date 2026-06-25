import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  assessmentParticipants,
  assessmentTemplates,
  assessments,
  auditLog,
  capabilities,
  consensusScores,
  domains,
  InsertAuditLogEntry,
  InsertOrganisation,
  InsertOrganisationMember,
  InsertUser,
  levelDescriptors,
  organisationMembers,
  organisations,
  resultSnapshots,
  roadmapItems,
  scoreResponses,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    values.platformRole = "platform_owner";
    updateSet.role = "admin";
    updateSet.platformRole = "platform_owner";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ── Organisations ──────────────────────────────────────────────────────────

export async function createOrganisation(data: InsertOrganisation) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(organisations).values(data);
  return result;
}

export async function getOrganisations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(organisations).where(eq(organisations.isActive, true)).orderBy(organisations.name);
}

export async function getOrganisationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(organisations).where(eq(organisations.id, id)).limit(1);
  return result[0];
}

export async function updateOrganisation(id: number, data: Partial<InsertOrganisation>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(organisations).set(data).where(eq(organisations.id, id));
}

export async function getOrganisationsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const members = await db
    .select()
    .from(organisationMembers)
    .where(and(eq(organisationMembers.userId, userId), eq(organisationMembers.isActive, true)));
  if (members.length === 0) return [];
  const orgIds = members.map((m) => m.organisationId);
  const orgs = await db.select().from(organisations).where(inArray(organisations.id, orgIds));
  return orgs.map((org) => ({
    ...org,
    role: members.find((m) => m.organisationId === org.id)?.orgRole,
  }));
}

// ── Organisation Members ───────────────────────────────────────────────────

export async function addOrganisationMember(data: InsertOrganisationMember) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(organisationMembers).values(data);
}

export async function getOrganisationMembers(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  const members = await db
    .select()
    .from(organisationMembers)
    .where(and(eq(organisationMembers.organisationId, orgId), eq(organisationMembers.isActive, true)));
  if (members.length === 0) return [];
  const userIds = members.map((m) => m.userId);
  const userList = await db.select().from(users).where(inArray(users.id, userIds));
  return members.map((m) => ({
    ...m,
    user: userList.find((u) => u.id === m.userId),
  }));
}

export async function getUserOrgRole(userId: number, orgId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(organisationMembers)
    .where(
      and(
        eq(organisationMembers.userId, userId),
        eq(organisationMembers.organisationId, orgId),
        eq(organisationMembers.isActive, true)
      )
    )
    .limit(1);
  return result[0];
}

// ── Templates ──────────────────────────────────────────────────────────────

export async function getTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assessmentTemplates).where(eq(assessmentTemplates.isActive, true));
}

export async function getTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(assessmentTemplates).where(eq(assessmentTemplates.id, id)).limit(1);
  return result[0];
}

export async function getTemplateWithDomains(templateId: number) {
  const db = await getDb();
  if (!db) return null;
  const template = await getTemplateById(templateId);
  if (!template) return null;
  const domainList = await db
    .select()
    .from(domains)
    .where(eq(domains.templateId, templateId))
    .orderBy(domains.sortOrder);
  const capabilityList = await db
    .select()
    .from(capabilities)
    .where(inArray(capabilities.domainId, domainList.map((d) => d.id)))
    .orderBy(capabilities.sortOrder);
  const capabilityIds = capabilityList.map((c) => c.id);
  const descriptors =
    capabilityIds.length > 0
      ? await db.select().from(levelDescriptors).where(inArray(levelDescriptors.capabilityId, capabilityIds))
      : [];
  return {
    ...template,
    domains: domainList.map((d) => ({
      ...d,
      capabilities: capabilityList
        .filter((c) => c.domainId === d.id)
        .map((c) => ({
          ...c,
          levelDescriptors: descriptors.filter((ld) => ld.capabilityId === c.id).sort((a, b) => a.level - b.level),
        })),
    })),
  };
}

// ── Assessments ────────────────────────────────────────────────────────────

export async function createAssessment(data: {
  organisationId: number;
  templateId: number;
  name: string;
  description?: string;
  facilitatorUserId?: number;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(assessments).values({
    ...data,
    status: "Draft",
  });
  return result;
}

export async function getAssessmentsForOrg(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(assessments)
    .where(eq(assessments.organisationId, orgId))
    .orderBy(desc(assessments.createdAt));
}

export async function getAssessmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(assessments).where(eq(assessments.id, id)).limit(1);
  return result[0];
}

export async function updateAssessmentStatus(
  id: number,
  status: "Draft" | "In-Progress" | "Under Review" | "Approved",
  extra?: { approvedByUserId?: number; approvedAt?: Date }
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .update(assessments)
    .set({ status, ...extra })
    .where(eq(assessments.id, id));
}

export async function getAssessmentParticipants(assessmentId: number) {
  const db = await getDb();
  if (!db) return [];
  const parts = await db
    .select()
    .from(assessmentParticipants)
    .where(eq(assessmentParticipants.assessmentId, assessmentId));
  if (parts.length === 0) return [];
  const userIds = parts.map((p) => p.userId);
  const userList = await db.select().from(users).where(inArray(users.id, userIds));
  return parts.map((p) => ({ ...p, user: userList.find((u) => u.id === p.userId) }));
}

// ── Scores ─────────────────────────────────────────────────────────────────

export async function upsertScoreResponse(data: {
  assessmentId: number;
  capabilityId: number;
  userId: number;
  currentScore?: number;
  targetScore?: number;
  confidence?: "Low" | "Medium" | "High";
  justification?: string;
  documentReference?: string;
  isDraft?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db
    .select()
    .from(scoreResponses)
    .where(
      and(
        eq(scoreResponses.assessmentId, data.assessmentId),
        eq(scoreResponses.capabilityId, data.capabilityId),
        eq(scoreResponses.userId, data.userId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(scoreResponses)
      .set({
        ...data,
        submittedAt: data.isDraft === false ? new Date() : undefined,
      })
      .where(eq(scoreResponses.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(scoreResponses).values({
      ...data,
      submittedAt: data.isDraft === false ? new Date() : undefined,
    });
    return (result as any).insertId;
  }
}

export async function getScoresForAssessment(assessmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scoreResponses).where(eq(scoreResponses.assessmentId, assessmentId));
}

export async function getScoresForCapability(assessmentId: number, capabilityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(scoreResponses)
    .where(
      and(eq(scoreResponses.assessmentId, assessmentId), eq(scoreResponses.capabilityId, capabilityId))
    );
}

export async function upsertConsensusScore(data: {
  assessmentId: number;
  capabilityId: number;
  facilitatorUserId: number;
  consensusCurrentScore: number;
  consensusTargetScore: number;
  facilitatorNotes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db
    .select()
    .from(consensusScores)
    .where(
      and(
        eq(consensusScores.assessmentId, data.assessmentId),
        eq(consensusScores.capabilityId, data.capabilityId)
      )
    )
    .limit(1);
  if (existing.length > 0) {
    await db.update(consensusScores).set(data).where(eq(consensusScores.id, existing[0].id));
  } else {
    await db.insert(consensusScores).values(data);
  }
}

export async function getConsensusScores(assessmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(consensusScores).where(eq(consensusScores.assessmentId, assessmentId));
}

// ── Results ────────────────────────────────────────────────────────────────

export async function saveResultSnapshot(data: {
  assessmentId: number;
  overallScore: number;
  overallTargetScore: number;
  domainScores: unknown;
  capabilityScores: unknown;
  highVarianceCapabilities: unknown;
  emsMaturityLevel: number;
  calculatedByUserId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(resultSnapshots).values({ ...data, calculatedAt: new Date() });
}

export async function getLatestResultSnapshot(assessmentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(resultSnapshots)
    .where(eq(resultSnapshots.assessmentId, assessmentId))
    .orderBy(desc(resultSnapshots.calculatedAt))
    .limit(1);
  return result[0];
}

// ── Roadmap ────────────────────────────────────────────────────────────────

export async function getRoadmapItems(assessmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(roadmapItems)
    .where(eq(roadmapItems.assessmentId, assessmentId))
    .orderBy(roadmapItems.horizon, desc(roadmapItems.priorityScore));
}

export async function createRoadmapItems(items: Array<{
  assessmentId: number;
  capabilityId?: number;
  domainId?: number;
  title: string;
  description?: string;
  horizon: "0-3 months" | "3-12 months" | "12-24 months" | "24+ months";
  priority: "Critical" | "High" | "Medium" | "Low";
  priorityScore?: number;
  emsPackage?: string;
  isAutoGenerated?: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (items.length === 0) return;
  await db.insert(roadmapItems).values(items);
}

export async function deleteRoadmapItemsForAssessment(assessmentId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(roadmapItems).where(
    and(eq(roadmapItems.assessmentId, assessmentId), eq(roadmapItems.isAutoGenerated, true))
  );
}

export async function updateRoadmapItem(id: number, data: Partial<typeof roadmapItems.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(roadmapItems).set(data).where(eq(roadmapItems.id, id));
}

// ── Audit Log ──────────────────────────────────────────────────────────────

export async function logAuditEvent(data: InsertAuditLogEntry) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLog).values(data);
  } catch (e) {
    console.warn("[AuditLog] Failed to log event:", e);
  }
}

export async function getAuditLog(assessmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(auditLog)
    .where(eq(auditLog.assessmentId, assessmentId))
    .orderBy(desc(auditLog.createdAt))
    .limit(200);
}
