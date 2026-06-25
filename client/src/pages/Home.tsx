import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  Zap, BarChart3, Shield, Leaf, Gauge, Receipt, Settings, Users,
  ArrowRight, FileText, Target
} from "lucide-react";

const FEATURES = [
  { icon: Gauge,    title: "8-Domain Assessment",    desc: "Comprehensive coverage across metering, billing, analytics, cybersecurity, sustainability and more." },
  { icon: BarChart3,title: "Visual Analytics",        desc: "Radar charts, heatmaps, and gap analysis dashboards that make maturity data instantly readable." },
  { icon: Target,   title: "Transformation Roadmap", desc: "Auto-generated, prioritised roadmap items mapped to four delivery horizons." },
  { icon: FileText, title: "Board-Ready Reports",    desc: "Print-to-PDF executive reports with scores, gaps, and strategic recommendations." },
  { icon: Users,    title: "Team-Based Scoring",     desc: "Multiple assessors score independently; facilitator consensus resolves disagreements." },
  { icon: Shield,   title: "Audit Trail",            desc: "Every score, evidence reference, and approval event is logged for governance and traceability." },
];

const DOMAINS = [
  { icon: Gauge,    name: "Meter Management",    std: "IEC 62056" },
  { icon: Receipt,  name: "Billing",             std: "Revenue Governance" },
  { icon: Settings, name: "Asset Operations",    std: "ISO 55001" },
  { icon: BarChart3,name: "Analytics",           std: "ISO 8000" },
  { icon: Shield,   name: "Cybersecurity",       std: "NIST CSF / C2M2" },
  { icon: Leaf,     name: "Sustainability",      std: "ISO 50001" },
  { icon: Users,    name: "Customer Engagement", std: "Utility Benchmarks" },
  { icon: Zap,      name: "Smart Infrastructure",std: "SEI SGMM" },
];

const EMS_LEVELS = [
  { level: 1, label: "See",       sub: "Energy Visibility",     color: "#e2232a" },
  { level: 2, label: "Understand",sub: "Energy Intelligence",   color: "#d97706" },
  { level: 3, label: "Optimise",  sub: "Energy Optimisation",   color: "#ca8a04" },
  { level: 4, label: "Automate",  sub: "Energy Orchestration",  color: "#1a9e6e" },
  { level: 5, label: "Monetise",  sub: "Market Participation",  color: "#1e3640" },
];

