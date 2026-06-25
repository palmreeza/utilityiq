import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  Zap, BarChart3, Shield, Leaf, Gauge, Receipt, Settings, Users,
  ArrowRight, CheckCircle2, TrendingUp, FileText, Target
} from "lucide-react";

const FEATURES = [
  { icon: Gauge, title: "8-Domain Assessment", desc: "Comprehensive coverage across metering, billing, analytics, cybersecurity, sustainability and more." },
  { icon: BarChart3, title: "Visual Analytics", desc: "Radar charts, heatmaps, and gap analysis dashboards that make maturity data instantly readable." },
  { icon: Target, title: "Transformation Roadmap", desc: "Auto-generated, prioritised roadmap items mapped to four delivery horizons." },
  { icon: FileText, title: "Board-Ready Reports", desc: "Print-to-PDF executive reports with scores, gaps, and strategic recommendations." },
  { icon: Users, title: "Team-Based Scoring", desc: "Multiple assessors score independently; facilitator consensus resolves disagreements." },
  { icon: Shield, title: "Audit Trail", desc: "Every score, evidence reference, and approval event is logged for governance and traceability." },
];

const DOMAINS = [
  { icon: Gauge, name: "Meter Management", std: "IEC 62056" },
  { icon: Receipt, name: "Billing", std: "Revenue Governance" },
  { icon: Settings, name: "Asset Operations", std: "ISO 55001" },
  { icon: BarChart3, name: "Analytics", std: "ISO 8000" },
  { icon: Shield, name: "Cybersecurity", std: "NIST CSF / C2M2" },
  { icon: Leaf, name: "Sustainability", std: "ISO 50001" },
  { icon: Users, name: "Customer Engagement", std: "Utility Benchmarks" },
  { icon: Zap, name: "Smart Infrastructure", std: "SEI SGMM" },
];

