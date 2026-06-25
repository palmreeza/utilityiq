import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";
import { toast } from "sonner";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from "recharts";
import {
  ArrowLeft, RefreshCw, Map, FileText, AlertTriangle, TrendingUp,
  BarChart3, Activity, Grid3X3, Target
} from "lucide-react";
import { EMS_LEVELS, MATURITY_LABELS } from "../../../shared/types";

const DOMAIN_PALETTE = [
  "#e2232a", "#1e3640", "#1a9e6e", "#d97706",
  "#8c191c", "#44ebca", "#0f7a55", "#c0392b"
];

const SCORE_COLORS = ["", "#e2232a", "#d97706", "#ca8a04", "#1a9e6e", "#1e3640"];

export default function ResultsDashboard() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const assessmentId = parseInt(id ?? "0");
  const [activeTab, setActiveTab] = useState<"overview" | "domains" | "gaps" | "heatmap">("overview");

  const { data: assessment } = trpc.assessments.get.useQuery({ id: assessmentId }, { enabled: !!assessmentId });
  const { data: snapshot, refetch } = trpc.results.getSnapshot.useQuery({ assessmentId }, { enabled: !!assessmentId });

  const calculateMutation = trpc.results.calculate.useMutation({
    onSuccess: () => { toast.success("Results calculated"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const generateRoadmap = trpc.roadmap.generate.useMutation({
    onSuccess: (data) => {
      toast.success(`Roadmap generated — ${data.generated} items`);
      navigate(`/assessment/${assessmentId}/roadmap`);
    },
    onError: (err) => toast.error(err.message),
  });

  const domainScores = (snapshot?.domainScores as any[]) ?? [];
  const capabilityScores = (snapshot?.capabilityScores as any[]) ?? [];
  const highVariance = (snapshot?.highVarianceCapabilities as any[]) ?? [];

  const radarData = domainScores.map((d: any) => ({
    domain: d.domainName?.split(" ").slice(0, 2).join(" ") ?? d.domainName,
    current: parseFloat((d.currentScore ?? 0).toFixed(2)),
    target: parseFloat((d.targetScore ?? 0).toFixed(2)),
  }));

  const barData = domainScores.map((d: any, i: number) => ({
    name: d.domainName?.split(" ").slice(0, 2).join(" ") ?? d.domainName,
    fullName: d.domainName,
    current: parseFloat((d.currentScore ?? 0).toFixed(2)),
    target: parseFloat((d.targetScore ?? 0).toFixed(2)),
    gap: parseFloat(((d.targetScore ?? 0) - (d.currentScore ?? 0)).toFixed(2)),
    color: DOMAIN_PALETTE[i % DOMAIN_PALETTE.length],
  }));

  const emsLevel = snapshot?.emsMaturityLevel as number ?? 0;
  const emsInfo = EMS_LEVELS[emsLevel];
  const overallScore = snapshot?.overallScore as number ?? 0;
  const overallTarget = snapshot?.overallTargetScore as number ?? 0;
  const gap = overallTarget - overallScore;

  const tabs = [
    { id: "overview",  label: "Overview",      icon: Activity },
    { id: "domains",   label: "Domain Scores", icon: BarChart3 },
    { id: "gaps",      label: "Gap Analysis",  icon: Target },
    { id: "heatmap",   label: "Heatmap",       icon: Grid3X3 },
  ] as const;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border p-3 shadow-lg" style={{ background: "#ffffff", borderColor: "#e5e5e5" }}>
          <p className="text-xs font-bold mb-2" style={{ color: "#252525" }}>{label}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span style={{ color: "#727272" }}>{p.name}:</span>
              <span className="font-bold" style={{ color: "#252525" }}>{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AppLayout>
      <div className="min-h-full" style={{ background: "#f5f5f5" }}>

        {/* ── Hero header ── */}
        <div className="relative overflow-hidden px-6 lg:px-8 pt-8 pb-8"
          style={{ background: "linear-gradient(135deg, #1e3640 0%, #0d1f26 100%)" }}>
          <div className="absolute top-0 right-0 w-80 h-40 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ background: "#e2232a" }} />
          <div className="absolute bottom-0 left-1/3 w-48 h-24 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ background: "#44ebca" }} />

          <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <button onClick={() => navigate(`/assessment/${assessmentId}/workspace`)}
                className="flex items-center gap-1.5 text-xs mb-4 transition-colors"
                style={{ color: "rgba(255,255,255,0.40)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.40)")}>
                <ArrowLeft className="w-3 h-3" /> Back to Workspace
              </button>
              <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#44ebca" }}>Results Dashboard</div>
              <h1 className="font-display font-bold text-white mb-1"
                style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", letterSpacing: "-0.02em" }}>
                {assessment?.name ?? "Assessment Results"}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.50)" }}>Maturity scores, gap analysis and EMS level positioning</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => calculateMutation.mutate({ assessmentId })}
                disabled={calculateMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
                style={{ borderColor: "rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.70)", background: "rgba(255,255,255,0.06)" }}>
                <RefreshCw className={`w-3.5 h-3.5 ${calculateMutation.isPending ? "animate-spin" : ""}`} />
                {calculateMutation.isPending ? "Calculating…" : "Recalculate"}
              </button>
              <button onClick={() => generateRoadmap.mutate({ assessmentId })}
                disabled={generateRoadmap.isPending || !snapshot}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-40"
                style={{ background: "#e2232a", boxShadow: "0 2px 8px rgba(226,35,42,0.35)" }}>
                <Map className="w-3.5 h-3.5" />
                {generateRoadmap.isPending ? "Generating…" : "Generate Roadmap"}
              </button>
              <button onClick={() => navigate(`/assessment/${assessmentId}/report`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
                style={{ borderColor: "rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.70)", background: "rgba(255,255,255,0.06)" }}>
                <FileText className="w-3.5 h-3.5" /> Report
              </button>
            </div>
          </div>

          {/* KPI strip */}
          {snapshot && (
            <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
              {[
                { label: "Overall Score", value: overallScore.toFixed(2), sub: MATURITY_LABELS[Math.round(overallScore)] ?? "—", color: "#e2232a", suffix: "/5" },
                { label: "Target Score",  value: overallTarget.toFixed(2), sub: MATURITY_LABELS[Math.round(overallTarget)] ?? "—", color: "#44ebca", suffix: "/5" },
                { label: "Maturity Gap",  value: gap.toFixed(2),           sub: "points to close", color: gap > 1.5 ? "#e2232a" : gap > 0.5 ? "#d97706" : "#1a9e6e", suffix: "" },
                { label: "EMS Level",     value: emsInfo ? `L${emsLevel}` : "—", sub: emsInfo?.label ?? "Not scored", color: emsInfo?.color ?? "#727272", suffix: "" },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-2xl p-4 border"
                  style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.10)" }}>
                  <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {kpi.label}
                  </div>
                  <div className="font-display font-bold text-2xl mb-0.5" style={{ color: kpi.color }}>
                    {kpi.value}
                    {kpi.suffix && <span className="text-sm font-normal" style={{ color: "rgba(255,255,255,0.30)" }}>{kpi.suffix}</span>}
                  </div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>{kpi.sub}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="px-6 lg:px-8 py-6">
          {!snapshot ? (
            <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "#e5e5e5" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(226,35,42,0.08)" }}>
                <TrendingUp className="w-8 h-8" style={{ color: "#e2232a" }} />
              </div>
              <h3 className="font-display font-bold text-xl mb-2" style={{ color: "#252525" }}>No results yet</h3>
              <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "#727272" }}>
                Complete scoring in the workspace, then calculate results to see your maturity dashboard.
              </p>
              <button onClick={() => calculateMutation.mutate({ assessmentId })}
                disabled={calculateMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95"
                style={{ background: "#e2232a" }}>
                <RefreshCw className={`w-4 h-4 ${calculateMutation.isPending ? "animate-spin" : ""}`} />
                {calculateMutation.isPending ? "Calculating…" : "Calculate Results Now"}
              </button>
            </div>
          ) : (
            <>
              {/* Tab switcher */}
              <div className="flex gap-1 mb-6 p-1 rounded-2xl w-fit" style={{ background: "#e8e8e8" }}>
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
                      style={activeTab === tab.id ? {
                        background: "#ffffff",
                        color: "#252525",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
                      } : {
                        color: "#727272",
                      }}>
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Overview tab */}
              {activeTab === "overview" && (
                <div className="grid lg:grid-cols-5 gap-6">
                  {/* Radar chart — wider */}
                  <div className="lg:col-span-3 bg-white rounded-2xl border p-6" style={{ borderColor: "#e5e5e5" }}>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="font-display font-bold text-lg" style={{ color: "#252525" }}>Maturity Radar</h3>
                        <p className="text-xs" style={{ color: "#727272" }}>Current vs Target across all domains</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={340}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#f0f0f0" />
                        <PolarAngleAxis dataKey="domain" tick={{ fill: "#727272", fontSize: 10, fontWeight: 500 }} />
                        <Radar name="Current" dataKey="current" stroke="#e2232a" fill="#e2232a" fillOpacity={0.12} strokeWidth={2.5} dot={{ fill: "#e2232a", r: 3 }} />
                        <Radar name="Target" dataKey="target" stroke="#1e3640" fill="#1e3640" fillOpacity={0.06} strokeWidth={2} strokeDasharray="5 4" dot={{ fill: "#1e3640", r: 2 }} />
                        <Legend wrapperStyle={{ color: "#727272", fontSize: 12, paddingTop: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* EMS level ladder */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border p-6" style={{ borderColor: "#e5e5e5" }}>
                    <div className="mb-5">
                      <h3 className="font-display font-bold text-lg" style={{ color: "#252525" }}>IOT.nxt EMS Level</h3>
                      <p className="text-xs" style={{ color: "#727272" }}>Current positioning on the maturity ladder</p>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(EMS_LEVELS).map(([lvl, info]) => {
                        const level = parseInt(lvl);
                        const isCurrent = level === emsLevel;
                        return (
                          <div key={lvl}
                            className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all"
                            style={{
                              background: isCurrent ? `${info.color}10` : "#fafafa",
                              borderColor: isCurrent ? info.color : "transparent",
                            }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                              style={{ background: isCurrent ? info.color : "#e5e5e5", color: isCurrent ? "#ffffff" : "#c9c9c9" }}>
                              {level}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold leading-none mb-0.5" style={{ color: isCurrent ? info.color : "#727272" }}>
                                {info.label}
                              </div>
                              <div className="text-xs truncate" style={{ color: "#c9c9c9" }}>{info.description}</div>
                            </div>
                            {isCurrent && (
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: info.color }} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Domain scores tab */}
              {activeTab === "domains" && (
                <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#e5e5e5" }}>
                  <div className="mb-5">
                    <h3 className="font-display font-bold text-lg" style={{ color: "#252525" }}>Domain Score Comparison</h3>
                    <p className="text-xs" style={{ color: "#727272" }}>Current vs Target maturity score per domain</p>
                  </div>
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 70 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#727272", fontSize: 10 }} angle={-30} textAnchor="end" />
                      <YAxis domain={[0, 5]} tick={{ fill: "#727272", fontSize: 11 }} tickCount={6} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: "#727272", fontSize: 12, paddingTop: 16 }} />
                      <Bar dataKey="current" name="Current" radius={[6, 6, 0, 0]} maxBarSize={40}>
                        {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                      <Bar dataKey="target" name="Target" fill="#1e3640" fillOpacity={0.25} radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Gap analysis tab */}
              {activeTab === "gaps" && (
                <div className="space-y-3">
                  {barData.sort((a, b) => b.gap - a.gap).map((d, i) => {
                    const gapPct = (d.gap / 5) * 100;
                    const gapColor = d.gap > 1.5 ? "#e2232a" : d.gap > 0.5 ? "#d97706" : "#1a9e6e";
                    return (
                      <div key={d.name} className="bg-white rounded-2xl border p-5" style={{ borderColor: "#e5e5e5" }}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: d.color }}>
                              {i + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-sm" style={{ color: "#252525" }}>{d.fullName}</div>
                              <div className="text-xs" style={{ color: "#727272" }}>
                                Current <span className="font-bold" style={{ color: d.color }}>{d.current}</span>
                                {" → "}
                                Target <span className="font-bold" style={{ color: "#1e3640" }}>{d.target}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-display font-bold text-xl" style={{ color: gapColor }}>
                              {d.gap > 0 ? `+${d.gap}` : d.gap}
                            </div>
                            <div className="text-xs" style={{ color: "#727272" }}>gap</div>
                          </div>
                        </div>
                        {/* Dual progress bar */}
                        <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "#f0f0f0" }}>
                          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                            style={{ width: `${(d.target / 5) * 100}%`, background: `${d.color}25` }} />
                          <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                            style={{ width: `${(d.current / 5) * 100}%`, background: d.color }} />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span className="text-[10px]" style={{ color: "#c9c9c9" }}>0</span>
                          <span className="text-[10px]" style={{ color: "#c9c9c9" }}>5</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Heatmap tab */}
              {activeTab === "heatmap" && (
                <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "#e5e5e5" }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-display font-bold text-lg" style={{ color: "#252525" }}>Capability Heatmap</h3>
                      <p className="text-xs" style={{ color: "#727272" }}>All capabilities with scores, gaps and variance flags</p>
                    </div>
                  </div>

                  {highVariance.length > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-xl mb-5 border"
                      style={{ background: "rgba(217,119,6,0.08)", borderColor: "rgba(217,119,6,0.25)" }}>
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#d97706" }} />
                      <span className="text-sm font-medium" style={{ color: "#d97706" }}>
                        {highVariance.length} high-variance {highVariance.length === 1 ? "capability" : "capabilities"} detected — facilitator consensus recommended
                      </span>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                          <th className="text-left py-3 pr-4 text-[10px] font-bold tracking-widest uppercase" style={{ color: "#c9c9c9" }}>Capability</th>
                          <th className="text-center py-3 px-3 text-[10px] font-bold tracking-widest uppercase" style={{ color: "#c9c9c9" }}>Current</th>
                          <th className="text-center py-3 px-3 text-[10px] font-bold tracking-widest uppercase" style={{ color: "#c9c9c9" }}>Target</th>
                          <th className="text-center py-3 px-3 text-[10px] font-bold tracking-widest uppercase" style={{ color: "#c9c9c9" }}>Gap</th>
                          <th className="text-center py-3 px-3 text-[10px] font-bold tracking-widest uppercase" style={{ color: "#c9c9c9" }}>Variance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {capabilityScores.map((cap: any) => {
                          const capGap = (cap.targetScore ?? 0) - (cap.currentScore ?? 0);
                          const isHighVar = highVariance.some((hv: any) => hv.capabilityId === cap.capabilityId);
                          const gapColor = capGap > 1.5 ? "#e2232a" : capGap > 0.5 ? "#d97706" : "#1a9e6e";
                          const scoreColor = SCORE_COLORS[Math.round(cap.currentScore)] ?? "#727272";
                          return (
                            <tr key={cap.capabilityId}
                              className="transition-colors"
                              style={{ borderBottom: "1px solid #f5f5f5" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-2">
                                  {isHighVar && <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: "#d97706" }} />}
                                  <span className="text-sm" style={{ color: "#252525" }}>{cap.capabilityName}</span>
                                </div>
                              </td>
                              <td className="text-center py-3 px-3">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold"
                                  style={{ background: `${scoreColor}15`, color: scoreColor }}>
                                  {(cap.currentScore ?? 0).toFixed(1)}
                                </span>
                              </td>
                              <td className="text-center py-3 px-3">
                                <span className="text-sm font-semibold" style={{ color: "#1e3640" }}>
                                  {(cap.targetScore ?? 0).toFixed(1)}
                                </span>
                              </td>
                              <td className="text-center py-3 px-3">
                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold"
                                  style={{ background: `${gapColor}12`, color: gapColor }}>
                                  {capGap > 0 ? `+${capGap.toFixed(1)}` : capGap.toFixed(1)}
                                </span>
                              </td>
                              <td className="text-center py-3 px-3">
                                {isHighVar ? (
                                  <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                                    style={{ background: "rgba(217,119,6,0.12)", color: "#d97706" }}>
                                    High
                                  </span>
                                ) : (
                                  <span className="text-xs" style={{ color: "#c9c9c9" }}>—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
