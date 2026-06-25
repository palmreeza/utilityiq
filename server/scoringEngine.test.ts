import { describe, it, expect } from "vitest";
import { calculateScores, generateRoadmapItems } from "./scoringEngine";
import type { DomainInput, RoadmapGeneratorInput } from "./scoringEngine";

// ── Test fixtures ──────────────────────────────────────────────────────────

function makeDomain(overrides: Partial<DomainInput> = {}): DomainInput {
  return {
    domainId: 1,
    domainName: "Meter Management",
    domainWeight: 1,
    capabilities: [
      {
        capabilityId: 1,
        capabilityName: "AMI Deployment",
        domainId: 1,
        capabilityWeight: 1,
        scores: [
          { userId: 1, currentScore: 2, targetScore: 4, confidence: "High" },
          { userId: 2, currentScore: 3, targetScore: 4, confidence: "Medium" },
        ],
      },
    ],
    ...overrides,
  };
}

// ── calculateScores ────────────────────────────────────────────────────────

describe("calculateScores", () => {
  it("returns zero scores for empty domains", () => {
    const result = calculateScores([]);
    expect(result.overallScore).toBe(0);
    expect(result.overallTargetScore).toBe(0);
    expect(result.domainResults).toHaveLength(0);
    expect(result.capabilityResults).toHaveLength(0);
  });

  it("calculates a weighted mean current score for a single capability", () => {
    // User 1 scores 2 (High confidence = 1.2 weight), User 2 scores 3 (Medium = 1.0 weight)
    // weighted mean = (2*1.2 + 3*1.0) / (1.2 + 1.0) = 5.4 / 2.2 ≈ 2.45
    const result = calculateScores([makeDomain()]);
    const cap = result.capabilityResults[0];
    expect(cap).toBeDefined();
    expect(cap!.currentScore).toBeCloseTo(2.5, 0); // rounded to 1dp
    expect(cap!.targetScore).toBe(4);
    expect(cap!.gap).toBeGreaterThan(0);
  });

  it("uses consensus score when provided, ignoring individual scores", () => {
    const domain = makeDomain({
      capabilities: [
        {
          capabilityId: 1,
          capabilityName: "AMI Deployment",
          domainId: 1,
          capabilityWeight: 1,
          scores: [
            { userId: 1, currentScore: 1, targetScore: 5, confidence: "High" },
            { userId: 2, currentScore: 1, targetScore: 5, confidence: "High" },
          ],
          consensusCurrentScore: 3,
          consensusTargetScore: 4,
        },
      ],
    });
    const result = calculateScores([domain]);
    const cap = result.capabilityResults[0];
    expect(cap!.currentScore).toBe(3);
    expect(cap!.targetScore).toBe(4);
    expect(cap!.usedConsensus).toBe(true);
  });

  it("skips capabilities with no valid scores", () => {
    const domain = makeDomain({
      capabilities: [
        {
          capabilityId: 1,
          capabilityName: "No scores",
          domainId: 1,
          capabilityWeight: 1,
          scores: [],
        },
      ],
    });
    const result = calculateScores([domain]);
    expect(result.capabilityResults).toHaveLength(0);
    expect(result.domainResults).toHaveLength(0);
  });

  it("clamps scores to 1–5 range", () => {
    const domain = makeDomain({
      capabilities: [
        {
          capabilityId: 1,
          capabilityName: "Clamped",
          domainId: 1,
          capabilityWeight: 1,
          scores: [{ userId: 1, currentScore: 5, targetScore: 5, confidence: "High" }],
          consensusCurrentScore: 6, // out of range
          consensusTargetScore: 0,  // out of range
        },
      ],
    });
    const result = calculateScores([domain]);
    const cap = result.capabilityResults[0];
    expect(cap!.currentScore).toBe(5);
    expect(cap!.targetScore).toBe(1);
  });

  it("detects high variance when std dev >= 1.5", () => {
    const domain = makeDomain({
      capabilities: [
        {
          capabilityId: 1,
          capabilityName: "High variance cap",
          domainId: 1,
          capabilityWeight: 1,
          scores: [
            { userId: 1, currentScore: 1, targetScore: 4, confidence: "Medium" },
            { userId: 2, currentScore: 5, targetScore: 4, confidence: "Medium" },
            { userId: 3, currentScore: 1, targetScore: 4, confidence: "Medium" },
            { userId: 4, currentScore: 5, targetScore: 4, confidence: "Medium" },
          ],
        },
      ],
    });
    const result = calculateScores([domain]);
    const cap = result.capabilityResults[0];
    expect(cap!.isHighVariance).toBe(true);
    expect(result.highVarianceCapabilities).toHaveLength(1);
  });

  it("maps overall score to correct EMS level", () => {
    // Score of 3.0 should be level 3 — Optimise
    const domain = makeDomain({
      capabilities: [
        {
          capabilityId: 1,
          capabilityName: "Cap",
          domainId: 1,
          capabilityWeight: 1,
          scores: [{ userId: 1, currentScore: 3, targetScore: 4, confidence: "High" }],
        },
      ],
    });
    const result = calculateScores([domain]);
    expect(result.emsMaturityLevel).toBe(3);
    expect(result.emsLevelLabel).toContain("Optimise");
  });

  it("calculates completion percentage correctly", () => {
    const domain: DomainInput = {
      domainId: 1,
      domainName: "Test Domain",
      domainWeight: 1,
      capabilities: [
        {
          capabilityId: 1,
          capabilityName: "Scored",
          domainId: 1,
          capabilityWeight: 1,
          scores: [{ userId: 1, currentScore: 3, targetScore: 4, confidence: "Medium" }],
        },
        {
          capabilityId: 2,
          capabilityName: "Not scored",
          domainId: 1,
          capabilityWeight: 1,
          scores: [],
        },
      ],
    };
    const result = calculateScores([domain]);
    expect(result.completionPct).toBe(50);
    expect(result.scoredCapabilities).toBe(1);
    expect(result.totalCapabilities).toBe(2);
  });

  it("aggregates multiple domains with weighted overall score", () => {
    const domain1: DomainInput = {
      domainId: 1,
      domainName: "Domain A",
      domainWeight: 2, // double weight
      capabilities: [
        {
          capabilityId: 1,
          capabilityName: "Cap A",
          domainId: 1,
          capabilityWeight: 1,
          scores: [{ userId: 1, currentScore: 4, targetScore: 5, confidence: "High" }],
        },
      ],
    };
    const domain2: DomainInput = {
      domainId: 2,
      domainName: "Domain B",
      domainWeight: 1,
      capabilities: [
        {
          capabilityId: 2,
          capabilityName: "Cap B",
          domainId: 2,
          capabilityWeight: 1,
          scores: [{ userId: 1, currentScore: 1, targetScore: 3, confidence: "High" }],
        },
      ],
    };
    const result = calculateScores([domain1, domain2]);
    // Weighted: (4*2 + 1*1) / 3 = 9/3 = 3
    expect(result.overallScore).toBeCloseTo(3.0, 1);
    expect(result.domainResults).toHaveLength(2);
  });
});