const EMS_LEVELS = [
  { level: 1, label: "See", sub: "Energy Visibility", color: "#ef4444" },
  { level: 2, label: "Understand", sub: "Energy Intelligence", color: "#f97316" },
  { level: 3, label: "Optimise", sub: "Energy Optimisation", color: "#FFC000" },
  { level: 4, label: "Automate", sub: "Energy Orchestration", color: "#22c55e" },
  { level: 5, label: "Monetise", sub: "Market Participation", color: "#3b82f6" },
];

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.10 0.01 240)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <p className="text-sm" style={{ color: "oklch(0.60 0.01 240)" }}>Loading Utility IQ…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.10 0.01 240)", color: "oklch(0.96 0.005 240)" }}>
      {/* ── Nav ── */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-md" style={{ borderColor: "oklch(0.22 0.015 240)", background: "oklch(0.10 0.01 240 / 0.9)" }}>
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "oklch(0.78 0.18 75)" }}>
              <Zap className="w-4 h-4" style={{ color: "oklch(0.10 0.01 240)" }} />
            </div>
            <div>
              <span className="font-display font-bold text-lg" style={{ color: "oklch(0.96 0.005 240)" }}>Utility IQ</span>
              <span className="text-xs ml-2" style={{ color: "oklch(0.60 0.01 240)" }}>by IOT.nxt</span>
            </div>
          </div>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all duration-150 active:scale-95"
            style={{ background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)" }}>
            Sign In <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl opacity-10"
            style={{ background: "radial-gradient(ellipse, oklch(0.78 0.18 75), transparent)" }} />
        </div>
        <div className="container relative pt-24 pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 border"
              style={{ background: "oklch(0.78 0.18 75 / 0.1)", borderColor: "oklch(0.78 0.18 75 / 0.3)", color: "oklch(0.88 0.16 75)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "oklch(0.78 0.18 75)" }} />
              Enterprise Energy Maturity Platform
            </div>
            <h1 className="font-display text-5xl font-bold leading-tight mb-6" style={{ letterSpacing: "-0.03em" }}>
              Assess, Evidence &amp; Improve<br />
              <span style={{ background: "linear-gradient(135deg, oklch(0.78 0.18 75), oklch(0.88 0.14 75))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Energy Maturity
              </span>
            </h1>
            <p className="text-lg mb-10 leading-relaxed" style={{ color: "oklch(0.70 0.01 240)" }}>
              Utility IQ converts traditional spreadsheet-based maturity assessments into a repeatable, team-based, auditable digital workflow — from initial scoring through to board-ready transformation roadmaps.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base transition-all duration-150 active:scale-95"
                style={{ background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)", boxShadow: "0 0 32px oklch(0.78 0.18 75 / 0.3)" }}>
                Get Started <ArrowRight className="w-5 h-5" />
              </a>
              <a href="#domains" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base border transition-all duration-150"
                style={{ borderColor: "oklch(0.22 0.015 240)", color: "oklch(0.70 0.01 240)" }}>
                View Framework
              </a>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto">
            {[
              { value: "8", label: "Assessment Domains" },
              { value: "25+", label: "Capabilities Assessed" },
              { value: "5", label: "Maturity Levels" },
              { value: "4", label: "Roadmap Horizons" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl border" style={{ background: "oklch(0.13 0.01 240)", borderColor: "oklch(0.22 0.015 240)" }}>
                <div className="font-display text-3xl font-bold" style={{ color: "oklch(0.78 0.18 75)" }}>{stat.value}</div>
                <div className="text-xs mt-1" style={{ color: "oklch(0.60 0.01 240)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMS Maturity Ladder ── */}
      <section className="py-20 border-t" style={{ borderColor: "oklch(0.22 0.015 240)" }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-3">IOT.nxt Energy Maturity Model</h2>
            <p style={{ color: "oklch(0.60 0.01 240)" }}>Five progressive levels from basic visibility to full market participation</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 max-w-4xl mx-auto">
            {EMS_LEVELS.map((lvl, i) => (
              <div key={lvl.level} className="flex-1 rounded-xl p-5 border transition-all duration-200 hover:scale-105"
                style={{ background: `${lvl.color}15`, borderColor: `${lvl.color}40` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm mb-3"
                  style={{ background: lvl.color, color: "#0D0F14" }}>
                  {lvl.level}
                </div>
                <div className="font-semibold text-sm mb-1" style={{ color: lvl.color }}>{lvl.label}</div>
                <div className="text-xs" style={{ color: "oklch(0.60 0.01 240)" }}>{lvl.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8 Domains ── */}
      <section id="domains" className="py-20 border-t" style={{ borderColor: "oklch(0.22 0.015 240)" }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-3">Eight Assessment Domains</h2>
            <p style={{ color: "oklch(0.60 0.01 240)" }}>Aligned to international standards for credibility and comparability</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DOMAINS.map((d) => (
              <div key={d.name} className="p-5 rounded-xl border transition-all duration-200 hover:border-amber-500/40 group"
                style={{ background: "oklch(0.13 0.01 240)", borderColor: "oklch(0.22 0.015 240)" }}>
                <d.icon className="w-6 h-6 mb-3 transition-colors" style={{ color: "oklch(0.78 0.18 75)" }} />
                <div className="font-semibold text-sm mb-1">{d.name}</div>
                <div className="text-xs" style={{ color: "oklch(0.50 0.01 240)" }}>{d.std}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 border-t" style={{ borderColor: "oklch(0.22 0.015 240)" }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-3">Everything You Need</h2>
            <p style={{ color: "oklch(0.60 0.01 240)" }}>From assessment creation to board-ready reporting</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-xl border transition-all duration-200 hover:border-amber-500/30"
                style={{ background: "oklch(0.13 0.01 240)", borderColor: "oklch(0.22 0.015 240)" }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "oklch(0.78 0.18 75 / 0.15)" }}>
                  <f.icon className="w-5 h-5" style={{ color: "oklch(0.78 0.18 75)" }} />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.60 0.01 240)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 border-t" style={{ borderColor: "oklch(0.22 0.015 240)" }}>
        <div className="container">
          <div className="max-w-2xl mx-auto text-center p-12 rounded-2xl border"
            style={{ background: "oklch(0.13 0.01 240)", borderColor: "oklch(0.22 0.015 240)", boxShadow: "0 0 60px oklch(0.78 0.18 75 / 0.08)" }}>
            <h2 className="font-display text-3xl font-bold mb-4">Ready to assess your energy maturity?</h2>
            <p className="mb-8" style={{ color: "oklch(0.60 0.01 240)" }}>
              Sign in to access your organisation's assessments or contact IOT.nxt to get provisioned.
            </p>
            <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base transition-all duration-150 active:scale-95"
              style={{ background: "oklch(0.78 0.18 75)", color: "oklch(0.10 0.01 240)" }}>
              Sign In to Utility IQ <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8" style={{ borderColor: "oklch(0.22 0.015 240)" }}>
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "oklch(0.78 0.18 75)" }}>
              <Zap className="w-3 h-3" style={{ color: "oklch(0.10 0.01 240)" }} />
            </div>
            <span className="text-sm font-semibold">Utility IQ</span>
            <span className="text-xs" style={{ color: "oklch(0.50 0.01 240)" }}>by IOT.nxt</span>
          </div>
          <p className="text-xs" style={{ color: "oklch(0.50 0.01 240)" }}>
            © {new Date().getFullYear()} IOT.nxt. Enterprise Energy Maturity Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
