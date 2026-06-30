import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
  json,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// ============================================================
// USERS
// ============================================================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  platformRole: mysqlEnum("platformRole", ["platform_owner", "member"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// ORGANISATIONS (Tenants)
// ============================================================
export const organisations = mysqlTable("organisations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  industry: varchar("industry", { length: 100 }),
  country: varchar("country", { length: 100 }),
  logoUrl: text("logoUrl"),
  primaryContact: varchar("primaryContact", { length: 255 }),
  primaryEmail: varchar("primaryEmail", { length: 320 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organisation = typeof organisations.$inferSelect;
export type InsertOrganisation = typeof organisations.$inferInsert;

// ============================================================
// ORGANISATION MEMBERS (User-Org role mapping)
// ============================================================
export const organisationMembers = mysqlTable("organisation_members", {
  id: int("id").autoincrement().primaryKey(),
  organisationId: int("organisationId").notNull(),
  userId: int("userId").notNull(),
  orgRole: mysqlEnum("orgRole", [
    "organisation_admin",
    "facilitator",
    "assessor",
    "reviewer",
    "executive_viewer",
  ]).notNull(),
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  isActive: boolean("isActive").default(true).notNull(),
});

export type OrganisationMember = typeof organisationMembers.$inferSelect;
export type InsertOrganisationMember = typeof organisationMembers.$inferInsert;

// ============================================================
// ASSESSMENT TEMPLATES
// ============================================================
export const assessmentTemplates = mysqlTable("assessment_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  version: varchar("version", { length: 20 }).default("1.0").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdByUserId: int("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssessmentTemplate = typeof assessmentTemplates.$inferSelect;
export type InsertAssessmentTemplate = typeof assessmentTemplates.$inferInsert;

// ============================================================
// DOMAINS (8 fixed domains per template)
// ============================================================
export const domains = mysqlTable("domains", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  weight: float("weight").default(1.0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  standardsAlignment: text("standardsAlignment"), // e.g. "ISO 55001, IEC 62056"
});

export type Domain = typeof domains.$inferSelect;
export type InsertDomain = typeof domains.$inferInsert;

// ============================================================
// CAPABILITIES (per domain)
// ============================================================
export const capabilities = mysqlTable("capabilities", {
  id: int("id").autoincrement().primaryKey(),
  domainId: int("domainId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  weight: float("weight").default(1.0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
});

export type Capability = typeof capabilities.$inferSelect;
export type InsertCapability = typeof capabilities.$inferInsert;

// ============================================================
// LEVEL DESCRIPTORS (1-5 per capability)
// ============================================================
export const levelDescriptors = mysqlTable("level_descriptors", {
  id: int("id").autoincrement().primaryKey(),
  capabilityId: int("capabilityId").notNull(),
  level: int("level").notNull(), // 1-5
  label: varchar("label", { length: 100 }).notNull(), // e.g. "Initial", "Developing"
  description: text("description").notNull(),
  evidenceExamples: text("evidenceExamples"),
});

export type LevelDescriptor = typeof levelDescriptors.$inferSelect;
export type InsertLevelDescriptor = typeof levelDescriptors.$inferInsert;

// ============================================================
// ASSESSMENTS
// ============================================================
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  organisationId: int("organisationId").notNull(),
  templateId: int("templateId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  assessmentType: varchar("assessmentType", { length: 100 }).default("Energy Maturity"),
  status: mysqlEnum("status", ["Draft", "In-Progress", "Under Review", "Approved"]).default("Draft").notNull(),
  facilitatorUserId: int("facilitatorUserId"),
  targetCompletionDate: timestamp("targetCompletionDate"),
  approvedAt: timestamp("approvedAt"),
  approvedByUserId: int("approvedByUserId"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assessment = typeof assessments.$inferSelect;
export type InsertAssessment = typeof assessments.$inferInsert;

// ============================================================
// ASSESSMENT PARTICIPANTS
// ============================================================
export const assessmentParticipants = mysqlTable(
  "assessment_participants",
  {
    id: int("id").autoincrement().primaryKey(),
    assessmentId: int("assessmentId").notNull(),
    userId: int("userId").notNull(),
    participantRole: mysqlEnum("participantRole", [
      "facilitator",
      "assessor",
      "reviewer",
      "executive_viewer",
    ]).notNull(),
    addedAt: timestamp("addedAt").defaultNow().notNull(),
  },
  (table) => ({
    uqAssessmentUser: uniqueIndex("uq_ap_assessment_user").on(table.assessmentId, table.userId),
  })
);

export type AssessmentParticipant = typeof assessmentParticipants.$inferSelect;
export type InsertAssessmentParticipant = typeof assessmentParticipants.$inferInsert;

// ============================================================
// SCORE RESPONSES (one per assessor per capability)
// ============================================================
export const scoreResponses = mysqlTable("score_responses", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  capabilityId: int("capabilityId").notNull(),
  userId: int("userId").notNull(),
  currentScore: int("currentScore"), // 1-5
  targetScore: int("targetScore"),   // 1-5
  confidence: mysqlEnum("confidence", ["Low", "Medium", "High"]).default("Medium"),
  justification: text("justification"),
  documentReference: text("documentReference"), // URL or text reference
  isDraft: boolean("isDraft").default(true).notNull(),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScoreResponse = typeof scoreResponses.$inferSelect;
export type InsertScoreResponse = typeof scoreResponses.$inferInsert;

// ============================================================
// CONSENSUS SCORES (facilitator override per capability)
// ============================================================
export const consensusScores = mysqlTable("consensus_scores", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  capabilityId: int("capabilityId").notNull(),
  facilitatorUserId: int("facilitatorUserId").notNull(),
  consensusCurrentScore: int("consensusCurrentScore").notNull(),
  consensusTargetScore: int("consensusTargetScore").notNull(),
  facilitatorNotes: text("facilitatorNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConsensusScore = typeof consensusScores.$inferSelect;
export type InsertConsensusScore = typeof consensusScores.$inferInsert;

// ============================================================
// RESULT SNAPSHOTS (cached scoring engine output)
// ============================================================
export const resultSnapshots = mysqlTable("result_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  overallScore: float("overallScore"),
  overallTargetScore: float("overallTargetScore"),
  domainScores: json("domainScores"), // {domainId, domainName, currentScore, targetScore, gap}[]
  capabilityScores: json("capabilityScores"), // detailed per-capability
  highVarianceCapabilities: json("highVarianceCapabilities"), // flagged items
  emsMaturityLevel: int("emsMaturityLevel"), // 1-5 mapped to EMS playbook
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
  calculatedByUserId: int("calculatedByUserId"),
});

export type ResultSnapshot = typeof resultSnapshots.$inferSelect;
export type InsertResultSnapshot = typeof resultSnapshots.$inferInsert;

// ============================================================
// ROADMAP ITEMS
// ============================================================
export const roadmapItems = mysqlTable("roadmap_items", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  capabilityId: int("capabilityId"),
  domainId: int("domainId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  horizon: mysqlEnum("horizon", ["0-3 months", "3-12 months", "12-24 months", "24+ months"]).notNull(),
  priority: mysqlEnum("priority", ["Critical", "High", "Medium", "Low"]).default("Medium").notNull(),
  priorityScore: float("priorityScore").default(0),
  emsPackage: varchar("emsPackage", { length: 100 }), // maps to EMS playbook level
  status: mysqlEnum("status", ["Pending", "In Progress", "Completed", "Deferred"]).default("Pending").notNull(),
  assignedTo: varchar("assignedTo", { length: 255 }),
  dueDate: timestamp("dueDate"),
  isAutoGenerated: boolean("isAutoGenerated").default(true).notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RoadmapItem = typeof roadmapItems.$inferSelect;
export type InsertRoadmapItem = typeof roadmapItems.$inferInsert;

// ============================================================
// AUDIT LOG
// ============================================================
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId"),
  organisationId: int("organisationId"),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  metadata: json("metadata"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type InsertAuditLogEntry = typeof auditLog.$inferInsert;
