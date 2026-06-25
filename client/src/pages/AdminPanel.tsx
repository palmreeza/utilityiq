import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Building2, Users, Shield, Plus, ChevronRight, Database } from "lucide-react";

export default function AdminPanel() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgIndustry, setOrgIndustry] = useState("Energy & Utilities");
  const [orgCountry, setOrgCountry] = useState("South Africa");

  const { data: orgs, refetch: refetchOrgs } = trpc.organisations.list.useQuery();
  const { data: users } = trpc.admin.users.useQuery();
  const { data: stats } = trpc.admin.stats.useQuery();

  const seedTemplate = trpc.templates.seed.useMutation({
    onSuccess: (data) => toast.success(data.message),
    onError: (err) => toast.error(err.message),
  });

  const createOrg = trpc.organisations.create.useMutation({
    onSuccess: () => {
      toast.success("Organisation created");
      setShowCreateOrg(false);
      setOrgName(""); setOrgSlug(""); 
      refetchOrgs();
    },
    onError: (err) => toast.error(err.message),
  });

  const isPlatformOwner = (user as any)?.platformRole === "platform_owner" || user?.role === "admin";
  if (!isPlatformOwner) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4" style={{ color: "#e2232a" }} />
          <h2 className="font-semibold mb-2">Access Denied</h2>
          <p style={{ color: "#727272" }}>Platform Owner access required.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 animate-fade-up">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold mb-1">Admin Panel</h1>
          <p style={{ color: "#727272" }}>Platform Owner — manage organisations, users, and templates</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Building2, label: "Organisations", value: stats?.orgs ?? orgs?.length ?? 0, color: "#e2232a" },
            { icon: Users, label: "Users", value: stats?.users ?? users?.length ?? 0, color: "#1e3640" },
            { icon: Database, label: "Templates", value: "—", color: "#1a9e6e" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                style={{ background: `${s.color}20` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div className="font-display text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: "#727272" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Template seeding */}
        <div className="card-base p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Assessment Templates</h3>
              <p className="text-sm" style={{ color: "#727272" }}>
                Seed the default Energy Maturity Assessment template with all 8 domains and capabilities.
              </p>
            </div>
            <Button onClick={() => seedTemplate.mutate()} disabled={seedTemplate.isPending}
              className="gap-2 flex-shrink-0" style={{ background: "#e2232a", color: "#1e3640" }}>
              <Database className="w-4 h-4" />
              {seedTemplate.isPending ? "Seeding…" : "Seed Default Template"}
            </Button>
          </div>
        </div>

        {/* Organisations */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Organisations</h2>
            <Button size="sm" onClick={() => setShowCreateOrg(!showCreateOrg)}
              className="gap-2" style={{ background: "#e2232a", color: "#1e3640" }}>
              <Plus className="w-4 h-4" /> New Organisation
            </Button>
          </div>

          {showCreateOrg && (
            <div className="card-base p-5 mb-4">
              <h3 className="font-semibold mb-4">Create Organisation</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#727272" }}>Organisation Name *</label>
                  <Input value={orgName} onChange={(e) => { setOrgName(e.target.value); setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }}
                    placeholder="Eskom Holdings" className="bg-elevated border-subtle" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#727272" }}>Slug (URL-safe) *</label>
                  <Input value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)}
                    placeholder="eskom-holdings" className="bg-elevated border-subtle" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#727272" }}>Industry</label>
                  <Input value={orgIndustry} onChange={(e) => setOrgIndustry(e.target.value)}
                    className="bg-elevated border-subtle" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#727272" }}>Country</label>
                  <Input value={orgCountry} onChange={(e) => setOrgCountry(e.target.value)}
                    className="bg-elevated border-subtle" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateOrg(false)}>Cancel</Button>
                <Button onClick={() => createOrg.mutate({ name: orgName, slug: orgSlug, industry: orgIndustry, country: orgCountry })}
                  disabled={createOrg.isPending || !orgName || !orgSlug}
                  style={{ background: "#e2232a", color: "#1e3640" }}>
                  {createOrg.isPending ? "Creating…" : "Create Organisation"}
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {orgs?.map((org: any) => (
              <div key={org.id} className="card-base p-4 flex items-center justify-between cursor-pointer hover:border-red-500/30 transition-all"
                onClick={() => navigate(`/org/${org.id}/assessments`)}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
                    style={{ background: "rgba(226,35,42,0.10)", color: "#e2232a" }}>
                    {org.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{org.name}</div>
                    <div className="text-xs" style={{ color: "#727272" }}>
                      {org.industry ?? "Energy & Utilities"} · {org.country ?? "—"} · /{org.slug}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: "oklch(0.40 0.01 240)" }} />
              </div>
            ))}
            {(!orgs || orgs.length === 0) && (
              <div className="card-base p-8 text-center">
                <Building2 className="w-8 h-8 mx-auto mb-2" style={{ color: "#c9c9c9" }} />
                <p className="text-sm" style={{ color: "#727272" }}>No organisations yet. Create one above.</p>
              </div>
            )}
          </div>
        </div>

        {/* Users */}
        <div>
          <h2 className="font-display text-lg font-semibold mb-4">Platform Users</h2>
          <div className="card-base overflow-hidden">
            <div className="divide-y" style={{ borderColor: "#e8e8e8" }}>
              {users?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
                    style={{ background: "rgba(226,35,42,0.10)", color: "#e2232a" }}>
                    {u.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{u.name ?? "—"}</div>
                    <div className="text-xs" style={{ color: "#727272" }}>{u.email ?? u.openId}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: u.platformRole === "platform_owner" ? "rgba(226,35,42,0.10)" : "#e8e8e8",
                      color: u.platformRole === "platform_owner" ? "#e2232a" : "#727272" }}>
                    {u.platformRole === "platform_owner" ? "Platform Owner" : u.role ?? "Member"}
                  </span>
                </div>
              ))}
              {(!users || users.length === 0) && (
                <div className="p-8 text-center">
                  <p className="text-sm" style={{ color: "#727272" }}>No users found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
