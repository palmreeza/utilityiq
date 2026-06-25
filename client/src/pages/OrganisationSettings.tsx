import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Settings, Users, Plus } from "lucide-react";
import { ORG_ROLE_LABELS } from "../../../shared/types";
import type { OrgRole } from "../../../shared/types";

export default function OrganisationSettings() {
  const { orgId } = useParams<{ orgId: string }>();
  const [, navigate] = useLocation();
  const orgIdNum = parseInt(orgId ?? "0");
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberUserId, setMemberUserId] = useState("");
  const [memberRole, setMemberRole] = useState<OrgRole>("assessor");

  const { data: org } = trpc.organisations.get.useQuery({ id: orgIdNum }, { enabled: !!orgIdNum });
  const { data: members, refetch } = trpc.organisations.members.useQuery({ orgId: orgIdNum }, { enabled: !!orgIdNum });
  const { data: allUsers } = trpc.admin.users.useQuery();

  const addMember = trpc.organisations.addMember.useMutation({
    onSuccess: () => { toast.success("Member added"); setShowAddMember(false); setMemberUserId(""); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 animate-fade-up max-w-2xl">
        <button onClick={() => navigate(`/org/${orgId}/assessments`)}
          className="flex items-center gap-1 text-xs mb-4 hover:text-amber-400 transition-colors"
          style={{ color: "oklch(0.50 0.01 240)" }}>
          <ArrowLeft className="w-3 h-3" /> Back to Assessments
        </button>
        <h1 className="font-display text-2xl font-bold mb-1">Organisation Settings</h1>
        <p className="mb-6" style={{ color: "oklch(0.60 0.01 240)" }}>{org?.name}</p>

        {/* Members */}
        <div className="card-base p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: "oklch(0.78 0.18 75)" }} />
              Team Members
            </h3>
            <Button size="sm" onClick={() => setShowAddMember(!showAddMember)}
              className="gap-1 text-xs" style={{ background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)" }}>
              <Plus className="w-3 h-3" /> Add Member
            </Button>
          </div>

          {showAddMember && (
            <div className="p-4 rounded-xl mb-4 border" style={{ background: "oklch(0.11 0.01 240)", borderColor: "oklch(0.22 0.015 240)" }}>
              <div className="grid gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.60 0.01 240)" }}>User</label>
                  <select value={memberUserId} onChange={(e) => setMemberUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{ background: "oklch(0.16 0.012 240)", borderColor: "oklch(0.22 0.015 240)", color: "oklch(0.80 0.01 240)" }}>
                    <option value="">Select a user…</option>
                    {allUsers?.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name ?? u.email ?? u.openId}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.60 0.01 240)" }}>Role</label>
                  <select value={memberRole} onChange={(e) => setMemberRole(e.target.value as OrgRole)}
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{ background: "oklch(0.16 0.012 240)", borderColor: "oklch(0.22 0.015 240)", color: "oklch(0.80 0.01 240)" }}>
                    {Object.entries(ORG_ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddMember(false)}>Cancel</Button>
                <Button size="sm" onClick={() => addMember.mutate({ orgId: orgIdNum, userId: parseInt(memberUserId), orgRole: memberRole })}
                  disabled={addMember.isPending || !memberUserId}
                  style={{ background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)" }}>
                  {addMember.isPending ? "Adding…" : "Add Member"}
                </Button>
              </div>
            </div>
          )}

          <div className="divide-y" style={{ borderColor: "oklch(0.16 0.012 240)" }}>
            {members?.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
                  style={{ background: "oklch(0.78 0.18 75 / 0.15)", color: "oklch(0.88 0.16 75)" }}>
                  {m.userName?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{m.userName ?? "—"}</div>
                  <div className="text-xs" style={{ color: "oklch(0.50 0.01 240)" }}>{m.userEmail ?? "—"}</div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "oklch(0.78 0.18 75 / 0.1)", color: "oklch(0.88 0.16 75)" }}>
                  {ORG_ROLE_LABELS[m.orgRole as OrgRole] ?? m.orgRole}
                </span>
              </div>
            ))}
            {(!members || members.length === 0) && (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: "oklch(0.60 0.01 240)" }}>No members yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
