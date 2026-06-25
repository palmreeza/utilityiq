import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { ArrowLeft, Clock, User } from "lucide-react";

export default function AuditLogPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const assessmentId = parseInt(id ?? "0");

  const { data: assessment } = trpc.assessments.get.useQuery({ id: assessmentId }, { enabled: !!assessmentId });
  const { data: entries, isLoading } = trpc.audit.list.useQuery({ assessmentId }, { enabled: !!assessmentId });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 animate-fade-up">
        <button onClick={() => navigate(`/assessment/${assessmentId}/workspace`)}
          className="flex items-center gap-1 text-xs mb-4 hover:text-amber-400 transition-colors"
          style={{ color: "oklch(0.50 0.01 240)" }}>
          <ArrowLeft className="w-3 h-3" /> Back
        </button>
        <h1 className="font-display text-2xl font-bold mb-1">Audit Log</h1>
        <p className="mb-6" style={{ color: "oklch(0.60 0.01 240)" }}>{assessment?.name}</p>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "oklch(0.13 0.01 240)" }} />
            ))}
          </div>
        ) : !entries || entries.length === 0 ? (
          <div className="card-base p-12 text-center">
            <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: "oklch(0.35 0.01 240)" }} />
            <p style={{ color: "oklch(0.60 0.01 240)" }}>No audit events recorded yet.</p>
          </div>
        ) : (
          <div className="card-base overflow-hidden">
            <div className="divide-y" style={{ borderColor: "oklch(0.16 0.012 240)" }}>
              {entries.map((entry: any) => (
                <div key={entry.id} className="flex items-start gap-4 p-4 hover:bg-elevated transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "oklch(0.78 0.18 75 / 0.1)" }}>
                    <Clock className="w-4 h-4" style={{ color: "oklch(0.78 0.18 75)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium font-mono" style={{ color: "oklch(0.78 0.18 75)" }}>
                        {entry.action}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "oklch(0.50 0.01 240)" }}>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {entry.userName ?? entry.userId}
                      </span>
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                      <div className="mt-1 text-xs font-mono px-2 py-1 rounded" style={{ background: "oklch(0.13 0.01 240)", color: "oklch(0.60 0.01 240)" }}>
                        {JSON.stringify(entry.metadata)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
