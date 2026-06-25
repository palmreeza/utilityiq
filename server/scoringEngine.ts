/**
 * Utility IQ — Scoring Engine
 * Calculates domain and overall maturity scores using weighted averages,
 * detects high-variance capabilities, and maps to the EMS maturity levels.
 */

export interface CapabilityScoreInput {
  capabilityId: number;
  capabilityName: string;
  domainId: number;
  capabilityWeight: number;
  scores: Array<{
    userId: number;
    currentScore: number | null;
    targetScore: number | null;
    confidence: "Low" | "Medium" | "High" | null;
  }>;
  consensusCurrentScore?: number | null;
  consensusTargetScore?: number | null;
}

export interface DomainInput {
  domainId: number;
  domainName: string;
  domainWeight: number;
  capabilities: CapabilityScoreInput[];
}

export interface CapabilityResult {
  capabilityId: number;
  capabilityName: string;
  domainId: number;
  currentScore: number;
  targetScore: number;
  gap: number;
  variance: number;
  stdDev: number;
  isHighVariance: boolean;
  responseCount: number;
  usedConsensus: boolean;
}

export interface DomainResult {
  domainId: number;
  domainName: string;
  currentScore: number;
  targetScore: number;
  gap: number;
  capabilityCount: number;
  scoredCapabilityCount: number;
  completionPct: number;
}

export interface ScoringResult {
  overallScore: number;
  overallTargetScore: number;
  overallGap: number;
  emsMaturityLevel: number;
  emsLevelLabel: string;
  domainResults: DomainResult[];
  capabilityResults: CapabilityResult[];
  highVarianceCapabilities: CapabilityResult[];
  totalCapabilities: number;
  scoredCapabilities: number;
  completionPct: number;
}

const CONFIDENCE_WEIGHTS = { High: 1.2, Medium: 1.0, Low: 0.8 };
const HIGH_VARIANCE_THRESHOLD = 1.5; // std dev threshold

function confidenceWeight(c: "Low" | "Medium" | "High" | null): number {
  return CONFIDENCE_WEIGHTS[c ?? "Medium"] ?? 1.0;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function weightedMean(values: number[], weights: number[]): number {
  if (values.length === 0) return 0;
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  if (totalWeight === 0) return 0;
  return values.reduce((sum, v, i) => sum + v * (weights[i] ?? 1), 0) / totalWeight;
}

function clamp(v: number, min = 1, max = 5): number {
  return Math.max(min, Math.min(max, v));
}

function emsLevel(score: number): { level: number; label: string } {
  if (score < 1.5) return { level: 1, label: "See — Energy Visibility" };
  if (score < 2.5) return { level: 2, label: "Understand — Energy Intelligence" };
  if (score < 3.5) return { level: 3, label: "Optimise — Energy Optimisation" };
  if (score < 4.5) return { level: 4, label: "Automate — Energy Orchestration" };
  return { level: 5, label: "Monetise — Market Participation" };
}

export function calculateScores(domains: DomainInput[]): ScoringResult {
  const capabilityResults: CapabilityResult[] = [];
  const domainResults: DomainResult[] = [];

  for (const domain of domains) {
    const domainCapResults: CapabilityResult[] = [];

    for (const cap of domain.capabilities) {
      const validScores = cap.scores.filter(
        (s) => s.currentScore !== null && s.currentScore >= 1 && s.currentScore <= 5
      );

      let currentScore: number;
      let targetScore: number;
      let usedConsensus = false;

      if (cap.consensusCurrentScore != null && cap.consensusTargetScore != null) {
        currentScore = clamp(cap.consensusCurrentScore);
        targetScore = clamp(cap.consensusTargetScore);
        usedConsensus = true;
      } else if (validScores.length > 0) {
        const currentValues = validScores.map((s) => s.currentScore as number);
        const currentWeights = validScores.map((s) => confidenceWeight(s.confidence));
        currentScore = clamp(weightedMean(currentValues, currentWeights));

        const targetValues = validScores
          .filter((s) => s.targetScore != null && s.targetScore >= 1 && s.targetScore <= 5)
          .map((s) => s.targetScore as number);
        targetScore = targetValues.length > 0 ? clamp(mean(targetValues)) : clamp(currentScore + 1);
      } else {
        continue; // no scores yet — skip capability
      }

      const currentValues = validScores.map((s) => s.currentScore as number);
      const sd = stdDev(currentValues);
      const variance = sd * sd;

      const capResult: CapabilityResult = {
        capabilityId: cap.capabilityId,
        capabilityName: cap.capabilityName,
        domainId: domain.domainId,
        currentScore: Math.round(currentScore * 10) / 10,
        targetScore: Math.round(targetScore * 10) / 10,
        gap: Math.round((targetScore - currentScore) * 10) / 10,
        variance: Math.round(variance * 100) / 100,
        stdDev: Math.round(sd * 100) / 100,
        isHighVariance: sd >= HIGH_VARIANCE_THRESHOLD,
        responseCount: validScores.length,
        usedConsensus,
      };

      capabilityResults.push(capResult);
      domainCapResults.push(capResult);
    }

    if (domainCapResults.length > 0) {
      const capWeights = domain.capabilities
        .filter((c) => domainCapResults.find((r) => r.capabilityId === c.capabilityId))
        .map((c) => c.capabilityWeight);
      const currentScores = domainCapResults.map((r) => r.currentScore);
      const targetScores = domainCapResults.map((r) => r.targetScore);

      const domainCurrent = clamp(weightedMean(currentScores, capWeights));
      const domainTarget = clamp(weightedMean(targetScores, capWeights));

      domainResults.push({
        domainId: domain.domainId,
        domainName: domain.domainName,
        currentScore: Math.round(domainCurrent * 100) / 100,
        targetScore: Math.round(domainTarget * 100) / 100,
        gap: Math.round((domainTarget - domainCurrent) * 100) / 100,
        capabilityCount: domain.capabilities.length,
        scoredCapabilityCount: domainCapResults.length,
        completionPct: Math.round((domainCapResults.length / domain.capabilities.length) * 100),
      });
    }
  }

  const totalCaps = domains.reduce((sum, d) => sum + d.capabilities.length, 0);
  const scoredCaps = capabilityResults.length;

  let overallScore = 0;
  let overallTarget = 0;

  if (domainResults.length > 0) {
    const domainWeights = domains
      .filter((d) => domainResults.find((r) => r.domainId === d.domainId))
      .map((d) => d.domainWeight);
    overallScore = clamp(weightedMean(domainResults.map((r) => r.currentScore), domainWeights));
    overallTarget = clamp(weightedMean(domainResults.map((r) => r.targetScore), domainWeights));
  }

  const ems = emsLevel(overallScore);
  const highVariance = capabilityResults.filter((c) => c.isHighVariance);

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    overallTargetScore: Math.round(overallTarget * 100) / 100,
    overallGap: Math.round((overallTarget - overallScore) * 100) / 100,
    emsMaturityLevel: ems.level,
    emsLevelLabel: ems.label,
    domainResults,
    capabilityResults,
    highVarianceCapabilities: highVariance,
    totalCapabilities: totalCaps,
    scoredCapabilities: scoredCaps,
    completionPct: totalCaps > 0 ? Math.round((scoredCaps / totalCaps) * 100) : 0,
  };
}

