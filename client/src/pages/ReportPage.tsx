import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Zap } from "lucide-react";
import { EMS_LEVELS, MATURITY_LABELS, HORIZON_ORDER, PRIORITY_CONFIG } from "../../../shared/types";
import type { RoadmapPriority } from "../../../shared/types";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from "recharts";

const DOMAIN_COLORS = [
  "#FFC000", "#3b82f6", "#22c55e", "#f97316",
  "#a855f7", "#06b6d4", "#ec4899", "#84cc16"
];

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const assessmentId = parseInt(id ?? "0");

  const { data: assessment } = trpc.assessments.get.useQuery({ id: assessmentId }, { enabled: !!assessmentId });
  const { data: snapshot } = trpc.results.getSnapshot.useQuery({ assessmentId }, { enabled: !!assessmentId });
  const { data: roadmapItems } = trpc.roadmap.list.useQuery({ assessmentId }, { enabled: !!assessmentId });
  const { data: template } = trpc.templates.get.useQuery(
    { id: assessment?.templateId ?? 0 },
    { enabled: !!assessment?.templateId }
  );

  const domainScores = (snapshot?.domainScores as any[]) ?? [];
  const emsLevel = snapshot?.emsMaturityLevel as number ?? 0;
  const emsInfo = EMS_LEVELS[emsLevel];

  const radarData = domainScores.map((d: any) => ({
    domain: d.domainName,
    current: parseFloat((d.currentScore ?? 0).toFixed(2)),
    target: parseFloat((d.targetScore ?? 0).toFixed(2)),
  }));

  const barData = domainScores.map((d: any, i: number) => ({
    name: d.domainName,
    current: parseFloat((d.currentScore ?? 0).toFixed(2)),
    target: parseFloat((d.targetScore ?? 0).toFixed(2)),
    color: DOMAIN_COLORS[i % DOMAIN_COLORS.length],
  }));

  const handlePrint = () => window.print();

  return (
    <AppLayout>
      {/* Print controls — hidden in print */}
      <div className="p-6 no-print">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(`/assessment/${assessmentId}/roadmap`)}
            className="flex items-center gap-1 text-xs hover:text-red-600 transition-colors"
            style={{ color: "#727272" }}>
            <ArrowLeft className="w-3 h-3" /> Back to Roadmap
          </button>
          <Button onClick={handlePrint} className="gap-2"
            style={{ background: "#e2232a", color: "#1e3640" }}>
            <Printer className="w-4 h-4" /> Print / Export PDF
          </Button>
        </div>
        <div className="p-3 rounded-lg text-sm mb-6"
          style={{ background: "oklch(0.62 0.16 220 / 0.1)", border: "1px solid oklch(0.62 0.16 220 / 0.3)", color: "oklch(0.72 0.14 220)" }}>
          Use your browser's Print function (Ctrl+P / Cmd+P) and select "Save as PDF" for a board-ready document.
        </div>
      </div>

      {/* ── PRINTABLE REPORT ── */}
      <div id="report-content" className="report-page px-10 py-8 max-w-4xl mx-auto">
        {/* Cover */}
        <div className="report-cover mb-10 p-8 rounded-2xl"
          style={{ background: "#f0f0f0", border: "1px solid #d8d8d8" }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#e2232a" }}>
              <Zap className="w-5 h-5" style={{ color: "#1e3640" }} />
            </div>
            <div>
              <div className="font-display font-bold text-lg">Utility IQ</div>
              <div className="text-xs" style={{ color: "#727272" }}>by IOT.nxt</div>
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Energy Maturity Assessment Report</h1>
          <h2 className="text-xl mb-6" style={{ color: "#e2232a" }}>{assessment?.name}</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs mb-1" style={{ color: "#727272" }}>STATUS</div>
              <div className="text-sm font-medium">{assessment?.status}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "#727272" }}>DATE</div>
              <div className="text-sm font-medium">{assessment?.createdAt ? new Date(assessment.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }) : "—"}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: "#727272" }}>FRAMEWORK</div>
              <div className="text-sm font-medium">{template?.name ?? "Energy Maturity Assessment"}</div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        {snapshot && (
          <section className="mb-10">
            <h2 className="font-display text-xl font-bold mb-4 pb-2 border-b" style={{ borderColor: "#d8d8d8" }}>
              Executive Summary
            </h2>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Overall Score", value: `${(snapshot.overallScore as number ?? 0).toFixed(2)}/5`, color: "#e2232a" },
                { label: "Target Score", value: `${(snapshot.overallTargetScore as number ?? 0).toFixed(2)}/5`, color: "#1e3640" },
                { label: "Maturity Gap", value: `${((snapshot.overallTargetScore as number ?? 0) - (snapshot.overallScore as number ?? 0)).toFixed(2)}`, color: "#e2232a" },
                { label: "EMS Level", value: emsInfo ? `L${emsLevel} — ${emsInfo.label}` : "—", color: emsInfo?.color ?? "#727272" },
              ].map((kpi) => (
                <div key={kpi.label} className="p-4 rounded-xl text-center"
                  style={{ background: "#f0f0f0", border: "1px solid #d8d8d8" }}>
                  <div className="font-display text-2xl font-bold mb-1" style={{ color: kpi.color }}>{kpi.value}</div>
                  <div className="text-xs" style={{ color: "#727272" }}>{kpi.label}</div>
                </div>
              ))}
            </div>
            {emsInfo && (
              <div className="p-4 rounded-xl" style={{ background: `${emsInfo.color}10`, border: `1px solid ${emsInfo.color}30` }}>
                <p className="text-sm" style={{ color: "oklch(0.80 0.01 240)" }}>
                  This organisation is currently operating at <strong style={{ color: emsInfo.color }}>EMS Level {emsLevel} — {emsInfo.label} ({emsInfo.description})</strong>.
                  {emsLevel < 5 && ` The assessment identifies a maturity gap of ${((snapshot.overallTargetScore as number ?? 0) - (snapshot.overallScore as number ?? 0)).toFixed(2)} points, with a transformation roadmap of ${roadmapItems?.length ?? 0} prioritised initiatives to close this gap.`}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Maturity Radar */}
        {radarData.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-xl font-bold mb-4 pb-2 border-b" style={{ borderColor: "#d8d8d8" }}>
              Maturity Profile
            </h2>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl" style={{ background: "#f0f0f0", border: "1px solid #d8d8d8" }}>
                <h3 className="text-sm font-semibold mb-3">Radar Overview</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#d8d8d8" />
                    <PolarAngleAxis dataKey="domain" tick={{ fill: "#727272", fontSize: 10 }} />
                    <Radar name="Current" dataKey="current" stroke="#FFC000" fill="#FFC000" fillOpacity={0.15} strokeWidth={2} />
                    <Radar name="Target" dataKey="target" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeWidth={2} strokeDasharray="4 4" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "#f0f0f0", border: "1px solid #d8d8d8" }}>
                <h3 className="text-sm font-semibold mb-3">Domain Scores</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d8d8d8" />
                    <XAxis dataKey="name" tick={{ fill: "#727272", fontSize: 9 }} angle={-30} textAnchor="end" />
                    <YAxis domain={[0, 5]} tick={{ fill: "#727272", fontSize: 10 }} />
                    <Bar dataKey="current" name="Current" radius={[3, 3, 0, 0]}>
                      {barData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.8} />)}
                    </Bar>
                    <Bar dataKey="target" name="Target" fill="#3b82f6" fillOpacity={0.4} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* Domain Detail Table */}
        {domainScores.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-xl font-bold mb-4 pb-2 border-b" style={{ borderColor: "#d8d8d8" }}>
              Domain Maturity Scores
            </h2>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#d8d8d8" }}>
              <table className="w-full text-sm">
                <thead style={{ background: "#f0f0f0" }}>
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#727272" }}>Domain</th>
                    <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: "#727272" }}>Current</th>
                    <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: "#727272" }}>Target</th>
                    <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: "#727272" }}>Gap</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "#727272" }}>Maturity Level</th>
                  </tr>
                </thead>
                <tbody>
                  {domainScores.map((d: any, i: number) => {
                    const gap = (d.targetScore ?? 0) - (d.currentScore ?? 0);
                    const gapColor = gap > 1.5 ? "#ef4444" : gap > 0.5 ? "#f97316" : "#22c55e";
                    return (
                      <tr key={d.domainId} style={{ borderTop: "1px solid #e8e8e8" }}>
                        <td className="px-4 py-3 font-medium text-sm">{d.domainName}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold" style={{ color: DOMAIN_COLORS[i % DOMAIN_COLORS.length] }}>
                            {(d.currentScore ?? 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm" style={{ color: "#1e3640" }}>
                          {(d.targetScore ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold text-sm" style={{ color: gapColor }}>
                            {gap > 0 ? `+${gap.toFixed(2)}` : gap.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "#727272" }}>
                          {MATURITY_LABELS[Math.round(d.currentScore ?? 0)] ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Roadmap */}
        {roadmapItems && roadmapItems.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-xl font-bold mb-4 pb-2 border-b" style={{ borderColor: "#d8d8d8" }}>
              Transformation Roadmap
            </h2>
            {HORIZON_ORDER.map((horizon) => {
              const hItems = roadmapItems.filter((i: any) => i.horizon === horizon);
              if (!hItems.length) return null;
              return (
                <div key={horizon} className="mb-6">
                  <h3 className="text-sm font-semibold mb-3 px-3 py-1.5 rounded-lg w-fit"
                    style={{ background: "rgba(226,35,42,0.08)", color: "#e2232a", border: "1px solid rgba(226,35,42,0.20)" }}>
                    {horizon}
                  </h3>
                  <div className="space-y-2">
                    {hItems.map((item: any) => {
                      const pc = PRIORITY_CONFIG[item.priority as RoadmapPriority];
                      return (
                        <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg"
                          style={{ background: "#f0f0f0", border: "1px solid #d8d8d8" }}>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5"
                            style={{ background: pc?.bg, color: pc?.color }}>
                            {item.priority}
                          </span>
                          <div>
                            <div className="text-sm font-medium">{item.title}</div>
                            {item.description && (
                              <div className="text-xs mt-0.5" style={{ color: "#727272" }}>{item.description}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Footer */}
        <div className="pt-6 border-t text-center" style={{ borderColor: "#d8d8d8" }}>
          <p className="text-xs" style={{ color: "oklch(0.40 0.01 240)" }}>
            Generated by Utility IQ — IOT.nxt Energy Maturity Platform · {new Date().toLocaleDateString("en-ZA")}
          </p>
          <p className="text-xs mt-1" style={{ color: "#c9c9c9" }}>
            CONFIDENTIAL — For internal use only
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
