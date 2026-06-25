import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, FileText, RefreshCw, Map } from "lucide-react";
import { HORIZON_ORDER, PRIORITY_CONFIG } from "../../../shared/types";
import type { RoadmapHorizon, RoadmapPriority } from "../../../shared/types";

const HORIZON_COLORS: Record<RoadmapHorizon, { bg: string; border: string; text: string }> = {
  "0-3 months": { bg: "oklch(0.55 0.22 25 / 0.08)", border: "oklch(0.55 0.22 25 / 0.3)", text: "oklch(0.65 0.22 25)" },
  "3-12 months": { bg: "oklch(0.78 0.18 75 / 0.08)", border: "oklch(0.78 0.18 75 / 0.3)", text: "oklch(0.88 0.16 75)" },
  "12-24 months": { bg: "oklch(0.62 0.16 220 / 0.08)", border: "oklch(0.62 0.16 220 / 0.3)", text: "oklch(0.72 0.14 220)" },
  "24+ months": { bg: "oklch(0.65 0.18 145 / 0.08)", border: "oklch(0.65 0.18 145 / 0.3)", text: "oklch(0.72 0.16 145)" },
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

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 animate-fade-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <button onClick={() => navigate(`/assessment/${assessmentId}/results`)}
              className="flex items-center gap-1 text-xs mb-2 hover:text-amber-400 transition-colors"
              style={{ color: "oklch(0.50 0.01 240)" }}>
              <ArrowLeft className="w-3 h-3" /> Back to Results
            </button>
            <h1 className="font-display text-2xl font-bold mb-1">Transformation Roadmap</h1>
            <p style={{ color: "oklch(0.60 0.01 240)" }}>{assessment?.name}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => generateMutation.mutate({ assessmentId })}
              disabled={generateMutation.isPending} className="gap-1 text-xs">
              <RefreshCw className={`w-3 h-3 ${generateMutation.isPending ? "animate-spin" : ""}`} />
              {generateMutation.isPending ? "Generating…" : "Regenerate"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate(`/assessment/${assessmentId}/report`)}
              className="gap-1 text-xs">
              <FileText className="w-3 h-3" /> Report
            </Button>
          </div>
        </div>

        {/* Horizon filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setFilterHorizon("all")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
            style={filterHorizon === "all" ? {
              background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)", borderColor: "oklch(0.78 0.18 75)"
            } : { background: "oklch(0.13 0.01 240)", color: "oklch(0.60 0.01 240)", borderColor: "oklch(0.22 0.015 240)" }}>
            All Horizons ({items?.length ?? 0})
          </button>
          {HORIZON_ORDER.map((h) => {
            const hc = HORIZON_COLORS[h];
            const count = items?.filter((i: any) => i.horizon === h).length ?? 0;
            return (
              <button key={h} onClick={() => setFilterHorizon(h)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                style={filterHorizon === h ? {
                  background: hc.bg, color: hc.text, borderColor: hc.border
                } : { background: "oklch(0.13 0.01 240)", color: "oklch(0.60 0.01 240)", borderColor: "oklch(0.22 0.015 240)" }}>
                {h} ({count})
              </button>
            );
          })}
        </div>

        {!items || items.length === 0 ? (
          <div className="card-base p-16 text-center">
            <Map className="w-12 h-12 mx-auto mb-4" style={{ color: "oklch(0.35 0.01 240)" }} />
            <h3 className="font-semibold mb-2">No roadmap items yet</h3>
            <p className="text-sm mb-6" style={{ color: "oklch(0.60 0.01 240)" }}>
              Calculate results first, then generate the transformation roadmap.
            </p>
            <Button onClick={() => generateMutation.mutate({ assessmentId })} disabled={generateMutation.isPending}
              style={{ background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)" }}>
              {generateMutation.isPending ? "Generating…" : "Generate Roadmap"}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {HORIZON_ORDER.map((horizon) => {
              const hItems = grouped[horizon];
              if (!hItems || hItems.length === 0) return null;
              const hc = HORIZON_COLORS[horizon];
              return (
                <div key={horizon}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="px-3 py-1 rounded-lg text-xs font-semibold border"
                      style={{ background: hc.bg, borderColor: hc.border, color: hc.text }}>
                      {horizon}
                    </div>
                    <div className="flex-1 h-px" style={{ background: hc.border }} />
                    <span className="text-xs" style={{ color: "oklch(0.50 0.01 240)" }}>{hItems.length} items</span>
                  </div>
                  <div className="grid gap-3">
                    {hItems.map((item: any) => {
                      const pc = PRIORITY_CONFIG[item.priority as RoadmapPriority];
                      return (
                        <div key={item.id} className="card-base p-4 hover:border-amber-500/20 transition-all">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ background: pc?.bg, color: pc?.color }}>
                                  {item.priority}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: "oklch(0.16 0.012 240)", color: "oklch(0.60 0.01 240)" }}>
                                  {item.domainName}
                                </span>
                                {item.capabilityName && (
                                  <span className="text-xs" style={{ color: "oklch(0.50 0.01 240)" }}>
                                    · {item.capabilityName}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                              {item.description && (
                                <p className="text-xs" style={{ color: "oklch(0.60 0.01 240)" }}>{item.description}</p>
                              )}
                              {item.rationale && (
                                <p className="text-xs mt-2 italic" style={{ color: "oklch(0.50 0.01 240)" }}>{item.rationale}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <select
                                value={item.status}
                                onChange={(e) => updateItem.mutate({ id: item.id, assessmentId, status: e.target.value as any })}
                                className="text-xs px-2 py-1 rounded-lg border cursor-pointer"
                                style={{ background: "oklch(0.16 0.012 240)", borderColor: "oklch(0.22 0.015 240)", color: "oklch(0.70 0.01 240)" }}>
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Deferred">Deferred</option>
                              </select>
                              <div className="flex items-center gap-2 text-xs">
                                <span style={{ color: "oklch(0.50 0.01 240)" }}>
                                  Gap: {item.gapScore?.toFixed(1) ?? "—"}
                                </span>
                              </div>
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
    </AppLayout>
  );
}
