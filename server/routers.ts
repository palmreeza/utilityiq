import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  addOrganisationMember,
  removeOrganisationMember,
  createAssessment,
  createRoadmapItems,
  deleteRoadmapItemsForAssessment,
  getAllUsers,
  getAssessmentById,
  getAssessmentParticipants,
  getAssessmentsForOrg,
  getAuditLog,
  getConsensusScores,
  getLatestResultSnapshot,
  getOrganisationById,
  getOrganisationMembers,
  getOrganisations,
  getOrganisationsForUser,
  getRoadmapItems,
  getScoresForAssessment,
  getScoresForCapability,
  getTemplateWithDomains,
  getTemplates,
  getUserOrgRole,
  logAuditEvent,
  saveResultSnapshot,
  updateAssessmentStatus,
  updateOrganisation,
  updateRoadmapItem,
  upsertConsensusScore,
  upsertScoreResponse,
  getDb,
} from "./db";
import { calculateScores, generateRoadmapItems } from "./scoringEngine";
import { DEFAULT_TEMPLATE, DOMAINS } from "./seedTemplate";

import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import {
  assessmentTemplates,
  assessmentParticipants,
  capabilities,
  domains,
  levelDescriptors,
  organisations,
  organisationMembers,
} from "../drizzle/schema";

// ── Helpers ────────────────────────────────────────────────────────────────

async function requireOrgAccess(userId: number, orgId: number, allowedRoles?: string[]) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const { eq } = await import("drizzle-orm");
  const { users } = await import("../drizzle/schema");
  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = userRows[0];
  if (user?.platformRole === "platform_owner") return true;
  const membership = await getUserOrgRole(userId, orgId);
  if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this organisation" });
  if (allowedRoles && !allowedRoles.includes(membership.orgRole)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient role for this action" });
  }
  return membership;
}

