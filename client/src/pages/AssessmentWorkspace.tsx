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
  Save, BarChart3, Map, FileText, Shield, Zap, Activity, Clock
} from "lucide-react";
import { STATUS_CONFIG, MATURITY_LABELS } from "../../../shared/types";
import type { AssessmentStatus, ConfidenceLevel } from "../../../shared/types";

const DOMAIN_COLORS: Record<string, string> = {
  "Meter Management":    "#e2232a",
  "Billing":             "#c0392b",
  "Asset Operations":    "#1e3640",
  "Analytics":           "#1a9e6e",
  "Cybersecurity":       "#8c191c",
  "Sustainability":      "#0f7a55",
  "Customer Engagement": "#44ebca",
  "Smart Infrastructure":"#1e3640",
};

const DOMAIN_ICONS: Record<string, React.ElementType> = {
  "Meter Management":    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  "Billing":             () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>,
  "Asset Operations":    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  "Analytics":           () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>,
  "Cybersecurity":       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  "Sustainability":      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M2 22c1.25-1.25 2.5-2.5 3.75-2.5 2.5 0 2.5 2.5 5 2.5s2.5-2.5 5-2.5 2.5 2.5 3.75 2.5"/><path d="M12 2a4 4 0 0 1 4 4c0 4-4 6-4 10"/></svg>,
  "Customer Engagement": () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  "Smart Infrastructure":() => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
};

const LEVEL_COLORS = ["", "#e2232a", "#d97706", "#ca8a04", "#1a9e6e", "#1e3640"];
const LEVEL_LABELS = ["", "Initial", "Developing", "Defined", "Managed", "Optimising"];

