import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, FileText, RefreshCw, Map, Clock, CheckCircle2, Circle, Pause } from "lucide-react";
import { HORIZON_ORDER, PRIORITY_CONFIG } from "../../../shared/types";
import type { RoadmapHorizon, RoadmapPriority } from "../../../shared/types";

const HORIZON_CONFIG: Record<RoadmapHorizon, { label: string; color: string; bg: string; border: string; accent: string }> = {
  "0-3 months":   { label: "Immediate",   color: "#e2232a", bg: "rgba(226,35,42,0.08)",   border: "rgba(226,35,42,0.25)",  accent: "#e2232a" },
  "3-12 months":  { label: "Short-Term",  color: "#d97706", bg: "rgba(217,119,6,0.08)",   border: "rgba(217,119,6,0.25)",  accent: "#d97706" },
  "12-24 months": { label: "Medium-Term", color: "#1e3640", bg: "rgba(30,54,64,0.06)",    border: "rgba(30,54,64,0.20)",   accent: "#1e3640" },
  "24+ months":   { label: "Strategic",   color: "#1a9e6e", bg: "rgba(26,158,110,0.08)",  border: "rgba(26,158,110,0.25)", accent: "#1a9e6e" },
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  "Pending":     <Circle className="w-3.5 h-3.5" />,
  "In Progress": <Clock className="w-3.5 h-3.5" />,
  "Completed":   <CheckCircle2 className="w-3.5 h-3.5" />,
  "Deferred":    <Pause className="w-3.5 h-3.5" />,
};

const STATUS_COLORS: Record<string, string> = {
  "Pending":     "#727272",
  "In Progress": "#d97706",
  "Completed":   "#1a9e6e",
  "Deferred":    "#c9c9c9",
};

