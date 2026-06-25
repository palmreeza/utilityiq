import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import {
  Building2, ClipboardList, TrendingUp, Plus, ArrowRight, FileText
} from "lucide-react";

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: orgs, isLoading: orgsLoading } = trpc.organisations.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading || orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f5f5" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#e2232a", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const isPlatformOwner = (user as any)?.platformRole === "platform_owner" || user?.role === "admin";

  const kpis = [
    { icon: Building2,    label: "Organisations",      value: orgs?.length ?? 0, color: "#e2232a",  bg: "rgba(226,35,42,0.08)" },
    { icon: ClipboardList,label: "Active Assessments",  value: "—",               color: "#1e3640",  bg: "rgba(30,54,64,0.08)" },
    { icon: TrendingUp,   label: "Avg Maturity Score",  value: "—",               color: "#1a9e6e",  bg: "rgba(26,158,110,0.08)" },
    { icon: FileText,     label: "Reports Generated",   value: "—",               color: "#44ebca",  bg: "rgba(68,235,202,0.10)" },
  ];

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 animate-fade-up">

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: "#252525" }}>
            Welcome back, {user?.name?.split(" ")[0] ?? "there"}
          </h1>
          <p style={{ color: "#727272" }}>
            {isPlatformOwner ? "Platform Owner — full access to all organisations" : "Your energy maturity assessments"}
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="stat-card animate-fade-up">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: kpi.bg }}>
                  <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                </div>
              </div>
              <div className="font-display text-2xl font-bold mb-1" style={{ color: kpi.color }}>{kpi.value}</div>
              <div className="text-xs" style={{ color: "#727272" }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Organisations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold" style={{ color: "#252525" }}>Your Organisations</h2>
            {isPlatformOwner && (
              <Button size="sm" onClick={() => navigate("/admin")}
                className="gap-2 text-white" style={{ background: "#e2232a" }}>
                <Plus className="w-4 h-4" /> New Organisation
              </Button>
            )}
          </div>

          {!orgs || orgs.length === 0 ? (
            <div className="card-base p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: "#c9c9c9" }} />
              <h3 className="font-semibold mb-2" style={{ color: "#252525" }}>No organisations yet</h3>
              <p className="text-sm mb-6" style={{ color: "#727272" }}>
                {isPlatformOwner
                  ? "Create your first organisation to start managing assessments."
                  : "You have not been added to any organisations yet. Contact your Platform Owner."}
              </p>
              {isPlatformOwner && (
                <Button onClick={() => navigate("/admin")} className="text-white" style={{ background: "#e2232a" }}>
                  Create Organisation
                </Button>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orgs.map((org: any) => (
                <div key={org.id}
                  className="card-base p-5 cursor-pointer transition-all duration-200 group"
                  style={{ borderLeft: "3px solid #e2232a" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(226,35,42,0.12)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                  onClick={() => navigate(`/org/${org.id}/assessments`)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white"
                      style={{ background: "#1e3640" }}>
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full"
                      style={{ background: "rgba(26,158,110,0.10)", color: "#0f7a55" }}>
                      {org.role ? org.role.replace("_", " ") : "Member"}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1 transition-colors" style={{ color: "#252525" }}>{org.name}</h3>
                  <p className="text-xs mb-4" style={{ color: "#727272" }}>
                    {org.industry ?? "Energy & Utilities"} {org.country ? `· ${org.country}` : ""}
                  </p>
                  <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "#e2232a" }}>
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
          <h2 className="font-display text-lg font-semibold mb-4" style={{ color: "#252525" }}>Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: ClipboardList, title: "Start Assessment",  desc: "Create a new maturity assessment for an organisation", color: "#e2232a",  bg: "rgba(226,35,42,0.08)",  action: () => orgs?.[0] && navigate(`/org/${orgs[0].id}/assessments/create`) },
              { icon: TrendingUp,    title: "View Results",      desc: "Review scoring results and gap analysis",              color: "#1e3640",  bg: "rgba(30,54,64,0.08)",   action: () => orgs?.[0] && navigate(`/org/${orgs[0].id}/assessments`) },
              { icon: FileText,      title: "Generate Report",   desc: "Produce a board-ready PDF report",                    color: "#1a9e6e",  bg: "rgba(26,158,110,0.08)", action: () => orgs?.[0] && navigate(`/org/${orgs[0].id}/assessments`) },
            ].map((qa) => (
              <button key={qa.title} onClick={qa.action}
                className="card-base p-5 text-left transition-all duration-200 group"
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = qa.color; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ""; }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: qa.bg }}>
                  <qa.icon className="w-4 h-4" style={{ color: qa.color }} />
                </div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: "#252525" }}>{qa.title}</h3>
                <p className="text-xs" style={{ color: "#727272" }}>{qa.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
