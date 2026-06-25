import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ClipboardList } from "lucide-react";

export default function AssessmentCreate() {
  const { orgId } = useParams<{ orgId: string }>();
  const [, navigate] = useLocation();
  const orgIdNum = parseInt(orgId ?? "0");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState<number | null>(null);

  const { data: templates, isLoading: templatesLoading } = trpc.templates.list.useQuery();
  const { data: org } = trpc.organisations.get.useQuery({ id: orgIdNum }, { enabled: !!orgIdNum });

  const createMutation = trpc.assessments.create.useMutation({
    onSuccess: (data) => {
      toast.success("Assessment created successfully");
      navigate(`/assessment/${data.id}/workspace`);
    },
    onError: (err) => toast.error(err.message),
  });

  const seedMutation = trpc.templates.seed.useMutation({
    onSuccess: () => {
      toast.success("Default template seeded — please refresh");
      window.location.reload();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!name.trim()) { toast.error("Please enter an assessment name"); return; }
    if (!templateId) { toast.error("Please select a template"); return; }
    createMutation.mutate({ orgId: orgIdNum, templateId, name: name.trim(), description: description.trim() || undefined });
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 animate-fade-up max-w-2xl">
        <button onClick={() => navigate(`/org/${orgId}/assessments`)}
          className="flex items-center gap-2 text-sm mb-6 hover:text-amber-400 transition-colors"
          style={{ color: "oklch(0.60 0.01 240)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Assessments
        </button>

        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold mb-1">New Assessment</h1>
          <p style={{ color: "oklch(0.60 0.01 240)" }}>
            Create a new energy maturity assessment for {org?.name ?? "this organisation"}
          </p>
        </div>

        <div className="card-base p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Assessment Name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. FY2025 Energy Maturity Assessment"
              className="bg-elevated border-subtle" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the assessment scope and objectives…"
              rows={3} className="bg-elevated border-subtle resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Assessment Template *</label>
            {templatesLoading ? (
              <div className="h-10 rounded-lg animate-pulse" style={{ background: "oklch(0.16 0.012 240)" }} />
            ) : !templates || templates.length === 0 ? (
              <div className="p-4 rounded-lg border text-center" style={{ borderColor: "oklch(0.22 0.015 240)", background: "oklch(0.13 0.01 240)" }}>
                <p className="text-sm mb-3" style={{ color: "oklch(0.60 0.01 240)" }}>No templates available.</p>
                <Button size="sm" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}
                  style={{ background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)" }}>
                  {seedMutation.isPending ? "Seeding…" : "Seed Default Template"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((t: any) => (
                  <button key={t.id} onClick={() => setTemplateId(t.id)}
                    className="w-full p-4 rounded-lg border text-left transition-all duration-150"
                    style={{
                      background: templateId === t.id ? "oklch(0.78 0.18 75 / 0.1)" : "oklch(0.13 0.01 240)",
                      borderColor: templateId === t.id ? "oklch(0.78 0.18 75)" : "oklch(0.22 0.015 240)",
                    }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm">{t.name}</div>
                        {t.description && (
                          <div className="text-xs mt-1 line-clamp-2" style={{ color: "oklch(0.60 0.01 240)" }}>{t.description}</div>
                        )}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded ml-3 flex-shrink-0"
                        style={{ background: "oklch(0.78 0.18 75 / 0.15)", color: "oklch(0.88 0.16 75)" }}>
                        v{t.version}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate(`/org/${orgId}/assessments`)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1 gap-2"
              style={{ background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)" }}>
              <ClipboardList className="w-4 h-4" />
              {createMutation.isPending ? "Creating…" : "Create Assessment"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
