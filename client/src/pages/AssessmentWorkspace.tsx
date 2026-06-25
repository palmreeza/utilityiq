import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  ArrowLeft, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  Info, Save, BarChart3, Map, FileText, Clock, Shield
} from "lucide-react";
import { STATUS_CONFIG, MATURITY_LABELS } from "../../../shared/types";
import type { AssessmentStatus, ConfidenceLevel } from "../../../shared/types";

const DOMAIN_ICONS: Record<string, React.ElementType> = {
  "Meter Management": () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  "Billing": () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>,
  "Asset Operations": () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  "Analytics": () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>,
  "Cybersecurity": () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  "Sustainability": () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M2 22c1.25-1.25 2.5-2.5 3.75-2.5 2.5 0 2.5 2.5 5 2.5s2.5-2.5 5-2.5 2.5 2.5 3.75 2.5"/><path d="M12 2a4 4 0 0 1 4 4c0 4-4 6-4 10"/></svg>,
  "Customer Engagement": () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  "Smart Infrastructure": () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
};

const LEVEL_COLORS = ["", "#ef4444", "#f97316", "#FFC000", "#22c55e", "#3b82f6"];

function ScoreButton({ level, selected, type, onClick }: {
  level: number; selected: boolean; type: "current" | "target"; onClick: () => void;
}) {
  const color = LEVEL_COLORS[level];
  return (
    <button onClick={onClick}
      className="score-button"
      style={selected ? {
        background: type === "current" ? `${color}25` : `${color}15`,
        borderColor: color,
        color: color,
        boxShadow: `0 0 12px ${color}30`,
      } : {}}>
      {level}
    </button>
  );
}