export default function Home() {
  const { loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard");
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f5f5" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#e2232a", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#727272" }}>Loading Utility IQ…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#ffffff", color: "#252525" }}>

      {/* ── Nav ── */}
      <nav className="border-b sticky top-0 z-50 bg-white" style={{ borderColor: "#d8d8d8" }}>
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#1e3640" }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-lg" style={{ color: "#252525" }}>Utility IQ</span>
              <span className="text-xs ml-2" style={{ color: "#727272" }}>by IOT.nxt</span>
            </div>
          </div>
          <a href={getLoginUrl()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white transition-all duration-150 active:scale-95"
            style={{ background: "#e2232a" }}>
            Sign In <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: "#d8d8d8", background: "#1e3640" }}>
        {/* Subtle red glow */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #e2232a, transparent)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #44ebca, transparent)" }} />

        <div className="container relative pt-24 pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 border"
              style={{ background: "rgba(226,35,42,0.15)", borderColor: "rgba(226,35,42,0.35)", color: "#ff8080" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#e2232a" }} />
              Enterprise Energy Maturity Platform
            </div>
            <h1 className="font-display text-5xl font-bold leading-tight mb-6 text-white" style={{ letterSpacing: "-0.03em" }}>
              Assess, Evidence &amp; Improve<br />
              <span style={{ background: "linear-gradient(135deg, #e2232a, #ff6b6b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Energy Maturity
              </span>
            </h1>
            <p className="text-lg mb-10 leading-relaxed" style={{ color: "rgba(255,255,255,0.70)" }}>
              Utility IQ converts traditional spreadsheet-based maturity assessments into a repeatable, team-based, auditable digital workflow — from initial scoring through to board-ready transformation roadmaps.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={getLoginUrl()}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base text-white transition-all duration-150 active:scale-95"
                style={{ background: "#e2232a", boxShadow: "0 0 32px rgba(226,35,42,0.40)" }}>
                Get Started <ArrowRight className="w-5 h-5" />
              </a>
              <a href="#domains"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base border transition-all duration-150"
                style={{ borderColor: "rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.75)" }}>
                View Framework
              </a>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto">
            {[
              { value: "8",   label: "Assessment Domains" },
              { value: "25+", label: "Capabilities Assessed" },
              { value: "5",   label: "Maturity Levels" },
              { value: "4",   label: "Roadmap Horizons" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 rounded-xl border"
                style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.12)" }}>
                <div className="font-display text-3xl font-bold" style={{ color: "#e2232a" }}>{stat.value}</div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMS Maturity Ladder ── */}
      <section className="py-20 border-b" style={{ borderColor: "#d8d8d8", background: "#f5f5f5" }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-3" style={{ color: "#252525" }}>IOT.nxt Energy Maturity Model</h2>
            <p style={{ color: "#727272" }}>Five progressive levels from basic visibility to full market participation</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 max-w-4xl mx-auto">
            {EMS_LEVELS.map((lvl) => (
              <div key={lvl.level} className="flex-1 rounded-xl p-5 border bg-white transition-all duration-200 hover:-translate-y-1"
                style={{ borderColor: `${lvl.color}30`, borderTop: `3px solid ${lvl.color}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm mb-3 text-white"
                  style={{ background: lvl.color }}>
                  {lvl.level}
                </div>
                <div className="font-semibold text-sm mb-1" style={{ color: lvl.color }}>{lvl.label}</div>
                <div className="text-xs" style={{ color: "#727272" }}>{lvl.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8 Domains ── */}
      <section id="domains" className="py-20 border-b" style={{ borderColor: "#d8d8d8", background: "#ffffff" }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-3" style={{ color: "#252525" }}>Eight Assessment Domains</h2>
            <p style={{ color: "#727272" }}>Aligned to international standards for credibility and comparability</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DOMAINS.map((d) => (
              <div key={d.name} className="p-5 rounded-xl border bg-white transition-all duration-200 group"
                style={{ borderColor: "#d8d8d8", borderLeft: "3px solid #e2232a" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(226,35,42,0.10)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                <d.icon className="w-6 h-6 mb-3" style={{ color: "#e2232a" }} />
                <div className="font-semibold text-sm mb-1" style={{ color: "#252525" }}>{d.name}</div>
                <div className="text-xs" style={{ color: "#727272" }}>{d.std}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 border-b" style={{ borderColor: "#d8d8d8", background: "#f5f5f5" }}>
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-3" style={{ color: "#252525" }}>Everything You Need</h2>
            <p style={{ color: "#727272" }}>From assessment creation to board-ready reporting</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-xl border bg-white transition-all duration-200"
                style={{ borderColor: "#d8d8d8" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e2232a"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(226,35,42,0.08)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#d8d8d8"; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "rgba(226,35,42,0.08)" }}>
                  <f.icon className="w-5 h-5" style={{ color: "#e2232a" }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "#252525" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#727272" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20" style={{ background: "#1e3640" }}>
        <div className="container">
          <div className="max-w-2xl mx-auto text-center p-12 rounded-2xl border"
            style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)" }}>
            <h2 className="font-display text-3xl font-bold mb-4 text-white">Ready to assess your energy maturity?</h2>
            <p className="mb-8" style={{ color: "rgba(255,255,255,0.65)" }}>
              Sign in to access your organisation's assessments or contact IOT.nxt to get provisioned.
            </p>
            <a href={getLoginUrl()}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base text-white transition-all duration-150 active:scale-95"
              style={{ background: "#e2232a", boxShadow: "0 0 32px rgba(226,35,42,0.35)" }}>
              Sign In to Utility IQ <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8" style={{ borderColor: "#d8d8d8", background: "#ffffff" }}>
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#1e3640" }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold" style={{ color: "#252525" }}>Utility IQ</span>
            <span className="text-xs" style={{ color: "#727272" }}>by IOT.nxt</span>
          </div>
          <p className="text-xs" style={{ color: "#727272" }}>
            © {new Date().getFullYear()} IOT.nxt. Enterprise Energy Maturity Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