export default function RoadmapPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const assessmentId = parseInt(id ?? "0");
  const [filterHorizon, setFilterHorizon] = useState<RoadmapHorizon | "all">("all");

  const { data: assessment } = trpc.assessments.get.useQuery({ id: assessmentId }, { enabled: !!assessmentId });
  const { data: items, refetch } = trpc.roadmap.list.useQuery({ assessmentId }, { enabled: !!assessmentId });

  const generateMutation = trpc.roadmap.generate.useMutation({
    onSuccess: (data) => { toast.success(`${data.generated} roadmap items generated`); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const updateItem = trpc.roadmap.updateItem.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => toast.error(err.message),
  });

  const filtered = filterHorizon === "all" ? items : items?.filter((i: any) => i.horizon === filterHorizon);
  const grouped = HORIZON_ORDER.reduce((acc, h) => {
    acc[h] = (filtered ?? []).filter((i: any) => i.horizon === h);
    return acc;
  }, {} as Record<RoadmapHorizon, any[]>);

  const totalItems = items?.length ?? 0;
  const completedItems = items?.filter((i: any) => i.status === "Completed").length ?? 0;
  const inProgressItems = items?.filter((i: any) => i.status === "In Progress").length ?? 0;
  const completionPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <AppLayout>
      <div className="min-h-full" style={{ background: "#f5f5f5" }}>

        {/* ── Hero header ── */}
        <div className="relative overflow-hidden px-6 lg:px-8 pt-8 pb-8"
          style={{ background: "linear-gradient(135deg, #1e3640 0%, #0d1f26 100%)" }}>
          <div className="absolute top-0 right-0 w-80 h-40 rounded-full blur-3xl opacity-15 pointer-events-none"
            style={{ background: "#e2232a" }} />
          <div className="absolute bottom-0 left-1/4 w-48 h-24 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ background: "#44ebca" }} />

          <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <button onClick={() => navigate(`/assessment/${assessmentId}/results`)}
                className="flex items-center gap-1.5 text-xs mb-4 transition-colors"
                style={{ color: "rgba(255,255,255,0.40)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.40)")}>
                <ArrowLeft className="w-3 h-3" /> Back to Results
              </button>
              <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#44ebca" }}>Transformation Roadmap</div>
              <h1 className="font-display font-bold text-white mb-1"
                style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", letterSpacing: "-0.02em" }}>
                {assessment?.name ?? "Roadmap"}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.50)" }}>Prioritised actions across four delivery horizons</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => generateMutation.mutate({ assessmentId })}
                disabled={generateMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
                style={{ borderColor: "rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.70)", background: "rgba(255,255,255,0.06)" }}>
                <RefreshCw className={`w-3.5 h-3.5 ${generateMutation.isPending ? "animate-spin" : ""}`} />
                {generateMutation.isPending ? "Generating…" : "Regenerate"}
              </button>
              <button onClick={() => navigate(`/assessment/${assessmentId}/report`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                style={{ background: "#e2232a", boxShadow: "0 2px 8px rgba(226,35,42,0.35)" }}>
                <FileText className="w-3.5 h-3.5" /> Report
              </button>
            </div>
          </div>

          {/* Progress strip */}
          {totalItems > 0 && (
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {[
                { label: "Total Items",  value: totalItems,       color: "#ffffff" },
                { label: "In Progress",  value: inProgressItems,  color: "#d97706" },
                { label: "Completed",    value: completedItems,   color: "#1a9e6e" },
                { label: "Completion",   value: `${completionPct}%`, color: "#44ebca" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl p-4 border"
                  style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.10)" }}>
                  <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {s.label}
                  </div>
                  <div className="font-display font-bold text-2xl" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="px-6 lg:px-8 py-6">

          {/* Horizon filter pills */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button onClick={() => setFilterHorizon("all")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
              style={filterHorizon === "all" ? {
                background: "#1e3640", color: "#ffffff", borderColor: "#1e3640"
              } : {
                background: "#ffffff", color: "#727272", borderColor: "#e5e5e5"
              }}>
              All Horizons
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: filterHorizon === "all" ? "rgba(255,255,255,0.20)" : "#f0f0f0" }}>
                {totalItems}
              </span>
            </button>
            {HORIZON_ORDER.map((h) => {
              const hc = HORIZON_CONFIG[h];
              const count = items?.filter((i: any) => i.horizon === h).length ?? 0;
              return (
                <button key={h} onClick={() => setFilterHorizon(h)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
                  style={filterHorizon === h ? {
                    background: hc.color, color: "#ffffff", borderColor: hc.color
                  } : {
                    background: "#ffffff", color: "#727272", borderColor: "#e5e5e5"
                  }}>
                  {h}
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: filterHorizon === h ? "rgba(255,255,255,0.25)" : "#f0f0f0" }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {!items || items.length === 0 ? (
            <div className="bg-white rounded-2xl border p-16 text-center" style={{ borderColor: "#e5e5e5" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(226,35,42,0.08)" }}>
                <Map className="w-8 h-8" style={{ color: "#e2232a" }} />
              </div>
              <h3 className="font-display font-bold text-xl mb-2" style={{ color: "#252525" }}>No roadmap items yet</h3>
              <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "#727272" }}>
                Calculate results first, then generate the transformation roadmap from the Results Dashboard.
              </p>
              <button onClick={() => generateMutation.mutate({ assessmentId })}
                disabled={generateMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95"
                style={{ background: "#e2232a" }}>
                <RefreshCw className={`w-4 h-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />
                {generateMutation.isPending ? "Generating…" : "Generate Roadmap"}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {HORIZON_ORDER.map((horizon) => {
                const hItems = grouped[horizon];
                if (!hItems || hItems.length === 0) return null;
                const hc = HORIZON_CONFIG[horizon];
                return (
                  <div key={horizon}>
                    {/* Horizon header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl border-2"
                        style={{ background: hc.bg, borderColor: hc.border }}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: hc.color }} />
                        <span className="text-sm font-bold" style={{ color: hc.color }}>{horizon}</span>
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: hc.border, color: hc.color }}>
                          {hc.label}
                        </span>
                      </div>
                      <div className="flex-1 h-px" style={{ background: hc.border }} />
                      <span className="text-xs font-medium" style={{ color: "#727272" }}>{hItems.length} item{hItems.length !== 1 ? "s" : ""}</span>
                    </div>

                    {/* Items grid */}
                    <div className="grid gap-3">
                      {hItems.map((item: any) => {
                        const pc = PRIORITY_CONFIG[item.priority as RoadmapPriority];
                        const statusColor = STATUS_COLORS[item.status] ?? "#727272";
                        return (
                          <div key={item.id}
                            className="bg-white rounded-2xl border-2 p-5 transition-all duration-150"
                            style={{ borderColor: "#f0f0f0" }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = hc.border)}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#f0f0f0")}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                {/* Tags row */}
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                  {/* Priority badge */}
                                  <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold"
                                    style={{ background: pc?.bg ?? "#f0f0f0", color: pc?.color ?? "#727272" }}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: pc?.color ?? "#727272" }} />
                                    {item.priority}
                                  </span>
                                  {/* Domain badge */}
                                  <span className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                                    style={{ background: "#f5f5f5", color: "#727272" }}>
                                    {item.domainName}
                                  </span>
                                  {/* Capability */}
                                  {item.capabilityName && (
                                    <span className="text-[10px] font-medium" style={{ color: "#c9c9c9" }}>
                                      · {item.capabilityName}
                                    </span>
                                  )}
                                  {/* EMS package */}
                                  {item.emsPackage && (
                                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold border"
                                      style={{ background: "rgba(30,54,64,0.06)", borderColor: "rgba(30,54,64,0.15)", color: "#1e3640" }}>
                                      {item.emsPackage}
                                    </span>
                                  )}
                                </div>

                                {/* Title */}
                                <h4 className="font-bold text-sm mb-1.5" style={{ color: "#252525" }}>{item.title}</h4>

                                {/* Description */}
                                {item.description && (
                                  <p className="text-xs leading-relaxed mb-2" style={{ color: "#727272" }}>{item.description}</p>
                                )}

                                {/* Rationale */}
                                {item.rationale && (
                                  <p className="text-xs italic" style={{ color: "#c9c9c9" }}>"{item.rationale}"</p>
                                )}
                              </div>

                              {/* Right controls */}
                              <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                {/* Status selector */}
                                <div className="relative">
                                  <div className="flex items-center gap-1.5 mb-1" style={{ color: statusColor }}>
                                    {STATUS_ICONS[item.status]}
                                    <span className="text-xs font-semibold">{item.status}</span>
                                  </div>
                                  <select
                                    value={item.status}
                                    onChange={(e) => updateItem.mutate({ id: item.id, assessmentId, status: e.target.value as any })}
                                    className="text-[10px] px-2 py-1 rounded-lg border cursor-pointer w-full"
                                    style={{ background: "#f5f5f5", borderColor: "#e5e5e5", color: "#727272" }}>
                                    <option value="Pending">Pending</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Deferred">Deferred</option>
                                  </select>
                                </div>

                                {/* Gap score */}
                                {item.gapScore != null && (
                                  <div className="text-right">
                                    <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#c9c9c9" }}>Gap</div>
                                    <div className="font-display font-bold text-lg" style={{ color: hc.color }}>
                                      {item.gapScore.toFixed(1)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
