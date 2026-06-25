import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from "recharts";
import { ArrowLeft, RefreshCw, Map, FileText, AlertTriangle, TrendingUp } from "lucide-react";
import { EMS_LEVELS, MATURITY_LABELS } from "../../../shared/types";

const DOMAIN_COLORS = [
  "#FFC000", "#3b82f6", "#22c55e", "#f97316",
  "#a855f7", "#06b6d4", "#ec4899", "#84cc16"
];

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
    domain: d.domainName?.replace(" ", "\n") ?? d.domainName,
    current: parseFloat((d.currentScore ?? 0).toFixed(2)),
    target: parseFloat((d.targetScore ?? 0).toFixed(2)),
  }));

  const barData = domainScores.map((d: any, i: number) => ({
    name: d.domainName,
    current: parseFloat((d.currentScore ?? 0).toFixed(2)),
    target: parseFloat((d.targetScore ?? 0).toFixed(2)),
    gap: parseFloat(((d.targetScore ?? 0) - (d.currentScore ?? 0)).toFixed(2)),
    color: DOMAIN_COLORS[i % DOMAIN_COLORS.length],
  }));

  const emsLevel = snapshot?.emsMaturityLevel as number ?? 0;
  const emsInfo = EMS_LEVELS[emsLevel];

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "domains", label: "Domain Scores" },
    { id: "gaps", label: "Gap Analysis" },
    { id: "heatmap", label: "Heatmap" },
  ] as const;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 animate-fade-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <button onClick={() => navigate(`/assessment/${assessmentId}/workspace`)}
              className="flex items-center gap-1 text-xs mb-2 hover:text-amber-400 transition-colors"
              style={{ color: "oklch(0.50 0.01 240)" }}>
              <ArrowLeft className="w-3 h-3" /> Back to Workspace
            </button>
            <h1 className="font-display text-2xl font-bold mb-1">Results Dashboard</h1>
            <p style={{ color: "oklch(0.60 0.01 240)" }}>{assessment?.name}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => calculateMutation.mutate({ assessmentId })}
              disabled={calculateMutation.isPending} className="gap-1 text-xs">
              <RefreshCw className={`w-3 h-3 ${calculateMutation.isPending ? "animate-spin" : ""}`} />
              {calculateMutation.isPending ? "Calculating…" : "Recalculate"}
            </Button>
            <Button size="sm" onClick={() => generateRoadmap.mutate({ assessmentId })}
              disabled={generateRoadmap.isPending || !snapshot} className="gap-1 text-xs"
              style={{ background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)" }}>
              <Map className="w-3 h-3" />
              {generateRoadmap.isPending ? "Generating…" : "Generate Roadmap"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate(`/assessment/${assessmentId}/report`)}
              className="gap-1 text-xs">
              <FileText className="w-3 h-3" /> Report
            </Button>
          </div>
        </div>

        {!snapshot ? (
          <div className="card-base p-16 text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-4" style={{ color: "oklch(0.35 0.01 240)" }} />
            <h3 className="font-semibold mb-2">No results yet</h3>
            <p className="text-sm mb-6" style={{ color: "oklch(0.60 0.01 240)" }}>
              Complete scoring in the workspace, then calculate results to see your maturity dashboard.
            </p>
            <Button onClick={() => calculateMutation.mutate({ assessmentId })} disabled={calculateMutation.isPending}
              style={{ background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)" }}>
              {calculateMutation.isPending ? "Calculating…" : "Calculate Results Now"}
            </Button>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="stat-card">
                <div className="text-xs mb-2" style={{ color: "oklch(0.50 0.01 240)" }}>OVERALL SCORE</div>
                <div className="font-display text-3xl font-bold" style={{ color: "oklch(0.78 0.18 75)" }}>
                  {(snapshot.overallScore as number ?? 0).toFixed(2)}
                  <span className="text-base font-normal ml-1" style={{ color: "oklch(0.50 0.01 240)" }}>/5</span>
                </div>
                <div className="text-xs mt-1" style={{ color: "oklch(0.60 0.01 240)" }}>
                  {MATURITY_LABELS[Math.round(snapshot.overallScore as number)] ?? "—"}
                </div>
              </div>
              <div className="stat-card">
                <div className="text-xs mb-2" style={{ color: "oklch(0.50 0.01 240)" }}>TARGET SCORE</div>
                <div className="font-display text-3xl font-bold" style={{ color: "oklch(0.62 0.16 220)" }}>
                  {(snapshot.overallTargetScore as number ?? 0).toFixed(2)}
                  <span className="text-base font-normal ml-1" style={{ color: "oklch(0.50 0.01 240)" }}>/5</span>
                </div>
                <div className="text-xs mt-1" style={{ color: "oklch(0.60 0.01 240)" }}>
                  {MATURITY_LABELS[Math.round(snapshot.overallTargetScore as number)] ?? "—"}
                </div>
              </div>
              <div className="stat-card">
                <div className="text-xs mb-2" style={{ color: "oklch(0.50 0.01 240)" }}>MATURITY GAP</div>
                <div className="font-display text-3xl font-bold" style={{ color: "oklch(0.55 0.22 25)" }}>
                  {((snapshot.overallTargetScore as number ?? 0) - (snapshot.overallScore as number ?? 0)).toFixed(2)}
                </div>
                <div className="text-xs mt-1" style={{ color: "oklch(0.60 0.01 240)" }}>points to close</div>
              </div>
              <div className="stat-card" style={emsInfo ? { borderColor: `${emsInfo.color}40` } : {}}>
                <div className="text-xs mb-2" style={{ color: "oklch(0.50 0.01 240)" }}>EMS LEVEL</div>
                {emsInfo ? (
                  <>
                    <div className="font-display text-3xl font-bold" style={{ color: emsInfo.color }}>
                      L{emsLevel}
                    </div>
                    <div className="text-xs mt-1" style={{ color: emsInfo.color }}>{emsInfo.label} — {emsInfo.description}</div>
                  </>
                ) : (
                  <div className="font-display text-3xl font-bold" style={{ color: "oklch(0.50 0.01 240)" }}>—</div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "oklch(0.13 0.01 240)" }}>
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                  style={activeTab === tab.id ? {
                    background: "oklch(0.78 0.18 75)",
                    color: "oklch(0.10 0.01 240)",
                  } : {
                    color: "oklch(0.60 0.01 240)",
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "overview" && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Radar chart */}
                <div className="card-base p-5">
                  <h3 className="font-semibold mb-4">Maturity Radar</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="oklch(0.22 0.015 240)" />
                      <PolarAngleAxis dataKey="domain" tick={{ fill: "oklch(0.60 0.01 240)", fontSize: 11 }} />
                      <Radar name="Current" dataKey="current" stroke="#FFC000" fill="#FFC000" fillOpacity={0.15} strokeWidth={2} />
                      <Radar name="Target" dataKey="target" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeWidth={2} strokeDasharray="4 4" />
                      <Legend wrapperStyle={{ color: "oklch(0.60 0.01 240)", fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: "oklch(0.16 0.012 240)", border: "1px solid oklch(0.22 0.015 240)", borderRadius: 8, color: "oklch(0.96 0.005 240)" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* EMS Level card */}
                <div className="card-base p-5">
                  <h3 className="font-semibold mb-4">IOT.nxt EMS Maturity Level</h3>
                  <div className="space-y-3">
                    {Object.entries(EMS_LEVELS).map(([lvl, info]) => {
                      const level = parseInt(lvl);
                      const isCurrent = level === emsLevel;
                      return (
                        <div key={lvl} className="flex items-center gap-3 p-3 rounded-lg transition-all"
                          style={{
                            background: isCurrent ? `${info.color}15` : "oklch(0.13 0.01 240)",
                            border: `1px solid ${isCurrent ? `${info.color}40` : "oklch(0.22 0.015 240)"}`,
                          }}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: info.color, color: "#0D0F14" }}>
                            {level}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium" style={{ color: isCurrent ? info.color : "oklch(0.70 0.01 240)" }}>
                              {info.label}
                            </div>
                            <div className="text-xs" style={{ color: "oklch(0.50 0.01 240)" }}>{info.description}</div>
                          </div>
                          {isCurrent && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: `${info.color}20`, color: info.color }}>
                              Current
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "domains" && (
              <div className="card-base p-5">
                <h3 className="font-semibold mb-4">Domain Score Comparison</h3>
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.015 240)" />
                    <XAxis dataKey="name" tick={{ fill: "oklch(0.60 0.01 240)", fontSize: 11 }} angle={-30} textAnchor="end" />
                    <YAxis domain={[0, 5]} tick={{ fill: "oklch(0.60 0.01 240)", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "oklch(0.16 0.012 240)", border: "1px solid oklch(0.22 0.015 240)", borderRadius: 8, color: "oklch(0.96 0.005 240)" }} />
                    <Legend wrapperStyle={{ color: "oklch(0.60 0.01 240)", fontSize: 12 }} />
                    <Bar dataKey="current" name="Current" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.8} />)}
                    </Bar>
                    <Bar dataKey="target" name="Target" fill="#3b82f6" fillOpacity={0.4} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeTab === "gaps" && (
              <div className="space-y-4">
                {barData.sort((a, b) => b.gap - a.gap).map((d) => (
                  <div key={d.name} className="card-base p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-sm">{d.name}</div>
                      <div className="flex items-center gap-3 text-xs">
                        <span style={{ color: d.color }}>Current: {d.current}</span>
                        <span style={{ color: "oklch(0.62 0.16 220)" }}>Target: {d.target}</span>
                        <span className="font-semibold" style={{ color: d.gap > 1.5 ? "#ef4444" : d.gap > 0.5 ? "#f97316" : "#22c55e" }}>
                          Gap: {d.gap > 0 ? `+${d.gap}` : d.gap}
                        </span>
                      </div>
                    </div>
                    <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "oklch(0.16 0.012 240)" }}>
                      <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                        style={{ width: `${(d.current / 5) * 100}%`, background: d.color }} />
                      <div className="absolute inset-y-0 left-0 rounded-full opacity-30"
                        style={{ width: `${(d.target / 5) * 100}%`, background: "#3b82f6" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "heatmap" && (
              <div className="card-base p-5">
                <h3 className="font-semibold mb-4">Capability Heatmap</h3>
                {highVariance.length > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg mb-4"
                    style={{ background: "oklch(0.55 0.22 25 / 0.1)", border: "1px solid oklch(0.55 0.22 25 / 0.3)" }}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.65 0.22 25)" }} />
                    <span className="text-sm" style={{ color: "oklch(0.65 0.22 25)" }}>
                      {highVariance.length} high-variance {highVariance.length === 1 ? "capability" : "capabilities"} detected — facilitator consensus recommended
                    </span>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid oklch(0.22 0.015 240)" }}>
                        <th className="text-left py-2 pr-4 text-xs font-medium" style={{ color: "oklch(0.50 0.01 240)" }}>Capability</th>
                        <th className="text-center py-2 px-3 text-xs font-medium" style={{ color: "oklch(0.50 0.01 240)" }}>Current</th>
                        <th className="text-center py-2 px-3 text-xs font-medium" style={{ color: "oklch(0.50 0.01 240)" }}>Target</th>
                        <th className="text-center py-2 px-3 text-xs font-medium" style={{ color: "oklch(0.50 0.01 240)" }}>Gap</th>
                        <th className="text-center py-2 px-3 text-xs font-medium" style={{ color: "oklch(0.50 0.01 240)" }}>Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {capabilityScores.map((cap: any) => {
                        const gap = (cap.targetScore ?? 0) - (cap.currentScore ?? 0);
                        const isHighVar = highVariance.some((hv: any) => hv.capabilityId === cap.capabilityId);
                        const gapColor = gap > 1.5 ? "#ef4444" : gap > 0.5 ? "#f97316" : "#22c55e";
                        const scoreColor = ["", "#ef4444", "#f97316", "#FFC000", "#22c55e", "#3b82f6"][Math.round(cap.currentScore)] ?? "#6b7280";
                        return (
                          <tr key={cap.capabilityId} style={{ borderBottom: "1px solid oklch(0.16 0.012 240)" }}>
                            <td className="py-2 pr-4">
                              <div className="flex items-center gap-2">
                                {isHighVar && <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: "#f97316" }} />}
                                <span className="text-xs">{cap.capabilityName}</span>
                              </div>
                            </td>
                            <td className="text-center py-2 px-3">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold"
                                style={{ background: `${scoreColor}20`, color: scoreColor }}>
                                {(cap.currentScore ?? 0).toFixed(1)}
                              </span>
                            </td>
                            <td className="text-center py-2 px-3">
                              <span className="text-xs" style={{ color: "oklch(0.62 0.16 220)" }}>
                                {(cap.targetScore ?? 0).toFixed(1)}
                              </span>
                            </td>
                            <td className="text-center py-2 px-3">
                              <span className="text-xs font-medium" style={{ color: gapColor }}>
                                {gap > 0 ? `+${gap.toFixed(1)}` : gap.toFixed(1)}
                              </span>
                            </td>
                            <td className="text-center py-2 px-3">
                              {isHighVar ? (
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.55 0.22 25 / 0.15)", color: "oklch(0.65 0.22 25)" }}>
                                  High
                                </span>
                              ) : (
                                <span className="text-xs" style={{ color: "oklch(0.40 0.01 240)" }}>—</span>
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
    </AppLayout>
  );
}
