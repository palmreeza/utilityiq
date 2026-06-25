import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import {
  Building2, ClipboardList, TrendingUp, Plus, ArrowRight, FileText,
  Zap, BarChart3, Activity, ChevronRight
} from "lucide-react";

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { data: orgs, isLoading: orgsLoading } = trpc.organisations.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading || orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#1e3640" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#e2232a", borderTopColor: "transparent" }} />
          <p className="text-xs font-bold tracking-widest uppercase text-white/40">Loading</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/";
    return null;
  }

  const isPlatformOwner = (user as any)?.platformRole === "platform_owner" || user?.role === "admin";
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const kpis = [
    {
      icon: Building2, label: "Organisations", value: orgs?.length ?? 0,
      color: "#e2232a", bg: "rgba(226,35,42,0.10)", trend: null,
      desc: "Active tenants"
    },
    {
      icon: ClipboardList, label: "Active Assessments", value: "—",
      color: "#1e3640", bg: "rgba(30,54,64,0.10)", trend: null,
      desc: "In progress"
    },
    {
      icon: BarChart3, label: "Avg Maturity Score", value: "—",
      color: "#1a9e6e", bg: "rgba(26,158,110,0.10)", trend: null,
      desc: "Across all orgs"
    },
    {
      icon: FileText, label: "Reports Generated", value: "—",
      color: "#44ebca", bg: "rgba(68,235,202,0.10)", trend: null,
      desc: "PDF exports"
    },
  ];

  return (
    <AppLayout>
      <div className="min-h-full" style={{ background: "#f5f5f5" }}>

        {/* ── Hero banner ── */}
        <div className="relative overflow-hidden px-6 lg:px-8 pt-8 pb-10"
          style={{ background: "linear-gradient(135deg, #1e3640 0%, #0d1f26 100%)" }}>
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-96 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: "#e2232a" }} />
          <div className="absolute bottom-0 left-1/4 w-64 h-32 rounded-full blur-3xl opacity-10 pointer-events-none"
            style={{ background: "#44ebca" }} />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#44ebca" }}>
                {isPlatformOwner ? "Platform Owner" : "Dashboard"}
              </div>
              <h1 className="font-display font-bold text-white mb-1"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.02em" }}>
                Welcome back, {firstName}
              </h1>
              <p style={{ color: "rgba(255,255,255,0.55)" }}>
                {isPlatformOwner
                  ? "Full access to all organisations and platform settings"
                  : "Your energy maturity assessments and results"}
              </p>
            </div>

            {isPlatformOwner && (
              <button
                onClick={() => navigate("/admin")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-150 active:scale-95 flex-shrink-0"
                style={{ background: "#e2232a", boxShadow: "0 4px 14px rgba(226,35,42,0.35)" }}>
                <Plus className="w-4 h-4" /> New Organisation
              </button>
            )}
          </div>

          {/* KPI strip inside hero */}
          <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
            {kpis.map((kpi) => (
              <div key={kpi.label}
                className="rounded-2xl p-4 border"
                style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.10)" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: kpi.bg }}>
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                </div>
                <div className="font-display text-2xl font-bold text-white mb-0.5">{kpi.value}</div>
                <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.50)" }}>{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="px-6 lg:px-8 py-8 space-y-8">

          {/* Organisations section */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display font-bold text-xl" style={{ color: "#252525", letterSpacing: "-0.01em" }}>
                  Organisations
                </h2>
                <p className="text-sm mt-0.5" style={{ color: "#727272" }}>
                  {orgs?.length ? `${orgs.length} tenant${orgs.length !== 1 ? "s" : ""} provisioned` : "No tenants yet"}
                </p>
              </div>
              {isPlatformOwner && (
                <button onClick={() => navigate("/admin")}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
                  style={{ color: "#e2232a" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#8c191c")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#e2232a")}>
                  <Plus className="w-4 h-4" /> Add Organisation
                </button>
              )}
            </div>

            {!orgs || orgs.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed p-16 text-center"
                style={{ borderColor: "#d8d8d8", background: "#ffffff" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(226,35,42,0.08)" }}>
                  <Building2 className="w-8 h-8" style={{ color: "#e2232a" }} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2" style={{ color: "#252525" }}>No organisations yet</h3>
                <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "#727272" }}>
                  {isPlatformOwner
                    ? "Create your first client organisation to start running energy maturity assessments."
                    : "You have not been added to any organisations yet. Contact your Platform Owner."}
                </p>
                {isPlatformOwner && (
                  <button onClick={() => navigate("/admin")}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-150 active:scale-95"
                    style={{ background: "#e2232a" }}>
                    <Plus className="w-4 h-4" /> Create Organisation
                  </button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {orgs.map((org: any) => (
                  <div key={org.id}
                    className="group bg-white rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200"
                    style={{ borderColor: "#e5e5e5" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#e2232a";
                      (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(226,35,42,0.12)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5";
                      (e.currentTarget as HTMLElement).style.boxShadow = "";
                      (e.currentTarget as HTMLElement).style.transform = "";
                    }}
                    onClick={() => navigate(`/org/${org.id}/assessments`)}>

                    {/* Card top accent */}
                    <div className="h-1" style={{ background: "linear-gradient(90deg, #e2232a, #8c191c)" }} />

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-base text-white"
                          style={{ background: "linear-gradient(135deg, #1e3640, #0d1f26)" }}>
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(26,158,110,0.10)", color: "#0f7a55" }}>
                          {org.role ? org.role.replace(/_/g, " ") : "Member"}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-base mb-1" style={{ color: "#252525" }}>{org.name}</h3>
                      <p className="text-xs mb-5" style={{ color: "#727272" }}>
                        {org.industry ?? "Energy & Utilities"}{org.country ? ` · ${org.country}` : ""}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "#f0f0f0" }}>
                        <span className="text-xs font-medium" style={{ color: "#727272" }}>View assessments</span>
                        <div className="flex items-center gap-1 text-xs font-bold transition-all group-hover:gap-2"
                          style={{ color: "#e2232a" }}>
                          Open <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="font-display font-bold text-xl mb-5" style={{ color: "#252525", letterSpacing: "-0.01em" }}>
              Quick Actions
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  icon: ClipboardList, title: "Start New Assessment",
                  desc: "Create a new maturity assessment for an organisation",
                  color: "#e2232a", bg: "rgba(226,35,42,0.08)",
                  action: () => orgs?.[0] && navigate(`/org/${orgs[0].id}/assessments/create`)
                },
                {
                  icon: Activity, title: "View Results",
                  desc: "Review scoring results, gap analysis and radar charts",
                  color: "#1e3640", bg: "rgba(30,54,64,0.08)",
                  action: () => orgs?.[0] && navigate(`/org/${orgs[0].id}/assessments`)
                },
                {
                  icon: FileText, title: "Generate Report",
                  desc: "Produce a board-ready PDF report for a client",
                  color: "#1a9e6e", bg: "rgba(26,158,110,0.08)",
                  action: () => orgs?.[0] && navigate(`/org/${orgs[0].id}/assessments`)
                },
              ].map((qa) => (
                <button key={qa.title} onClick={qa.action}
                  className="group bg-white rounded-2xl border p-5 text-left transition-all duration-200"
                  style={{ borderColor: "#e5e5e5" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = qa.color;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${qa.color}18`;
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5";
                    (e.currentTarget as HTMLElement).style.boxShadow = "";
                    (e.currentTarget as HTMLElement).style.transform = "";
                  }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: qa.bg }}>
                    <qa.icon className="w-5 h-5" style={{ color: qa.color }} />
                  </div>
                  <h3 className="font-display font-semibold text-base mb-1.5" style={{ color: "#252525" }}>{qa.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#727272" }}>{qa.desc}</p>
                  <div className="flex items-center gap-1 mt-4 text-xs font-bold transition-all group-hover:gap-2"
                    style={{ color: qa.color }}>
                    Get started <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* EMS Level reference strip */}
          <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "#e5e5e5" }}>
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: "#e5e5e5", background: "#ffffff" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(226,35,42,0.08)" }}>
                <Zap className="w-4 h-4" style={{ color: "#e2232a" }} />
              </div>
              <div>
                <h3 className="font-display font-semibold text-sm" style={{ color: "#252525" }}>IOT.nxt EMS Maturity Levels</h3>
                <p className="text-xs" style={{ color: "#727272" }}>Reference guide for assessment scoring</p>
              </div>
            </div>
            <div className="grid grid-cols-5" style={{ background: "#ffffff" }}>
              {[
                { level: 1, label: "See",        sub: "Visibility",    color: "#e2232a" },
                { level: 2, label: "Understand", sub: "Intelligence",  color: "#c0392b" },
                { level: 3, label: "Optimise",   sub: "Optimisation",  color: "#922b21" },
                { level: 4, label: "Automate",   sub: "Orchestration", color: "#1e3640" },
                { level: 5, label: "Monetise",   sub: "Market",        color: "#0d1f26" },
              ].map((lvl) => (
                <div key={lvl.level} className="p-4 text-center" style={{ borderRight: "1px solid #f0f0f0" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white mx-auto mb-2"
                    style={{ background: lvl.color }}>
                    {lvl.level}
                  </div>
                  <div className="font-semibold text-xs mb-0.5" style={{ color: "#252525" }}>{lvl.label}</div>
                  <div className="text-[10px]" style={{ color: "#727272" }}>{lvl.sub}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
