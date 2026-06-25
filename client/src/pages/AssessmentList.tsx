import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList, ArrowRight, Calendar, User } from "lucide-react";
import { STATUS_CONFIG } from "../../../shared/types";
import type { AssessmentStatus } from "../../../shared/types";

export default function AssessmentList() {
  const { orgId } = useParams<{ orgId: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const orgIdNum = parseInt(orgId ?? "0");

  const { data: org } = trpc.organisations.get.useQuery({ id: orgIdNum }, { enabled: !!orgIdNum });
  const { data: assessments, isLoading } = trpc.assessments.list.useQuery(
    { orgId: orgIdNum },
    { enabled: !!orgIdNum && isAuthenticated }
  );

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 animate-fade-up">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs mb-1" style={{ color: "oklch(0.50 0.01 240)" }}>
              {org?.name ?? "Organisation"}
            </div>
            <h1 className="font-display text-2xl font-bold">Assessments</h1>
          </div>
          <Button onClick={() => navigate(`/org/${orgId}/assessments/create`)}
            className="gap-2" style={{ background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)" }}>
            <Plus className="w-4 h-4" /> New Assessment
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-base p-5 h-24 animate-pulse" style={{ background: "oklch(0.13 0.01 240)" }} />
            ))}
          </div>
        ) : !assessments || assessments.length === 0 ? (
          <div className="card-base p-16 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-4" style={{ color: "oklch(0.35 0.01 240)" }} />
            <h3 className="font-semibold mb-2">No assessments yet</h3>
            <p className="text-sm mb-6" style={{ color: "oklch(0.60 0.01 240)" }}>
              Create your first energy maturity assessment to get started.
            </p>
            <Button onClick={() => navigate(`/org/${orgId}/assessments/create`)}
              style={{ background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)" }}>
              Create Assessment
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {assessments.map((a: any) => {
              const statusCfg = STATUS_CONFIG[a.status as AssessmentStatus];
              return (
                <div key={a.id} className="card-base p-5 cursor-pointer hover:border-amber-500/30 transition-all duration-200 group"
                  onClick={() => navigate(`/assessment/${a.id}/workspace`)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold group-hover:text-amber-400 transition-colors truncate">{a.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusCfg?.className}`}>
                          {statusCfg?.label ?? a.status}
                        </span>
                      </div>
                      {a.description && (
                        <p className="text-sm mb-3 line-clamp-2" style={{ color: "oklch(0.60 0.01 240)" }}>{a.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs" style={{ color: "oklch(0.50 0.01 240)" }}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                        <span>{a.assessmentType ?? "Energy Maturity"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/assessment/${a.id}/results`); }}
                        className="text-xs">Results</Button>
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/assessment/${a.id}/workspace`); }}
                        className="text-xs gap-1" style={{ background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)" }}>
                        Open <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
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