// ── generateRoadmapItems ───────────────────────────────────────────────────

describe("generateRoadmapItems", () => {
  const baseInput: RoadmapGeneratorInput = {
    assessmentId: 1,
    capabilityResults: [
      {
        capabilityId: 1,
        capabilityName: "AMI Deployment",
        domainId: 1,
        currentScore: 2,
        targetScore: 4,
        gap: 2,
        variance: 0.25,
        stdDev: 0.5,
        isHighVariance: false,
        responseCount: 2,
        usedConsensus: false,
      },
    ],
    domainResults: [],
    domainMap: new Map([[1, { name: "Meter Management", weight: 1.5 }]]),
    capabilityMap: new Map([[1, { name: "AMI Deployment", description: "Advanced metering infrastructure." }]]),
  };

  it("generates a roadmap item for a capability with a positive gap", () => {
    const items = generateRoadmapItems(baseInput);
    expect(items).toHaveLength(1);
    expect(items[0]!.title).toContain("AMI Deployment");
    expect(items[0]!.assessmentId).toBe(1);
    expect(items[0]!.isAutoGenerated).toBe(true);
  });

  it("skips capabilities with zero or negative gap", () => {
    const input: RoadmapGeneratorInput = {
      ...baseInput,
      capabilityResults: [
        { ...baseInput.capabilityResults[0]!, gap: 0, currentScore: 4, targetScore: 4 },
      ],
    };
    const items = generateRoadmapItems(input);
    expect(items).toHaveLength(0);
  });

  it("assigns a non-Low priority for a meaningful gap with domain weight", () => {
    // priorityScore = gap(2) * weight(1.5) * 1 = 3 → Medium or above
    const items = generateRoadmapItems(baseInput);
    expect(["Critical", "High", "Medium"]).toContain(items[0]!.priority);
    expect(items[0]!.priority).not.toBe("Low");
  });

  it("assigns 0-3 months horizon for large gap at low current score", () => {
    const items = generateRoadmapItems(baseInput); // gap=2, currentScore=2
    expect(items[0]!.horizon).toBe("0-3 months");
  });

  it("assigns 24+ months horizon for small gap at high current score", () => {
    const input: RoadmapGeneratorInput = {
      ...baseInput,
      capabilityResults: [
        { ...baseInput.capabilityResults[0]!, gap: 0.3, currentScore: 4.5, targetScore: 4.8 },
      ],
    };
    const items = generateRoadmapItems(input);
    expect(items[0]!.horizon).toBe("24+ months");
  });

  it("adds variance penalty to priority score when isHighVariance is true", () => {
    const normalInput = baseInput;
    const highVarInput: RoadmapGeneratorInput = {
      ...baseInput,
      capabilityResults: [
        { ...baseInput.capabilityResults[0]!, isHighVariance: true },
      ],
    };
    const normalItems = generateRoadmapItems(normalInput);
    const highVarItems = generateRoadmapItems(highVarInput);
    expect(highVarItems[0]!.priorityScore).toBeGreaterThan(normalItems[0]!.priorityScore);
  });

  it("sorts items by priority score descending", () => {
    const input: RoadmapGeneratorInput = {
      assessmentId: 1,
      capabilityResults: [
        { capabilityId: 1, capabilityName: "Low gap", domainId: 1, currentScore: 4, targetScore: 4.5, gap: 0.5, variance: 0, stdDev: 0, isHighVariance: false, responseCount: 1, usedConsensus: false },
        { capabilityId: 2, capabilityName: "High gap", domainId: 1, currentScore: 1, targetScore: 4, gap: 3, variance: 0, stdDev: 0, isHighVariance: false, responseCount: 1, usedConsensus: false },
      ],
      domainResults: [],
      domainMap: new Map([[1, { name: "Domain", weight: 1 }]]),
      capabilityMap: new Map([
        [1, { name: "Low gap" }],
        [2, { name: "High gap" }],
      ]),
    };
    const items = generateRoadmapItems(input);
    expect(items[0]!.capabilityId).toBe(2); // high gap first
    expect(items[1]!.capabilityId).toBe(1);
  });

  it("maps target score to correct EMS package", () => {
    const items = generateRoadmapItems(baseInput); // targetScore=4 → Energy Orchestration
    expect(items[0]!.emsPackage).toBe("Energy Orchestration");
  });
});
