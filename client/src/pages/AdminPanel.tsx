import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import {
  Building2, Users, Shield, Plus, Database, ArrowLeft,
  UserPlus, Trash2, ChevronRight, CheckCircle2, Crown, User
} from "lucide-react";

const ORG_ROLES = [
  { value: "organisation_admin", label: "Organisation Admin" },
  { value: "facilitator", label: "Facilitator" },
  { value: "assessor", label: "Assessor" },
  { value: "reviewer", label: "Reviewer" },
  { value: "executive_viewer", label: "Executive Viewer" },
] as const;

type OrgRole = typeof ORG_ROLES[number]["value"];

function RoleBadge({ role }: { role: string }) {
  const colours: Record<string, { bg: string; color: string }> = {
    organisation_admin: { bg: "rgba(226,35,42,0.10)", color: "#e2232a" },
    facilitator: { bg: "rgba(30,54,64,0.10)", color: "#1e3640" },
    assessor: { bg: "rgba(68,235,202,0.12)", color: "#1a9e6e" },
    reviewer: { bg: "rgba(114,114,114,0.10)", color: "#727272" },
    executive_viewer: { bg: "rgba(201,201,201,0.20)", color: "#555" },
  };
  const c = colours[role] ?? { bg: "#e8e8e8", color: "#555" };
  const label = ORG_ROLES.find(r => r.value === role)?.label ?? role;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: c.bg, color: c.color }}>
      {label}
    </span>
  );
}