export default function AssessmentWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const assessmentId = parseInt(id ?? "0");

  const [activeDomainId, setActiveDomainId] = useState<number | null>(null);
  const [expandedCapabilities, setExpandedCapabilities] = useState<Set<number>>(new Set());
  const [localScores, setLocalScores] = useState<Record<number, {
    currentScore?: number; targetScore?: number; confidence?: ConfidenceLevel;
    justification?: string; documentReference?: string;
  }>>({});
  const [saving, setSaving] = useState<Set<number>>(new Set());

  const { data: assessment } = trpc.assessments.get.useQuery({ id: assessmentId }, { enabled: !!assessmentId });
  const { data: template } = trpc.templates.get.useQuery(
    { id: assessment?.templateId ?? 0 },
    { enabled: !!assessment?.templateId }
  );
  const { data: existingScores } = trpc.scoring.getScores.useQuery(
    { assessmentId },
    { enabled: !!assessmentId }
  );

  const submitScore = trpc.scoring.submitScore.useMutation({
    onSuccess: (_, vars) => {
      setSaving((prev) => { const n = new Set(prev); n.delete(vars.capabilityId); return n; });
    },
    onError: (err, vars) => {
      setSaving((prev) => { const n = new Set(prev); n.delete(vars.capabilityId); return n; });
      toast.error(err.message);
    },
  });

  const updateStatus = trpc.assessments.updateStatus.useMutation({
    onSuccess: () => toast.success("Status updated"),
    onError: (err) => toast.error(err.message),
  });

  const getExistingScore = useCallback((capId: number) => {
    return existingScores?.find((s: any) => s.capabilityId === capId && s.userId === user?.id);
  }, [existingScores, user?.id]);

  const getScore = useCallback((capId: number) => {
    const local = localScores[capId];
    const existing = getExistingScore(capId);
    return {
      currentScore: local?.currentScore ?? existing?.currentScore ?? undefined,
      targetScore: local?.targetScore ?? existing?.targetScore ?? undefined,
      confidence: (local?.confidence ?? existing?.confidence ?? "Medium") as ConfidenceLevel,
      justification: local?.justification ?? existing?.justification ?? "",
      documentReference: local?.documentReference ?? existing?.documentReference ?? "",
    };
  }, [localScores, getExistingScore]);

  const handleSave = useCallback(async (capId: number, isDraft = true) => {
    const score = getScore(capId);
    setSaving((prev) => new Set(prev).add(capId));
    submitScore.mutate({
      assessmentId,
      capabilityId: capId,
      ...score,
      isDraft,
    });
  }, [assessmentId, getScore, submitScore]);

  const toggleCapability = (capId: number) => {
    setExpandedCapabilities((prev) => {
      const n = new Set(prev);
      if (n.has(capId)) n.delete(capId); else n.add(capId);
      return n;
    });
  };

  if (!assessment || !template) {
    return (
      <AppLayout>
        <div className="p-8 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const statusCfg = STATUS_CONFIG[assessment.status as AssessmentStatus];
  const activeDomain = activeDomainId
    ? template.domains?.find((d: any) => d.id === activeDomainId)
    : template.domains?.[0];

  const scoredCount = template.domains?.reduce((acc: number, d: any) =>
    acc + d.capabilities.filter((c: any) => getScore(c.id).currentScore !== undefined).length, 0) ?? 0;
  const totalCount = template.domains?.reduce((acc: number, d: any) => acc + d.capabilities.length, 0) ?? 0;
  const completionPct = totalCount > 0 ? Math.round((scoredCount / totalCount) * 100) : 0;

  return (
    <AppLayout>
      <div className="flex h-full" style={{ minHeight: "calc(100vh - 56px)" }}>
        {/* Domain sidebar */}
        <div className="w-52 flex-shrink-0 border-r overflow-y-auto"
          style={{ borderColor: "#d8d8d8", background: "#1e3640" }}>
          <div className="p-3">
            <div className="text-xs font-medium mb-3 px-2" style={{ color: "#727272" }}>DOMAINS</div>
            {template.domains?.map((domain: any) => {
              const domainScored = domain.capabilities.filter((c: any) => getScore(c.id).currentScore !== undefined).length;
              const isActive = (activeDomainId ?? template.domains[0]?.id) === domain.id;
              const DomainIcon = DOMAIN_ICONS[domain.name] ?? (() => <span>•</span>);
              return (
                <button key={domain.id} onClick={() => setActiveDomainId(domain.id)}
                  className={`nav-item w-full mb-1 ${isActive ? "active" : ""}`}>
                  <DomainIcon />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="truncate text-xs">{domain.name}</div>
                    <div className="text-xs" style={{ color: "#727272" }}>
                      {domainScored}/{domain.capabilities.length}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main workspace */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <button onClick={() => navigate(-1 as any)}
                  className="flex items-center gap-1 text-xs mb-2 hover:text-red-600 transition-colors"
                  style={{ color: "#727272" }}>
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
                <h1 className="font-display text-xl font-bold mb-1">{assessment.name}</h1>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg?.className}`}>
                    {statusCfg?.label}
                  </span>
                  <span className="text-xs" style={{ color: "#727272" }}>
                    {completionPct}% complete ({scoredCount}/{totalCount} capabilities)
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => navigate(`/assessment/${assessmentId}/results`)}
                  className="gap-1 text-xs">
                  <BarChart3 className="w-3 h-3" /> Results
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate(`/assessment/${assessmentId}/roadmap`)}
                  className="gap-1 text-xs">
                  <Map className="w-3 h-3" /> Roadmap
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate(`/assessment/${assessmentId}/report`)}
                  className="gap-1 text-xs">
                  <FileText className="w-3 h-3" /> Report
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="progress-track">
                <div className="progress-fill-amber" style={{ width: `${completionPct}%` }} />
              </div>
            </div>

            {/* Domain header */}
            {activeDomain && (
              <div className="mb-6 p-4 rounded-xl border" style={{ background: "#f0f0f0", borderColor: "#d8d8d8" }}>
                <h2 className="font-display text-lg font-semibold mb-1">{activeDomain.name}</h2>
                <p className="text-sm" style={{ color: "#727272" }}>{activeDomain.description}</p>
                {activeDomain.standardsAlignment && (
                  <div className="flex items-center gap-2 mt-2">
                    <Shield className="w-3 h-3" style={{ color: "#1e3640" }} />
                    <span className="text-xs" style={{ color: "#1e3640" }}>
                      {activeDomain.standardsAlignment}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Capabilities */}
            <div className="space-y-3">
              {activeDomain?.capabilities?.map((cap: any) => {
                const score = getScore(cap.id);
                const isExpanded = expandedCapabilities.has(cap.id);
                const isSaving = saving.has(cap.id);
                const isScored = score.currentScore !== undefined;

                return (
                  <div key={cap.id} className="card-base overflow-hidden">
                    {/* Capability header */}
                    <button className="w-full p-4 flex items-start gap-3 text-left hover:bg-elevated transition-colors"
                      onClick={() => toggleCapability(cap.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isScored ? (
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#1a9e6e" }} />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 flex-shrink-0" style={{ borderColor: "#c9c9c9" }} />
                          )}
                          <span className="font-medium text-sm">{cap.name}</span>
                        </div>
                        {cap.description && (
                          <p className="text-xs ml-6" style={{ color: "#727272" }}>{cap.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {isScored && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded" style={{
                              background: `${LEVEL_COLORS[score.currentScore!]}20`,
                              color: LEVEL_COLORS[score.currentScore!],
                              border: `1px solid ${LEVEL_COLORS[score.currentScore!]}40`,
                            }}>
                              Current: {score.currentScore}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded" style={{
                              background: "oklch(0.62 0.16 220 / 0.15)",
                              color: "oklch(0.72 0.14 220)",
                              border: "1px solid oklch(0.62 0.16 220 / 0.4)",
                            }}>
                              Target: {score.targetScore}
                            </span>
                          </div>
                        )}
                        {isExpanded ? <ChevronDown className="w-4 h-4" style={{ color: "#727272" }} />
                          : <ChevronRight className="w-4 h-4" style={{ color: "#727272" }} />}
                      </div>
                    </button>

                    {/* Expanded scoring panel */}
                    {isExpanded && (
                      <div className="border-t p-5 space-y-5" style={{ borderColor: "#d8d8d8", background: "#f5f5f5" }}>
                        {/* Level descriptors */}
                        {cap.levelDescriptors && cap.levelDescriptors.length > 0 && (
                          <div>
                            <div className="text-xs font-medium mb-3" style={{ color: "#727272" }}>MATURITY LEVEL DESCRIPTORS</div>
                            <div className="grid gap-2">
                              {cap.levelDescriptors.map((ld: any) => (
                                <div key={ld.id} className="flex gap-3 p-3 rounded-lg"
                                  style={{ background: "#f0f0f0" }}>
                                  <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                                    style={{ background: `${LEVEL_COLORS[ld.level]}20`, color: LEVEL_COLORS[ld.level] }}>
                                    {ld.level}
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium mb-0.5" style={{ color: LEVEL_COLORS[ld.level] }}>{ld.label}</div>
                                    <div className="text-xs" style={{ color: "#727272" }}>{ld.description}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Score inputs */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <div className="text-xs font-medium mb-2" style={{ color: "#727272" }}>CURRENT MATURITY SCORE</div>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <ScoreButton key={level} level={level} type="current"
                                  selected={score.currentScore === level}
                                  onClick={() => setLocalScores((prev) => ({ ...prev, [cap.id]: { ...getScore(cap.id), currentScore: level } }))} />
                              ))}
                            </div>
                            {score.currentScore && (
                              <div className="text-xs mt-2" style={{ color: LEVEL_COLORS[score.currentScore] }}>
                                Level {score.currentScore}: {MATURITY_LABELS[score.currentScore]}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-2" style={{ color: "#727272" }}>TARGET MATURITY SCORE</div>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <ScoreButton key={level} level={level} type="target"
                                  selected={score.targetScore === level}
                                  onClick={() => setLocalScores((prev) => ({ ...prev, [cap.id]: { ...getScore(cap.id), targetScore: level } }))} />
                              ))}
                            </div>
                            {score.targetScore && (
                              <div className="text-xs mt-2" style={{ color: "oklch(0.72 0.14 220)" }}>
                                Level {score.targetScore}: {MATURITY_LABELS[score.targetScore]}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Confidence */}
                        <div>
                          <div className="text-xs font-medium mb-2" style={{ color: "#727272" }}>CONFIDENCE LEVEL</div>
                          <div className="flex gap-2">
                            {(["Low", "Medium", "High"] as ConfidenceLevel[]).map((c) => (
                              <button key={c} onClick={() => setLocalScores((prev) => ({ ...prev, [cap.id]: { ...getScore(cap.id), confidence: c } }))}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                                style={score.confidence === c ? {
                                  background: "rgba(226,35,42,0.12)",
                                  borderColor: "#e2232a",
                                  color: "#e2232a",
                                } : {
                                  background: "#e8e8e8",
                                  borderColor: "#d8d8d8",
                                  color: "#727272",
                                }}>
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Justification */}
                        <div>
                          <div className="text-xs font-medium mb-2" style={{ color: "#727272" }}>EVIDENCE JUSTIFICATION</div>
                          <Textarea
                            value={score.justification}
                            onChange={(e) => setLocalScores((prev) => ({ ...prev, [cap.id]: { ...getScore(cap.id), justification: e.target.value } }))}
                            placeholder="Describe the evidence that supports this score…"
                            rows={3} className="resize-none text-sm bg-elevated border-subtle" />
                        </div>

                        {/* Document reference */}
                        <div>
                          <div className="text-xs font-medium mb-2" style={{ color: "#727272" }}>DOCUMENT REFERENCE / URL</div>
                          <Input
                            value={score.documentReference}
                            onChange={(e) => setLocalScores((prev) => ({ ...prev, [cap.id]: { ...getScore(cap.id), documentReference: e.target.value } }))}
                            placeholder="e.g. SharePoint link, document name, or URL"
                            className="text-sm bg-elevated border-subtle" />
                          <p className="text-xs mt-1" style={{ color: "oklch(0.40 0.01 240)" }}>
                            Reference your evidence location — no upload required
                          </p>
                        </div>

                        {/* Save buttons */}
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" variant="outline" onClick={() => handleSave(cap.id, true)}
                            disabled={isSaving} className="gap-1 text-xs">
                            <Save className="w-3 h-3" />
                            {isSaving ? "Saving…" : "Save Draft"}
                          </Button>
                          <Button size="sm" onClick={() => handleSave(cap.id, false)}
                            disabled={isSaving || !score.currentScore || !score.targetScore}
                            className="gap-1 text-xs" style={{ background: "#e2232a", color: "#1e3640" }}>
                            <CheckCircle2 className="w-3 h-3" />
                            {isSaving ? "Submitting…" : "Submit Score"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Status actions */}
            <div className="mt-8 p-4 rounded-xl border" style={{ background: "#f0f0f0", borderColor: "#d8d8d8" }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium mb-1">Assessment Status</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg?.className}`}>
                      {statusCfg?.label}
                    </span>
                    <span className="text-xs" style={{ color: "#727272" }}>
                      {completionPct}% scored
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {assessment.status === "Draft" && (
                    <Button size="sm" onClick={() => updateStatus.mutate({ id: assessmentId, status: "In-Progress" })}
                      style={{ background: "#e2232a", color: "#1e3640" }}>
                      Start Assessment
                    </Button>
                  )}
                  {assessment.status === "In-Progress" && (
                    <Button size="sm" onClick={() => updateStatus.mutate({ id: assessmentId, status: "Under Review" })}
                      style={{ background: "#1e3640", color: "white" }}>
                      Submit for Review
                    </Button>
                  )}
                  {assessment.status === "Under Review" && (
                    <Button size="sm" onClick={() => updateStatus.mutate({ id: assessmentId, status: "Approved" })}
                      style={{ background: "#1a9e6e", color: "white" }}>
                      Approve Assessment
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