// ── App Router ─────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
  }),

  // ── Organisations ────────────────────────────────────────────────────────
  organisations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.platformRole === "platform_owner") {
        return getOrganisations();
      }
      return getOrganisationsForUser(ctx.user.id);
    }),

    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      if (ctx.user.platformRole !== "platform_owner" && ctx.user.role !== "admin") {
        await requireOrgAccess(ctx.user.id, input.id);
      }
      return getOrganisationById(input.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(2),
          slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
          industry: z.string().optional(),
          country: z.string().optional(),
          primaryContact: z.string().optional(),
          primaryEmail: z.string().email().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.platformRole !== "platform_owner" && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const result = await db.insert(organisations).values({ ...input, isActive: true });
        const orgId = (result as any).insertId;
        // Add creator as org admin
        await addOrganisationMember({
          organisationId: orgId,
          userId: ctx.user.id,
          orgRole: "organisation_admin",
          isActive: true,
        });
        await logAuditEvent({
          organisationId: orgId,
          userId: ctx.user.id,
          action: "organisation.created",
          entityType: "organisation",
          entityId: orgId,
          metadata: { name: input.name },
        });
        return { id: orgId };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          industry: z.string().optional(),
          country: z.string().optional(),
          primaryContact: z.string().optional(),
          primaryEmail: z.string().email().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await requireOrgAccess(ctx.user.id, input.id, ["organisation_admin"]);
        const { id, ...data } = input;
        await updateOrganisation(id, data);
        return { success: true };
      }),

    members: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.platformRole !== "platform_owner" && ctx.user.role !== "admin") {
          await requireOrgAccess(ctx.user.id, input.orgId);
        }
        return getOrganisationMembers(input.orgId);
      }),

    addMember: protectedProcedure
      .input(
        z.object({
          orgId: z.number(),
          userId: z.number(),
          orgRole: z.enum(["organisation_admin", "facilitator", "assessor", "reviewer", "executive_viewer"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Platform owners can manage any org; org admins can manage their own org
        if (ctx.user.platformRole !== "platform_owner" && ctx.user.role !== "admin") {
          await requireOrgAccess(ctx.user.id, input.orgId, ["organisation_admin"]);
        }
        await addOrganisationMember({
          organisationId: input.orgId,
          userId: input.userId,
          orgRole: input.orgRole,
          isActive: true,
        });
        await logAuditEvent({
          organisationId: input.orgId,
          userId: ctx.user.id,
          action: "member.added",
          entityType: "user",
          entityId: input.userId,
          metadata: { role: input.orgRole },
        });
                return { success: true };
      }),

    removeMember: protectedProcedure
      .input(z.object({ orgId: z.number(), userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.platformRole !== "platform_owner" && ctx.user.role !== "admin") {
          await requireOrgAccess(ctx.user.id, input.orgId, ["organisation_admin"]);
        }
        await removeOrganisationMember(input.orgId, input.userId);
        await logAuditEvent({
          organisationId: input.orgId,
          userId: ctx.user.id,
          action: "member.removed",
          entityType: "user",
          entityId: input.userId,
          metadata: {},
        });
        return { success: true };
      }),
    myRole: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Platform owners have implicit admin access to all orgs
        if (ctx.user.platformRole === "platform_owner") {
          return { orgRole: "organisation_admin" as const, isPlatformOwner: true };
        }
        const membership = await getUserOrgRole(ctx.user.id, input.orgId);
        if (!membership) return null;
        return { orgRole: membership.orgRole, isPlatformOwner: false };
      }),
  }),
  // ── Templates ────────────────────────────────────────────────────────────
  templates: router({
    list: protectedProcedure.query(() => getTemplates()),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getTemplateWithDomains(input.id)),

    seed: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.platformRole !== "platform_owner" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check if default template already exists
      const existing = await getTemplates();
      if (existing.some((t) => t.isDefault)) {
        return { message: "Default template already seeded", templateId: existing.find((t) => t.isDefault)?.id };
      }

      const templateResult = await db.insert(assessmentTemplates).values({
        ...DEFAULT_TEMPLATE,
        createdByUserId: ctx.user.id,
      });
      const templateId = (templateResult as any).insertId;

      for (const domainData of DOMAINS) {
        const { capabilities: caps, ...domainFields } = domainData;
        const domainResult = await db.insert(domains).values({ ...domainFields, templateId });
        const domainId = (domainResult as any).insertId;

        for (let ci = 0; ci < caps.length; ci++) {
          const { levels, ...capFields } = caps[ci];
          const capResult = await db.insert(capabilities).values({
            ...capFields,
            domainId,
            sortOrder: ci,
          });
          const capId = (capResult as any).insertId;

          const levelLabels = ["Initial", "Developing", "Defined", "Managed", "Optimising"];
          for (let li = 0; li < levels.length; li++) {
            await db.insert(levelDescriptors).values({
              capabilityId: capId,
              level: li + 1,
              label: levelLabels[li] ?? `Level ${li + 1}`,
              description: levels[li].description,
            });
          }
        }
      }

      return { message: "Default template seeded successfully", templateId };
    }),
  }),

  // ── Assessments ──────────────────────────────────────────────────────────
  assessments: router({
    list: protectedProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ ctx, input }) => {
        await requireOrgAccess(ctx.user.id, input.orgId);
        return getAssessmentsForOrg(input.orgId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const assessment = await getAssessmentById(input.id);
        if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAccess(ctx.user.id, assessment.organisationId);
        return assessment;
      }),

    create: protectedProcedure
      .input(
        z.object({
          orgId: z.number(),
          templateId: z.number(),
          name: z.string().min(3),
          description: z.string().optional(),
          facilitatorUserId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.platformRole !== "platform_owner" && ctx.user.role !== "admin") {
          await requireOrgAccess(ctx.user.id, input.orgId, ["organisation_admin", "facilitator"]);
        }
        const assessmentId = await createAssessment({
          organisationId: input.orgId,
          templateId: input.templateId,
          name: input.name,
          description: input.description,
          facilitatorUserId: input.facilitatorUserId,
          createdByUserId: ctx.user.id,
        });
        // Auto-add all org members as participants so they can score immediately
        const db2 = await getDb();
        if (db2) {
          const orgMembers = await getOrganisationMembers(input.orgId);
          for (const member of orgMembers) {
            const role = member.orgRole === "organisation_admin" || member.orgRole === "facilitator"
              ? "facilitator"
              : member.orgRole === "reviewer"
              ? "reviewer"
              : "assessor";
            await db2.insert(assessmentParticipants).values({
              assessmentId,
              userId: member.userId,
              participantRole: role,
            }).onDuplicateKeyUpdate({ set: { participantRole: role } });
          }
          // Also ensure the creator is added (in case they are platform_owner not in org members)
          await db2.insert(assessmentParticipants).values({
            assessmentId,
            userId: ctx.user.id,
            participantRole: "facilitator",
          }).onDuplicateKeyUpdate({ set: { participantRole: "facilitator" } });
        }
        await logAuditEvent({
          assessmentId,
          organisationId: input.orgId,
          userId: ctx.user.id,
          action: "assessment.created",
          entityType: "assessment",
          entityId: assessmentId,
          metadata: { name: input.name },
        });
        return { id: assessmentId };
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["Draft", "In-Progress", "Under Review", "Approved"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const assessment = await getAssessmentById(input.id);
        if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
        // platform_owner bypassed inside requireOrgAccess; assessors may also start/submit
        await requireOrgAccess(ctx.user.id, assessment.organisationId, ["organisation_admin", "facilitator", "assessor"]);
        const extra =
          input.status === "Approved"
            ? { approvedByUserId: ctx.user.id, approvedAt: new Date() }
            : undefined;
        await updateAssessmentStatus(input.id, input.status, extra);
        await logAuditEvent({
          assessmentId: input.id,
          organisationId: assessment.organisationId,
          userId: ctx.user.id,
          action: `assessment.status.${input.status.toLowerCase().replace(" ", "_")}`,
          entityType: "assessment",
          entityId: input.id,
          metadata: { status: input.status },
        });
        return { success: true };
      }),

    participants: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAccess(ctx.user.id, assessment.organisationId);
        return getAssessmentParticipants(input.assessmentId);
      }),
  }),

  // ── Scoring ──────────────────────────────────────────────────────────────
  scoring: router({
    submitScore: protectedProcedure
      .input(
        z.object({
          assessmentId: z.number(),
          capabilityId: z.number(),
          currentScore: z.number().min(1).max(5).optional(),
          targetScore: z.number().min(1).max(5).optional(),
          confidence: z.enum(["Low", "Medium", "High"]).optional(),
          justification: z.string().optional(),
          documentReference: z.string().optional(),
          isDraft: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAccess(ctx.user.id, assessment.organisationId);
        const id = await upsertScoreResponse({ ...input, userId: ctx.user.id });
        await logAuditEvent({
          assessmentId: input.assessmentId,
          organisationId: assessment.organisationId,
          userId: ctx.user.id,
          action: input.isDraft === false ? "score.submitted" : "score.saved",
          entityType: "capability",
          entityId: input.capabilityId,
          metadata: { currentScore: input.currentScore, targetScore: input.targetScore },
        });
        return { id };
      }),

    getScores: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAccess(ctx.user.id, assessment.organisationId);
        return getScoresForAssessment(input.assessmentId);
      }),

    getCapabilityScores: protectedProcedure
      .input(z.object({ assessmentId: z.number(), capabilityId: z.number() }))
      .query(async ({ ctx, input }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAccess(ctx.user.id, assessment.organisationId);
        return getScoresForCapability(input.assessmentId, input.capabilityId);
      }),

    setConsensus: protectedProcedure
      .input(
        z.object({
          assessmentId: z.number(),
          capabilityId: z.number(),
          consensusCurrentScore: z.number().min(1).max(5),
          consensusTargetScore: z.number().min(1).max(5),
          facilitatorNotes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAccess(ctx.user.id, assessment.organisationId, ["organisation_admin", "facilitator"]);
        await upsertConsensusScore({ ...input, facilitatorUserId: ctx.user.id });
        await logAuditEvent({
          assessmentId: input.assessmentId,
          organisationId: assessment.organisationId,
          userId: ctx.user.id,
          action: "consensus.set",
          entityType: "capability",
          entityId: input.capabilityId,
          metadata: {
            consensusCurrentScore: input.consensusCurrentScore,
            consensusTargetScore: input.consensusTargetScore,
          },
        });
        return { success: true };
      }),
  }),

  // ── Results ──────────────────────────────────────────────────────────────
  results: router({
    calculate: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAccess(ctx.user.id, assessment.organisationId);

        const template = await getTemplateWithDomains(assessment.templateId);
        if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });

        const allScores = await getScoresForAssessment(input.assessmentId);
        const consensusScoresList = await getConsensusScores(input.assessmentId);

        const domainInputs = template.domains.map((d) => ({
          domainId: d.id,
          domainName: d.name,
          domainWeight: d.weight,
          capabilities: d.capabilities.map((c) => {
            const consensus = consensusScoresList.find((cs) => cs.capabilityId === c.id);
            return {
              capabilityId: c.id,
              capabilityName: c.name,
              domainId: d.id,
              capabilityWeight: c.weight,
              scores: allScores
                .filter((s) => s.capabilityId === c.id)
                .map((s) => ({
                  userId: s.userId,
                  currentScore: s.currentScore,
                  targetScore: s.targetScore,
                  confidence: s.confidence,
                })),
              consensusCurrentScore: consensus?.consensusCurrentScore ?? null,
              consensusTargetScore: consensus?.consensusTargetScore ?? null,
            };
          }),
        }));

        const result = calculateScores(domainInputs);

        await saveResultSnapshot({
          assessmentId: input.assessmentId,
          overallScore: result.overallScore,
          overallTargetScore: result.overallTargetScore,
          domainScores: result.domainResults,
          capabilityScores: result.capabilityResults,
          highVarianceCapabilities: result.highVarianceCapabilities,
          emsMaturityLevel: result.emsMaturityLevel,
          calculatedByUserId: ctx.user.id,
        });

        await logAuditEvent({
          assessmentId: input.assessmentId,
          organisationId: assessment.organisationId,
          userId: ctx.user.id,
          action: "results.calculated",
          entityType: "assessment",
          entityId: input.assessmentId,
          metadata: { overallScore: result.overallScore, emsLevel: result.emsMaturityLevel },
        });

        return result;
      }),

    getSnapshot: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAccess(ctx.user.id, assessment.organisationId);
        return getLatestResultSnapshot(input.assessmentId);
      }),
  }),

  // ── Roadmap ──────────────────────────────────────────────────────────────
  roadmap: router({
    generate: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAccess(ctx.user.id, assessment.organisationId, ["organisation_admin", "facilitator"]);

        const snapshot = await getLatestResultSnapshot(input.assessmentId);
        if (!snapshot) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Calculate results first" });

        const template = await getTemplateWithDomains(assessment.templateId);
        if (!template) throw new TRPCError({ code: "NOT_FOUND" });

        const domainMap = new Map(template.domains.map((d) => [d.id, { name: d.name, weight: d.weight }]));
        const capabilityMap = new Map(
          template.domains.flatMap((d) => d.capabilities.map((c) => [c.id, { name: c.name, description: c.description }]))
        );

        const capabilityResults = (snapshot.capabilityScores as any[]) ?? [];

        await deleteRoadmapItemsForAssessment(input.assessmentId);

        const items = generateRoadmapItems({
          assessmentId: input.assessmentId,
          capabilityResults,
          domainResults: (snapshot.domainScores as any[]) ?? [],
          domainMap,
          capabilityMap,
        });

        if (items.length > 0) await createRoadmapItems(items);

        await logAuditEvent({
          assessmentId: input.assessmentId,
          organisationId: assessment.organisationId,
          userId: ctx.user.id,
          action: "roadmap.generated",
          entityType: "assessment",
          entityId: input.assessmentId,
          metadata: { itemCount: items.length },
        });

        return { generated: items.length };
      }),

    list: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAccess(ctx.user.id, assessment.organisationId);
        return getRoadmapItems(input.assessmentId);
      }),

    updateItem: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          assessmentId: z.number(),
          status: z.enum(["Pending", "In Progress", "Completed", "Deferred"]).optional(),
          assignedTo: z.string().optional(),
          horizon: z.enum(["0-3 months", "3-12 months", "12-24 months", "24+ months"]).optional(),
          priority: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAccess(ctx.user.id, assessment.organisationId, ["organisation_admin", "facilitator"]);
        const { id, assessmentId, ...data } = input;
        await updateRoadmapItem(id, data);
        return { success: true };
      }),
  }),

  // ── Audit Log ────────────────────────────────────────────────────────────
  audit: router({
    list: protectedProcedure
      .input(z.object({ assessmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const assessment = await getAssessmentById(input.assessmentId);
        if (!assessment) throw new TRPCError({ code: "NOT_FOUND" });
        await requireOrgAccess(ctx.user.id, assessment.organisationId);
        const entries = await getAuditLog(input.assessmentId);
        return entries;
      }),
  }),

  // ── Admin ────────────────────────────────────────────────────────────────
  admin: router({
    users: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.platformRole !== "platform_owner" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getAllUsers();
    }),

    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.platformRole !== "platform_owner" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const [orgs, usersList] = await Promise.all([getOrganisations(), getAllUsers()]);
      return { orgs: orgs.length, users: usersList.length };
    }),
  }),
});

export type AppRouter = typeof appRouter;