function ScoreButton({ level, selected, type, onClick }: {
  level: number; selected: boolean; type: "current" | "target"; onClick: () => void;
}) {
  const color = LEVEL_COLORS[level];
  return (
    <button onClick={onClick}
      className="w-11 h-11 rounded-xl font-bold text-sm transition-all duration-150 active:scale-95 border-2 flex items-center justify-center"
      style={selected ? {
        background: `${color}18`,
        borderColor: color,
        color: color,
        boxShadow: `0 0 16px ${color}30`,
      } : {
        background: "#f5f5f5",
        borderColor: "#e0e0e0",
        color: "#727272",
      }}>
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
      toast.success("Score saved");
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
    submitScore.mutate({ assessmentId, capabilityId: capId, ...score, isDraft });
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
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#1e3640" }}>
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#e2232a", borderTopColor: "transparent" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.40)" }}>Loading Assessment</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const statusCfg = STATUS_CONFIG[assessment.status as AssessmentStatus];
  const activeDomain = activeDomainId
    ? template.domains?.find((d: any) => d.id === activeDomainId)
    : template.domains?.[0];
  const activeDomainColor = activeDomain ? (DOMAIN_COLORS[activeDomain.name] ?? "#e2232a") : "#e2232a";

  const scoredCount = template.domains?.reduce((acc: number, d: any) =>
    acc + d.capabilities.filter((c: any) => getScore(c.id).currentScore !== undefined).length, 0) ?? 0;
  const totalCount = template.domains?.reduce((acc: number, d: any) => acc + d.capabilities.length, 0) ?? 0;
  const completionPct = totalCount > 0 ? Math.round((scoredCount / totalCount) * 100) : 0;

  return (
    <AppLayout>
      <div className="flex h-full" style={{ minHeight: "calc(100vh - 56px)" }}>

        {/* ── Domain sidebar ── */}
        <div className="w-56 flex-shrink-0 overflow-y-auto flex flex-col"
          style={{ background: "#0d1f26", borderRight: "1px solid rgba(255,255,255,0.06)" }}>

          {/* Sidebar header */}
          <div className="px-4 pt-5 pb-4">
            <button onClick={() => navigate(-1 as any)}
              className="flex items-center gap-1.5 text-xs mb-5 transition-colors"
              style={{ color: "rgba(255,255,255,0.40)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.40)")}>
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
            <div className="text-[9px] font-bold tracking-widest uppercase mb-3" style={{ color: "rgba(255,255,255,0.25)" }}>
              Domains
            </div>
          </div>

          {/* Domain list */}
          <nav className="flex-1 px-3 pb-4 space-y-0.5">
            {template.domains?.map((domain: any) => {
              const domainScored = domain.capabilities.filter((c: any) => getScore(c.id).currentScore !== undefined).length;
              const isActive = (activeDomainId ?? template.domains[0]?.id) === domain.id;
              const DomainIcon = DOMAIN_ICONS[domain.name] ?? (() => <span>•</span>);
              const dColor = DOMAIN_COLORS[domain.name] ?? "#e2232a";
              const pct = domain.capabilities.length > 0 ? Math.round((domainScored / domain.capabilities.length) * 100) : 0;

              return (
                <button key={domain.id} onClick={() => setActiveDomainId(domain.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group"
                  style={{
                    background: isActive ? `${dColor}20` : "transparent",
                    color: isActive ? "#ffffff" : "rgba(255,255,255,0.50)",
                  }}
                  onMouseEnter={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "#ffffff"; } }}
                  onMouseLeave={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.50)"; } }}>
                  {isActive && <div className="absolute left-0 w-0.5 h-6 rounded-full" style={{ background: dColor }} />}
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: isActive ? `${dColor}30` : "rgba(255,255,255,0.06)", color: isActive ? dColor : "inherit" }}>
                    <DomainIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate leading-none mb-1">{domain.name}</div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.10)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: dColor }} />
                      </div>
                      <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.30)" }}>{domainScored}/{domain.capabilities.length}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Overall progress */}
          <div className="mx-3 mb-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>Overall</span>
              <span className="text-sm font-bold text-white">{completionPct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.10)" }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%`, background: "linear-gradient(90deg, #e2232a, #44ebca)" }} />
            </div>
            <div className="text-[10px] mt-1.5" style={{ color: "rgba(255,255,255,0.30)" }}>{scoredCount} of {totalCount} capabilities</div>
          </div>
        </div>

        {/* ── Main workspace ── */}
        <div className="flex-1 overflow-y-auto" style={{ background: "#f5f5f5" }}>

          {/* Top action bar */}
          <div className="sticky top-0 z-10 border-b px-6 py-3 flex items-center justify-between gap-4"
            style={{ background: "#ffffff", borderColor: "#e5e5e5", boxShadow: "0 1px 0 #e5e5e5" }}>
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <h1 className="font-display font-bold text-base leading-none mb-1" style={{ color: "#252525" }}>{assessment.name}</h1>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide ${statusCfg?.className}`}>
                    {statusCfg?.label}
                  </span>
                  <span className="text-xs" style={{ color: "#727272" }}>{completionPct}% complete</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => navigate(`/assessment/${assessmentId}/results`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={{ borderColor: "#e5e5e5", color: "#252525", background: "#ffffff" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e2232a"; (e.currentTarget as HTMLElement).style.color = "#e2232a"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5"; (e.currentTarget as HTMLElement).style.color = "#252525"; }}>
                <BarChart3 className="w-3.5 h-3.5" /> Results
              </button>
              <button onClick={() => navigate(`/assessment/${assessmentId}/roadmap`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={{ borderColor: "#e5e5e5", color: "#252525", background: "#ffffff" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1e3640"; (e.currentTarget as HTMLElement).style.color = "#1e3640"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5"; (e.currentTarget as HTMLElement).style.color = "#252525"; }}>
                <Map className="w-3.5 h-3.5" /> Roadmap
              </button>
              <button onClick={() => navigate(`/assessment/${assessmentId}/report`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95"
                style={{ background: "#e2232a" }}>
                <FileText className="w-3.5 h-3.5" /> Report
              </button>
            </div>
          </div>

          {/* Domain header banner */}
          {activeDomain && (
            <div className="relative overflow-hidden px-6 py-5"
              style={{ background: `linear-gradient(135deg, ${activeDomainColor}12, ${activeDomainColor}04)`, borderBottom: `1px solid ${activeDomainColor}20` }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${activeDomainColor}15`, color: activeDomainColor }}>
                  {(() => { const Icon = DOMAIN_ICONS[activeDomain.name] ?? (() => <Zap className="w-5 h-5" />); return <Icon />; })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display font-bold text-xl mb-1" style={{ color: "#252525", letterSpacing: "-0.02em" }}>
                    {activeDomain.name}
                  </h2>
                  <p className="text-sm" style={{ color: "#727272" }}>{activeDomain.description}</p>
                  {activeDomain.standardsAlignment && (
                    <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg"
                      style={{ background: `${activeDomainColor}10`, color: activeDomainColor }}>
                      <Shield className="w-3 h-3" />
                      <span className="text-xs font-medium">{activeDomain.standardsAlignment}</span>
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-display font-bold text-2xl" style={{ color: activeDomainColor }}>
                    {activeDomain.capabilities.filter((c: any) => getScore(c.id).currentScore !== undefined).length}
                    <span className="text-base font-normal" style={{ color: "#c9c9c9" }}>/{activeDomain.capabilities.length}</span>
                  </div>
                  <div className="text-xs" style={{ color: "#727272" }}>Scored</div>
                </div>
              </div>
            </div>
          )}

          {/* Capabilities list */}
          <div className="p-6 space-y-3">
            {activeDomain?.capabilities?.map((cap: any, idx: number) => {
              const score = getScore(cap.id);
              const isExpanded = expandedCapabilities.has(cap.id);
              const isSaving = saving.has(cap.id);
              const isScored = score.currentScore !== undefined;
              const gap = (score.currentScore && score.targetScore) ? score.targetScore - score.currentScore : null;

              return (
                <div key={cap.id}
                  className="bg-white rounded-2xl border overflow-hidden transition-all duration-200"
                  style={{
                    borderColor: isScored ? `${activeDomainColor}30` : "#e5e5e5",
                    boxShadow: isExpanded ? `0 4px 24px ${activeDomainColor}12` : "0 1px 3px rgba(0,0,0,0.06)",
                  }}>

                  {/* Capability header */}
                  <button className="w-full p-5 flex items-start gap-4 text-left transition-colors"
                    style={{ background: isExpanded ? `${activeDomainColor}04` : "transparent" }}
                    onClick={() => toggleCapability(cap.id)}>

                    {/* Number badge */}
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{
                        background: isScored ? `${activeDomainColor}15` : "#f0f0f0",
                        color: isScored ? activeDomainColor : "#c9c9c9",
                      }}>
                      {isScored ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm mb-0.5" style={{ color: "#252525" }}>{cap.name}</div>
                      {cap.description && (
                        <p className="text-xs leading-relaxed" style={{ color: "#727272" }}>{cap.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isScored && (
                        <>
                          <span className="text-xs px-2.5 py-1 rounded-lg font-bold"
                            style={{ background: `${LEVEL_COLORS[score.currentScore!]}15`, color: LEVEL_COLORS[score.currentScore!] }}>
                            {score.currentScore}
                          </span>
                          {gap !== null && gap > 0 && (
                            <span className="text-xs px-2 py-1 rounded-lg font-bold"
                              style={{ background: "rgba(30,54,64,0.08)", color: "#1e3640" }}>
                              +{gap}
                            </span>
                          )}
                        </>
                      )}
                      {isExpanded
                        ? <ChevronDown className="w-4 h-4" style={{ color: "#c9c9c9" }} />
                        : <ChevronRight className="w-4 h-4" style={{ color: "#c9c9c9" }} />}
                    </div>
                  </button>

                  {/* Expanded scoring panel */}
                  {isExpanded && (
                    <div className="border-t px-5 py-5 space-y-6" style={{ borderColor: "#f0f0f0", background: "#fafafa" }}>

                      {/* Level descriptors */}
                      {cap.levelDescriptors && cap.levelDescriptors.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: "#c9c9c9" }}>
                            Maturity Level Descriptors
                          </div>
                          <div className="grid gap-2">
                            {cap.levelDescriptors.map((ld: any) => (
                              <div key={ld.id}
                                className="flex gap-3 p-3 rounded-xl border transition-all"
                                style={{
                                  background: score.currentScore === ld.level ? `${LEVEL_COLORS[ld.level]}08` : "#ffffff",
                                  borderColor: score.currentScore === ld.level ? `${LEVEL_COLORS[ld.level]}30` : "#f0f0f0",
                                }}>
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                  style={{ background: `${LEVEL_COLORS[ld.level]}15`, color: LEVEL_COLORS[ld.level] }}>
                                  {ld.level}
                                </div>
                                <div>
                                  <div className="text-xs font-bold mb-0.5" style={{ color: LEVEL_COLORS[ld.level] }}>
                                    {LEVEL_LABELS[ld.level]} — {ld.label}
                                  </div>
                                  <div className="text-xs leading-relaxed" style={{ color: "#727272" }}>{ld.description}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Score inputs */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <div className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: "#c9c9c9" }}>
                            Current Maturity Score
                          </div>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <ScoreButton key={level} level={level} type="current"
                                selected={score.currentScore === level}
                                onClick={() => setLocalScores((prev) => ({ ...prev, [cap.id]: { ...getScore(cap.id), currentScore: level } }))} />
                            ))}
                          </div>
                          {score.currentScore && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: LEVEL_COLORS[score.currentScore] }} />
                              <span className="text-xs font-medium" style={{ color: LEVEL_COLORS[score.currentScore] }}>
                                Level {score.currentScore}: {MATURITY_LABELS[score.currentScore]}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: "#c9c9c9" }}>
                            Target Maturity Score
                          </div>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <ScoreButton key={level} level={level} type="target"
                                selected={score.targetScore === level}
                                onClick={() => setLocalScores((prev) => ({ ...prev, [cap.id]: { ...getScore(cap.id), targetScore: level } }))} />
                            ))}
                          </div>
                          {score.targetScore && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: "#1e3640" }} />
                              <span className="text-xs font-medium" style={{ color: "#1e3640" }}>
                                Level {score.targetScore}: {MATURITY_LABELS[score.targetScore]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Confidence */}
                      <div>
                        <div className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: "#c9c9c9" }}>
                          Confidence Level
                        </div>
                        <div className="flex gap-2">
                          {(["Low", "Medium", "High"] as ConfidenceLevel[]).map((c) => {
                            const confColor = c === "High" ? "#1a9e6e" : c === "Medium" ? "#d97706" : "#e2232a";
                            const isSelected = score.confidence === c;
                            return (
                              <button key={c}
                                onClick={() => setLocalScores((prev) => ({ ...prev, [cap.id]: { ...getScore(cap.id), confidence: c } }))}
                                className="px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-150"
                                style={isSelected ? {
                                  background: `${confColor}12`,
                                  borderColor: confColor,
                                  color: confColor,
                                } : {
                                  background: "#f5f5f5",
                                  borderColor: "#e0e0e0",
                                  color: "#727272",
                                }}>
                                {c}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Justification */}
                      <div>
                        <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "#c9c9c9" }}>
                          Evidence Justification
                        </div>
                        <Textarea
                          value={score.justification}
                          onChange={(e) => setLocalScores((prev) => ({ ...prev, [cap.id]: { ...getScore(cap.id), justification: e.target.value } }))}
                          placeholder="Describe the evidence that supports this score…"
                          rows={3}
                          className="resize-none text-sm"
                          style={{ background: "#ffffff", borderColor: "#e5e5e5" }} />
                      </div>

                      {/* Document reference */}
                      <div>
                        <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "#c9c9c9" }}>
                          Document Reference / URL
                        </div>
                        <Input
                          value={score.documentReference}
                          onChange={(e) => setLocalScores((prev) => ({ ...prev, [cap.id]: { ...getScore(cap.id), documentReference: e.target.value } }))}
                          placeholder="e.g. SharePoint link, document name, or URL"
                          className="text-sm"
                          style={{ background: "#ffffff", borderColor: "#e5e5e5" }} />
                        <p className="text-xs mt-1.5" style={{ color: "#c9c9c9" }}>
                          Reference your evidence location — no file upload required
                        </p>
                      </div>

                      {/* Save actions */}
                      <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "#f0f0f0" }}>
                        <button onClick={() => handleSave(cap.id, true)}
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-150 disabled:opacity-50"
                          style={{ borderColor: "#e5e5e5", color: "#727272", background: "#ffffff" }}>
                          <Save className="w-3.5 h-3.5" />
                          {isSaving ? "Saving…" : "Save Draft"}
                        </button>
                        <button onClick={() => handleSave(cap.id, false)}
                          disabled={isSaving || !score.currentScore || !score.targetScore}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-95 disabled:opacity-40"
                          style={{ background: "#e2232a", boxShadow: "0 2px 8px rgba(226,35,42,0.25)" }}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {isSaving ? "Submitting…" : "Submit Score"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Status action footer */}
          <div className="mx-6 mb-6 rounded-2xl border overflow-hidden" style={{ borderColor: "#e5e5e5" }}>
            <div className="px-5 py-4 flex items-center justify-between gap-4"
              style={{ background: "linear-gradient(135deg, #1e3640, #0d1f26)" }}>
              <div>
                <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.40)" }}>
                  Assessment Status
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${statusCfg?.className}`}>
                    {statusCfg?.label}
                  </span>
                  <span className="text-sm text-white font-medium">{completionPct}% scored</span>
                </div>
              </div>
              <div className="flex gap-2">
                {assessment.status === "Draft" && (
                  <button onClick={() => updateStatus.mutate({ id: assessmentId, status: "In-Progress" })}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                    style={{ background: "#e2232a" }}>
                    <Activity className="w-4 h-4" /> Start Assessment
                  </button>
                )}
                {assessment.status === "In-Progress" && (
                  <button onClick={() => updateStatus.mutate({ id: assessmentId, status: "Under Review" })}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                    style={{ background: "#44ebca", color: "#1e3640" }}>
                    <Clock className="w-4 h-4" /> Submit for Review
                  </button>
                )}
                {assessment.status === "Under Review" && (
                  <button onClick={() => updateStatus.mutate({ id: assessmentId, status: "Approved" })}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                    style={{ background: "#1a9e6e" }}>
                    <CheckCircle2 className="w-4 h-4" /> Approve Assessment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
