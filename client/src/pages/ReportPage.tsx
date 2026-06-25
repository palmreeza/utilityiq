import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { ArrowLeft, Printer, Zap, Info } from "lucide-react";
import { EMS_LEVELS, MATURITY_LABELS, HORIZON_ORDER, PRIORITY_CONFIG } from "../../../shared/types";
import type { RoadmapPriority } from "../../../shared/types";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from "recharts";

const DOMAIN_PALETTE = [
  "#e2232a", "#1e3640", "#1a9e6e", "#d97706",
  "#8c191c", "#44ebca", "#0f7a55", "#c0392b"
];

const HORIZON_COLORS: Record<string, string> = {
  "0-3 months":   "#e2232a",
  "3-12 months":  "#d97706",
  "12-24 months": "#1e3640",
  "24+ months":   "#1a9e6e",
};

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
  const overallScore = snapshot?.overallScore as number ?? 0;
  const overallTarget = snapshot?.overallTargetScore as number ?? 0;
  const gap = overallTarget - overallScore;

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
    color: DOMAIN_PALETTE[i % DOMAIN_PALETTE.length],
  }));

  const handlePrint = () => window.print();

  return (
    <AppLayout>
      {/* ── Print controls (hidden when printing) ── */}
      <div className="no-print px-6 lg:px-8 py-4 border-b flex items-center justify-between sticky top-0 z-10"
        style={{ background: "#ffffff", borderColor: "#e5e5e5" }}>
        <button onClick={() => navigate(`/assessment/${assessmentId}/roadmap`)}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "#727272" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e2232a")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#727272")}>
          <ArrowLeft className="w-4 h-4" /> Back to Roadmap
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
            style={{ background: "rgba(30,54,64,0.06)", color: "#1e3640" }}>
            <Info className="w-3.5 h-3.5" />
            Use Ctrl+P / Cmd+P → Save as PDF for a board-ready document
          </div>
          <button onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
            style={{ background: "#e2232a", boxShadow: "0 4px 12px rgba(226,35,42,0.30)" }}>
            <Printer className="w-4 h-4" /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          PRINTABLE REPORT
      ══════════════════════════════════════════════════ */}
      <div id="report-content" className="report-page max-w-4xl mx-auto px-8 py-10">

        {/* ── Cover ── */}
        <div className="mb-12 rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1e3640 0%, #0d1f26 100%)" }}>
          {/* Red accent bar */}
          <div className="h-1.5" style={{ background: "#e2232a" }} />
          <div className="p-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "#e2232a" }}>
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-display font-bold text-xl text-white">Utility IQ</div>
                <div className="text-xs font-medium tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.45)" }}>by IOT.nxt</div>
              </div>
            </div>

            {/* Title block */}
            <div className="mb-10">
              <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#44ebca" }}>
                Energy Maturity Assessment Report
              </div>
              <h1 className="font-display font-bold text-white mb-2"
                style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                {assessment?.name ?? "Assessment Report"}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.50)" }}>{template?.name ?? "Energy Maturity Assessment"}</p>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Status",    value: assessment?.status ?? "—" },
                { label: "Date",      value: assessment?.createdAt ? new Date(assessment.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" }) : "—" },
                { label: "Framework", value: template?.name ?? "Energy Maturity Assessment" },
              ].map((m) => (
                <div key={m.label} className="p-4 rounded-2xl border"
                  style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.10)" }}>
                  <div className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{m.label}</div>
                  <div className="text-sm font-semibold text-white">{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Executive Summary ── */}
        {snapshot && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-display font-bold text-2xl" style={{ color: "#252525" }}>Executive Summary</h2>
              <div className="flex-1 h-px" style={{ background: "#e5e5e5" }} />
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Overall Score", value: `${overallScore.toFixed(2)}`, suffix: "/5", color: "#e2232a" },
                { label: "Target Score",  value: `${overallTarget.toFixed(2)}`, suffix: "/5", color: "#1e3640" },
                { label: "Maturity Gap",  value: gap.toFixed(2),               suffix: " pts", color: gap > 1.5 ? "#e2232a" : gap > 0.5 ? "#d97706" : "#1a9e6e" },
                { label: "EMS Level",     value: emsInfo ? `L${emsLevel}` : "—", suffix: emsInfo ? ` ${emsInfo.label}` : "", color: emsInfo?.color ?? "#727272" },
              ].map((kpi) => (
                <div key={kpi.label} className="p-5 rounded-2xl border-2 text-center"
                  style={{ borderColor: `${kpi.color}25`, background: `${kpi.color}06` }}>
                  <div className="font-display font-bold text-3xl mb-1" style={{ color: kpi.color }}>
                    {kpi.value}
                    <span className="text-base font-normal" style={{ color: "#c9c9c9" }}>{kpi.suffix}</span>
                  </div>
                  <div className="text-xs font-medium" style={{ color: "#727272" }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* EMS narrative */}
            {emsInfo && (
              <div className="p-5 rounded-2xl border-l-4"
                style={{ background: `${emsInfo.color}08`, borderColor: emsInfo.color }}>
                <p className="text-sm leading-relaxed" style={{ color: "#252525" }}>
                  This organisation is currently operating at{" "}
                  <strong style={{ color: emsInfo.color }}>EMS Level {emsLevel} — {emsInfo.label} ({emsInfo.description})</strong>.
                  {emsLevel < 5 && (
                    <> The assessment identifies a maturity gap of <strong style={{ color: "#e2232a" }}>{gap.toFixed(2)} points</strong>, with a transformation roadmap of{" "}
                    <strong>{roadmapItems?.length ?? 0} prioritised initiatives</strong> to close this gap.</>
                  )}
                </p>
              </div>
            )}
          </section>
        )}

        {/* ── Maturity Profile ── */}
        {radarData.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-display font-bold text-2xl" style={{ color: "#252525" }}>Maturity Profile</h2>
              <div className="flex-1 h-px" style={{ background: "#e5e5e5" }} />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl border" style={{ borderColor: "#e5e5e5" }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: "#252525" }}>Radar Overview</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#f0f0f0" />
                    <PolarAngleAxis dataKey="domain" tick={{ fill: "#727272", fontSize: 10, fontWeight: 500 }} />
                    <Radar name="Current" dataKey="current" stroke="#e2232a" fill="#e2232a" fillOpacity={0.12} strokeWidth={2.5} />
                    <Radar name="Target" dataKey="target" stroke="#1e3640" fill="#1e3640" fillOpacity={0.06} strokeWidth={2} strokeDasharray="5 4" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="p-5 rounded-2xl border" style={{ borderColor: "#e5e5e5" }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: "#252525" }}>Domain Scores</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 55 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#727272", fontSize: 9 }} angle={-30} textAnchor="end" />
                    <YAxis domain={[0, 5]} tick={{ fill: "#727272", fontSize: 10 }} tickCount={6} />
                    <Bar dataKey="current" name="Current" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                    <Bar dataKey="target" name="Target" fill="#1e3640" fillOpacity={0.20} radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* ── Domain Detail Table ── */}
        {domainScores.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-display font-bold text-2xl" style={{ color: "#252525" }}>Domain Maturity Scores</h2>
              <div className="flex-1 h-px" style={{ background: "#e5e5e5" }} />
            </div>
            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "#e5e5e5" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#f8f8f8", borderBottom: "2px solid #e5e5e5" }}>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold tracking-widest uppercase" style={{ color: "#c9c9c9" }}>Domain</th>
                    <th className="text-center px-5 py-3.5 text-[10px] font-bold tracking-widest uppercase" style={{ color: "#c9c9c9" }}>Current</th>
                    <th className="text-center px-5 py-3.5 text-[10px] font-bold tracking-widest uppercase" style={{ color: "#c9c9c9" }}>Target</th>
                    <th className="text-center px-5 py-3.5 text-[10px] font-bold tracking-widest uppercase" style={{ color: "#c9c9c9" }}>Gap</th>
                    <th className="text-left px-5 py-3.5 text-[10px] font-bold tracking-widest uppercase" style={{ color: "#c9c9c9" }}>Maturity Level</th>
                  </tr>
                </thead>
                <tbody>
                  {domainScores.map((d: any, i: number) => {
                    const domGap = (d.targetScore ?? 0) - (d.currentScore ?? 0);
                    const gapColor = domGap > 1.5 ? "#e2232a" : domGap > 0.5 ? "#d97706" : "#1a9e6e";
                    const domColor = DOMAIN_PALETTE[i % DOMAIN_PALETTE.length];
                    return (
                      <tr key={d.domainId} style={{ borderBottom: "1px solid #f5f5f5" }}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: domColor }} />
                            <span className="font-semibold text-sm" style={{ color: "#252525" }}>{d.domainName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm"
                            style={{ background: `${domColor}15`, color: domColor }}>
                            {(d.currentScore ?? 0).toFixed(1)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="font-semibold text-sm" style={{ color: "#1e3640" }}>
                            {(d.targetScore ?? 0).toFixed(1)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg font-bold text-xs"
                            style={{ background: `${gapColor}12`, color: gapColor }}>
                            {domGap > 0 ? `+${domGap.toFixed(2)}` : domGap.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm" style={{ color: "#727272" }}>
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

        {/* ── Transformation Roadmap ── */}
        {roadmapItems && roadmapItems.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-display font-bold text-2xl" style={{ color: "#252525" }}>Transformation Roadmap</h2>
              <div className="flex-1 h-px" style={{ background: "#e5e5e5" }} />
            </div>
            {HORIZON_ORDER.map((horizon) => {
              const hItems = roadmapItems.filter((i: any) => i.horizon === horizon);
              if (!hItems.length) return null;
              const hColor = HORIZON_COLORS[horizon] ?? "#727272";
              return (
                <div key={horizon} className="mb-7">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2"
                      style={{ background: `${hColor}08`, borderColor: `${hColor}30` }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: hColor }} />
                      <span className="text-sm font-bold" style={{ color: hColor }}>{horizon}</span>
                    </div>
                    <div className="flex-1 h-px" style={{ background: `${hColor}25` }} />
                    <span className="text-xs" style={{ color: "#c9c9c9" }}>{hItems.length} item{hItems.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="space-y-2.5">
                    {hItems.map((item: any) => {
                      const pc = PRIORITY_CONFIG[item.priority as RoadmapPriority];
                      return (
                        <div key={item.id} className="flex items-start gap-3 p-4 rounded-2xl border"
                          style={{ background: "#fafafa", borderColor: "#f0f0f0" }}>
                          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold flex-shrink-0 mt-0.5"
                            style={{ background: pc?.bg ?? "#f0f0f0", color: pc?.color ?? "#727272" }}>
                            {item.priority}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm mb-0.5" style={{ color: "#252525" }}>{item.title}</div>
                            {item.description && (
                              <div className="text-xs" style={{ color: "#727272" }}>{item.description}</div>
                            )}
                          </div>
                          <div className="text-xs flex-shrink-0" style={{ color: "#c9c9c9" }}>
                            {item.domainName}
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

        {/* ── Footer ── */}
        <div className="pt-6 border-t" style={{ borderColor: "#e5e5e5" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#e2232a" }}>
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-bold" style={{ color: "#252525" }}>Utility IQ</span>
              <span className="text-xs" style={{ color: "#c9c9c9" }}>by IOT.nxt</span>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium" style={{ color: "#727272" }}>
                Generated {new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              <p className="text-xs" style={{ color: "#c9c9c9" }}>CONFIDENTIAL — For internal use only</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