// ── Org Detail View ──────────────────────────────────────────────────────────
function OrgDetail({ orgId, onBack }: { orgId: number; onBack: () => void }) {
  const { data: org } = trpc.organisations.get.useQuery({ id: orgId });
  const { data: members, refetch: refetchMembers } = trpc.organisations.members.useQuery({ orgId });
  const { data: allUsers } = trpc.admin.users.useQuery();
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<OrgRole>("assessor");

  const removeMember = trpc.organisations.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Member removed");
      refetchMembers();
    },
    onError: (err) => toast.error(err.message),
  });

  const addMember = trpc.organisations.addMember.useMutation({
    onSuccess: () => {
      toast.success("Member added successfully");
      setShowAddMember(false);
      setSearchEmail("");
      setSelectedUserId(null);
      refetchMembers();
    },
    onError: (err) => toast.error(err.message),
  });

  const memberUserIds = new Set(members?.map((m: any) => m.userId));
  const filteredUsers = allUsers?.filter((u: any) =>
    !memberUserIds.has(u.id) &&
    (searchEmail === "" ||
      u.email?.toLowerCase().includes(searchEmail.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchEmail.toLowerCase()))
  ) ?? [];

  const selectedUser = allUsers?.find((u: any) => u.id === selectedUserId);

  return (
    <div className="animate-fade-up">
      <button onClick={onBack}
        className="flex items-center gap-2 text-sm mb-6 hover:opacity-80 transition-opacity"
        style={{ color: "#727272" }}>
        <ArrowLeft className="w-4 h-4" /> Back to Admin Panel
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg"
          style={{ background: "rgba(226,35,42,0.10)", color: "#e2232a" }}>
          {org?.name?.charAt(0) ?? "?"}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">{org?.name ?? "Loading…"}</h1>
          <p className="text-sm" style={{ color: "#727272" }}>
            {org?.industry ?? "Energy & Utilities"} · {org?.country ?? "—"} · /{org?.slug}
          </p>
        </div>
      </div>

      {/* Members Section */}
      <div className="card-base p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-base">Organisation Members</h2>
            <p className="text-xs mt-0.5" style={{ color: "#727272" }}>
              {members?.length ?? 0} member{(members?.length ?? 0) !== 1 ? "s" : ""} assigned
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAddMember(!showAddMember)}
            className="gap-2" style={{ background: "#e2232a", color: "#fff" }}>
            <UserPlus className="w-4 h-4" />
            Add Member
          </Button>
        </div>

        {/* Add Member Form */}
        {showAddMember && (
          <div className="mb-5 p-4 rounded-xl border" style={{ background: "#f9f9f9", borderColor: "#e8e8e8" }}>
            <h3 className="font-medium text-sm mb-3">Add a registered user to this organisation</h3>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#727272" }}>
                Search by name or email
              </label>
              <Input
                value={searchEmail}
                onChange={(e) => { setSearchEmail(e.target.value); setSelectedUserId(null); }}
                placeholder="Type name or email to search…"
                className="bg-white"
              />
            </div>

            {/* User search results */}
            {searchEmail.length > 0 && (
              <div className="mb-3 max-h-40 overflow-y-auto rounded-lg border" style={{ borderColor: "#e8e8e8" }}>
                {filteredUsers.length === 0 ? (
                  <div className="p-3 text-sm text-center" style={{ color: "#727272" }}>
                    No unassigned users match "{searchEmail}"
                  </div>
                ) : (
                  filteredUsers.map((u: any) => (
                    <button key={u.id}
                      onClick={() => { setSelectedUserId(u.id); setSearchEmail(u.email ?? u.name ?? ""); }}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0"
                      style={{ borderColor: "#f0f0f0" }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                        style={{ background: "rgba(226,35,42,0.10)", color: "#e2232a" }}>
                        {u.name?.charAt(0)?.toUpperCase() ?? "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{u.name ?? "—"}</div>
                        <div className="text-xs truncate" style={{ color: "#727272" }}>{u.email}</div>
                      </div>
                      {selectedUserId === u.id && (
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#e2232a" }} />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Selected user confirmation */}
            {selectedUser && (
              <div className="mb-3 p-3 rounded-lg flex items-center gap-3"
                style={{ background: "rgba(226,35,42,0.05)", border: "1px solid rgba(226,35,42,0.15)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ background: "rgba(226,35,42,0.10)", color: "#e2232a" }}>
                  {selectedUser.name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{selectedUser.name}</div>
                  <div className="text-xs" style={{ color: "#727272" }}>{selectedUser.email}</div>
                </div>
                <CheckCircle2 className="w-4 h-4" style={{ color: "#e2232a" }} />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#727272" }}>
                Assign Role *
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as OrgRole)}
                className="w-full text-sm rounded-lg border px-3 py-2 bg-white focus:outline-none focus:ring-2"
                style={{ borderColor: "#e8e8e8", color: "#252525" }}>
                {ORG_ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowAddMember(false); setSearchEmail(""); setSelectedUserId(null); }}>
                Cancel
              </Button>
              <Button size="sm"
                onClick={() => {
                  if (!selectedUserId) { toast.error("Please select a user"); return; }
                  addMember.mutate({ orgId, userId: selectedUserId, orgRole: selectedRole });
                }}
                disabled={addMember.isPending || !selectedUserId}
                style={{ background: "#e2232a", color: "#fff" }}>
                {addMember.isPending ? "Adding…" : "Add to Organisation"}
              </Button>
            </div>
          </div>
        )}

        {/* Members List */}
        {members && members.length > 0 ? (
          <div className="divide-y" style={{ borderColor: "#f0f0f0" }}>
            {members.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
                  style={{ background: "rgba(30,54,64,0.08)", color: "#1e3640" }}>
                  {m.userName?.charAt(0)?.toUpperCase() ?? m.userEmail?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{m.userName ?? "—"}</div>
                  <div className="text-xs" style={{ color: "#727272" }}>{m.userEmail ?? "—"}</div>
                </div>
                <RoleBadge role={m.orgRole} />
                <button
                  onClick={() => {
                    if (confirm(`Remove ${m.userName ?? m.userEmail} from this organisation?`)) {
                      removeMember.mutate({ orgId, userId: m.userId });
                    }
                  }}
                  className="ml-2 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Remove member">
                  <Trash2 className="w-3.5 h-3.5" style={{ color: "#e2232a" }} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-8 h-8 mx-auto mb-2" style={{ color: "#c9c9c9" }} />
            <p className="text-sm" style={{ color: "#727272" }}>No members yet. Add the first member above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Admin Panel ─────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
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

  // Show org detail view
  if (selectedOrgId !== null) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8">
          <OrgDetail orgId={selectedOrgId} onBack={() => setSelectedOrgId(null)} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 animate-fade-up">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5" style={{ color: "#e2232a" }} />
            <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
          </div>
          <p style={{ color: "#727272" }}>Platform Owner — manage organisations, users, and templates</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Building2, label: "Organisations", value: stats?.orgs ?? orgs?.length ?? 0, color: "#e2232a" },
            { icon: Users, label: "Platform Users", value: stats?.users ?? users?.length ?? 0, color: "#1e3640" },
            { icon: Database, label: "Assessments", value: "—", color: "#1a9e6e" },
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold mb-1">Assessment Templates</h3>
              <p className="text-sm" style={{ color: "#727272" }}>
                Seed the default Energy Maturity Assessment template with all 8 domains and capabilities.
                Run this once on first setup.
              </p>
            </div>
            <Button onClick={() => seedTemplate.mutate()} disabled={seedTemplate.isPending}
              className="gap-2 flex-shrink-0" style={{ background: "#1e3640", color: "#fff" }}>
              <Database className="w-4 h-4" />
              {seedTemplate.isPending ? "Seeding…" : "Seed Default Template"}
            </Button>
          </div>
        </div>

        {/* Organisations */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Organisations</h2>
            <Button size="sm" onClick={() => setShowCreateOrg(!showCreateOrg)}
              className="gap-2" style={{ background: "#e2232a", color: "#fff" }}>
              <Plus className="w-4 h-4" /> New Organisation
            </Button>
          </div>

          {showCreateOrg && (
            <div className="card-base p-5 mb-4">
              <h3 className="font-semibold mb-4">Create Organisation</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#727272" }}>Organisation Name *</label>
                  <Input value={orgName}
                    onChange={(e) => {
                      setOrgName(e.target.value);
                      setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                    }}
                    placeholder="Eskom Holdings" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#727272" }}>Slug (URL-safe) *</label>
                  <Input value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)}
                    placeholder="eskom-holdings" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#727272" }}>Industry</label>
                  <Input value={orgIndustry} onChange={(e) => setOrgIndustry(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "#727272" }}>Country</label>
                  <Input value={orgCountry} onChange={(e) => setOrgCountry(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateOrg(false)}>Cancel</Button>
                <Button
                  onClick={() => createOrg.mutate({ name: orgName, slug: orgSlug, industry: orgIndustry, country: orgCountry })}
                  disabled={createOrg.isPending || !orgName || !orgSlug}
                  style={{ background: "#e2232a", color: "#fff" }}>
                  {createOrg.isPending ? "Creating…" : "Create Organisation"}
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {orgs?.map((org: any) => (
              <div key={org.id}
                className="card-base p-4 flex items-center justify-between cursor-pointer hover:border-red-500/30 transition-all group">
                <div className="flex items-center gap-3 flex-1 min-w-0"
                  onClick={() => navigate(`/org/${org.id}/assessments`)}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ background: "rgba(226,35,42,0.10)", color: "#e2232a" }}>
                    {org.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{org.name}</div>
                    <div className="text-xs" style={{ color: "#727272" }}>
                      {org.industry ?? "Energy & Utilities"} · {org.country ?? "—"} · /{org.slug}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline"
                    onClick={(e) => { e.stopPropagation(); setSelectedOrgId(org.id); }}
                    className="gap-1.5 text-xs h-7">
                    <Users className="w-3 h-3" /> Manage Members
                  </Button>
                  <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-70 transition-opacity"
                    onClick={() => navigate(`/org/${org.id}/assessments`)} />
                </div>
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

        {/* Platform Users */}
        <div>
          <h2 className="font-display text-lg font-semibold mb-4">Platform Users</h2>
          <div className="card-base overflow-hidden">
            <div className="divide-y" style={{ borderColor: "#f0f0f0" }}>
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
                  <div className="flex items-center gap-2">
                    {u.platformRole === "platform_owner" && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "rgba(226,35,42,0.10)", color: "#e2232a" }}>
                        Platform Owner
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "#e8e8e8", color: "#727272" }}>
                      {u.role === "admin" ? "Admin" : "Member"}
                    </span>
                  </div>
                </div>
              ))}
              {(!users || users.length === 0) && (
                <div className="p-8 text-center">
                  <User className="w-8 h-8 mx-auto mb-2" style={{ color: "#c9c9c9" }} />
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
