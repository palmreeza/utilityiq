import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import {
  Zap, Building2, ClipboardList, TrendingUp, Plus, ArrowRight,
  CheckCircle2, Clock, AlertCircle, FileText
} from "lucide-react";
import { STATUS_CONFIG } from "../../../shared/types";

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: orgs, isLoading: orgsLoading } = trpc.organisations.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading || orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.10 0.01 240)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const isPlatformOwner = (user as any)?.platformRole === "platform_owner" || user?.role === "admin";

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 animate-fade-up">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold mb-1">Welcome back, {user?.name?.split(" ")[0] ?? "there"}</h1>
          <p style={{ color: "oklch(0.60 0.01 240)" }}>
            {isPlatformOwner ? "Platform Owner — full access to all organisations" : "Your energy maturity assessments"}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Building2, label: "Organisations", value: orgs?.length ?? 0, color: "oklch(0.78 0.18 75)" },
            { icon: ClipboardList, label: "Active Assessments", value: "—", color: "oklch(0.62 0.16 220)" },
            { icon: TrendingUp, label: "Avg Maturity Score", value: "—", color: "oklch(0.65 0.18 145)" },
            { icon: FileText, label: "Reports Generated", value: "—", color: "oklch(0.55 0.22 25)" },
          ].map((kpi) => (
            <div key={kpi.label} className="stat-card animate-fade-up">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}20` }}>
                  <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
              </div>
              <div className="font-display text-2xl font-bold mb-1" style={{ color: kpi.color }}>{kpi.value}</div>
              <div className="text-xs" style={{ color: "oklch(0.60 0.01 240)" }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Organisations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Your Organisations</h2>
            {isPlatformOwner && (
              <Button size="sm" onClick={() => navigate("/admin")}
                className="gap-2" style={{ background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)" }}>
                <Plus className="w-4 h-4" /> New Organisation
              </Button>
            )}
          </div>

          {!orgs || orgs.length === 0 ? (
            <div className="card-base p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: "oklch(0.35 0.01 240)" }} />
              <h3 className="font-semibold mb-2">No organisations yet</h3>
              <p className="text-sm mb-6" style={{ color: "oklch(0.60 0.01 240)" }}>
                {isPlatformOwner
                  ? "Create your first organisation to start managing assessments."
                  : "You have not been added to any organisations yet. Contact your Platform Owner."}
              </p>
              {isPlatformOwner && (
                <Button onClick={() => navigate("/admin")} style={{ background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)" }}>
                  Create Organisation
                </Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orgs.map((org: any) => (
                <div key={org.id} className="card-base p-5 cursor-pointer hover:border-amber-500/30 transition-all duration-200 group"
                  onClick={() => navigate(`/org/${org.id}/assessments`)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
                      style={{ background: "oklch(0.78 0.18 75 / 0.15)", color: "oklch(0.88 0.16 75)" }}>
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: "oklch(0.65 0.18 145 / 0.15)", color: "oklch(0.72 0.16 145)" }}>
                      {org.role ? org.role.replace("_", " ") : "Member"}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-amber-400 transition-colors">{org.name}</h3>
                  <p className="text-xs mb-4" style={{ color: "oklch(0.50 0.01 240)" }}>
                    {org.industry ?? "Energy & Utilities"} {org.country ? `· ${org.country}` : ""}
                  </p>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "oklch(0.60 0.01 240)" }}>
                    <span>View Assessments</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: ClipboardList, title: "Start Assessment", desc: "Create a new maturity assessment for an organisation", action: () => orgs?.[0] && navigate(`/org/${orgs[0].id}/assessments/create`) },
              { icon: TrendingUp, title: "View Results", desc: "Review scoring results and gap analysis", action: () => orgs?.[0] && navigate(`/org/${orgs[0].id}/assessments`) },
              { icon: FileText, title: "Generate Report", desc: "Produce a board-ready PDF report", action: () => orgs?.[0] && navigate(`/org/${orgs[0].id}/assessments`) },
            ].map((qa) => (
              <button key={qa.title} onClick={qa.action} className="card-base p-5 text-left hover:border-amber-500/30 transition-all duration-200 group">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: "oklch(0.78 0.18 75 / 0.1)" }}>
                  <qa.icon className="w-4 h-4" style={{ color: "oklch(0.78 0.18 75)" }} />
                </div>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-amber-400 transition-colors">{qa.title}</h3>
                <p className="text-xs" style={{ color: "oklch(0.50 0.01 240)" }}>{qa.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