// ── Roadmap Generator ──────────────────────────────────────────────────────

export interface RoadmapGeneratorInput {
  assessmentId: number;
  capabilityResults: CapabilityResult[];
  domainResults: DomainResult[];
  domainMap: Map<number, { name: string; weight: number }>;
  capabilityMap: Map<number, { name: string; description?: string | null }>;
}

export interface GeneratedRoadmapItem {
  assessmentId: number;
  capabilityId: number;
  domainId: number;
  title: string;
  description: string;
  horizon: "0-3 months" | "3-12 months" | "12-24 months" | "24+ months";
  priority: "Critical" | "High" | "Medium" | "Low";
  priorityScore: number;
  emsPackage: string;
  isAutoGenerated: boolean;
}

function getHorizon(gap: number, currentScore: number): "0-3 months" | "3-12 months" | "12-24 months" | "24+ months" {
  if (gap >= 2 && currentScore <= 2) return "0-3 months";
  if (gap >= 1.5 || currentScore <= 1.5) return "0-3 months";
  if (gap >= 1.0) return "3-12 months";
  if (gap >= 0.5) return "12-24 months";
  return "24+ months";
}

function getPriority(priorityScore: number): "Critical" | "High" | "Medium" | "Low" {
  if (priorityScore >= 8) return "Critical";
  if (priorityScore >= 5) return "High";
  if (priorityScore >= 2.5) return "Medium";
  return "Low";
}

function getEmsPackage(targetScore: number): string {
  if (targetScore <= 1.5) return "Energy Visibility";
  if (targetScore <= 2.5) return "Energy Intelligence";
  if (targetScore <= 3.5) return "Energy Optimisation";
  if (targetScore <= 4.5) return "Energy Orchestration";
  return "Market Participation";
}

export function generateRoadmapItems(input: RoadmapGeneratorInput): GeneratedRoadmapItem[] {
  const items: GeneratedRoadmapItem[] = [];

  for (const cap of input.capabilityResults) {
    if (cap.gap <= 0) continue; // already at or above target

    const domain = input.domainMap.get(cap.domainId);
    const capability = input.capabilityMap.get(cap.capabilityId);
    if (!domain || !capability) continue;

    // Priority score formula: gap × domain_weight × (1 + variance_penalty)
    const domainWeight = domain.weight ?? 1;
    const variancePenalty = cap.isHighVariance ? 0.5 : 0;
    const priorityScore = cap.gap * domainWeight * (1 + variancePenalty);

    const horizon = getHorizon(cap.gap, cap.currentScore);
    const priority = getPriority(priorityScore);
    const emsPackage = getEmsPackage(cap.targetScore);

    items.push({
      assessmentId: input.assessmentId,
      capabilityId: cap.capabilityId,
      domainId: cap.domainId,
      title: `Improve ${capability.name} — ${domain.name}`,
      description: `Current maturity: ${cap.currentScore}/5 → Target: ${cap.targetScore}/5 (gap: ${cap.gap}). ${
        cap.isHighVariance ? "⚠ High assessor variance detected — facilitator consensus recommended. " : ""
      }${capability.description ?? ""}`,
      horizon,
      priority,
      priorityScore: Math.round(priorityScore * 100) / 100,
      emsPackage,
      isAutoGenerated: true,
    });
  }

  // Sort by priority score descending
  items.sort((a, b) => b.priorityScore - a.priorityScore);
  return items;
}
