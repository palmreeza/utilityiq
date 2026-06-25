// Shared types used across client and server

export type OrgRole = "organisation_admin" | "facilitator" | "assessor" | "reviewer" | "executive_viewer";
export type PlatformRole = "platform_owner" | "member";
export type AssessmentStatus = "Draft" | "In-Progress" | "Under Review" | "Approved";
export type RoadmapHorizon = "0-3 months" | "3-12 months" | "12-24 months" | "24+ months";
export type RoadmapPriority = "Critical" | "High" | "Medium" | "Low";
export type ConfidenceLevel = "Low" | "Medium" | "High";
export type MaturityLevel = 1 | 2 | 3 | 4 | 5;

export const MATURITY_LABELS: Record<number, string> = {
  1: "Initial",
  2: "Developing",
  3: "Defined",
  4: "Managed",
  5: "Optimising",
};

export const EMS_LEVELS: Record<number, { label: string; description: string; color: string }> = {
  1: { label: "See", description: "Energy Visibility", color: "#ef4444" },
  2: { label: "Understand", description: "Energy Intelligence", color: "#f97316" },
  3: { label: "Optimise", description: "Energy Optimisation", color: "#FFC000" },
  4: { label: "Automate", description: "Energy Orchestration", color: "#22c55e" },
  5: { label: "Monetise", description: "Market Participation", color: "#3b82f6" },
};

export const DOMAIN_ICONS: Record<string, string> = {
  "Meter Management": "Gauge",
  "Billing": "Receipt",
  "Asset Operations": "Settings",
  "Analytics": "BarChart3",
  "Cybersecurity": "Shield",
  "Sustainability": "Leaf",
  "Customer Engagement": "Users",
  "Smart Infrastructure": "Zap",
};

export const STATUS_CONFIG: Record<AssessmentStatus, { label: string; className: string }> = {
  "Draft": { label: "Draft", className: "status-draft" },
  "In-Progress": { label: "In Progress", className: "status-in-progress" },
  "Under Review": { label: "Under Review", className: "status-under-review" },
  "Approved": { label: "Approved", className: "status-approved" },
};

export const PRIORITY_CONFIG: Record<RoadmapPriority, { color: string; bg: string }> = {
  Critical: { color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  High: { color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  Medium: { color: "#FFC000", bg: "rgba(255,192,0,0.15)" },
  Low: { color: "#6b7280", bg: "rgba(107,114,128,0.15)" },
};

export const HORIZON_ORDER: RoadmapHorizon[] = [
  "0-3 months",
  "3-12 months",
  "12-24 months",
  "24+ months",
];

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  organisation_admin: "Organisation Admin",
  facilitator: "Facilitator",
  assessor: "Assessor",
  reviewer: "Reviewer",
  executive_viewer: "Executive Viewer",
};
