import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import {
  Zap, BarChart3, Shield, Leaf, Gauge, Receipt, Settings, Users,
  ArrowRight, FileText, Target, ChevronRight, CheckCircle,
  TrendingUp, Activity, Lock, Globe
} from "lucide-react";

/* ── Animated counter hook ── */
function useCounter(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

/* ── Intersection observer hook ── */
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ── Data ── */
const DOMAINS = [
  { icon: Gauge,    name: "Meter Management",    std: "IEC 62056",         color: "#e2232a" },
  { icon: Receipt,  name: "Billing",             std: "Revenue Governance", color: "#1e3640" },
  { icon: Settings, name: "Asset Operations",    std: "ISO 55001",          color: "#e2232a" },
  { icon: BarChart3,name: "Analytics",           std: "ISO 8000",           color: "#1e3640" },
  { icon: Shield,   name: "Cybersecurity",       std: "NIST CSF / C2M2",   color: "#e2232a" },
  { icon: Leaf,     name: "Sustainability",      std: "ISO 50001",          color: "#1e3640" },
  { icon: Users,    name: "Customer Engagement", std: "Utility Benchmarks", color: "#e2232a" },
  { icon: Zap,      name: "Smart Infrastructure",std: "SEI SGMM",           color: "#1e3640" },
];

const EMS_LEVELS = [
  { level: 1, label: "See",        sub: "Energy Visibility",    color: "#e2232a",  width: "20%" },
  { level: 2, label: "Understand", sub: "Energy Intelligence",  color: "#c0392b",  width: "40%" },
  { level: 3, label: "Optimise",   sub: "Energy Optimisation",  color: "#922b21",  width: "60%" },
  { level: 4, label: "Automate",   sub: "Energy Orchestration", color: "#1e3640",  width: "80%" },
  { level: 5, label: "Monetise",   sub: "Market Participation", color: "#0d1f26",  width: "100%" },
];

const FEATURES = [
  { icon: Target,    title: "Team-Based Scoring",      desc: "Multiple assessors score independently. Variance detection flags disagreements. Facilitator consensus locks the final score.", tag: "WORKFLOW" },
  { icon: BarChart3, title: "Visual Gap Analysis",     desc: "Radar charts, domain bar charts, and capability heatmaps transform raw scores into instantly readable executive insights.", tag: "ANALYTICS" },
  { icon: TrendingUp,title: "Transformation Roadmap",  desc: "Rules-based engine converts maturity gaps into prioritised roadmap items across four delivery horizons, mapped to IOT.nxt EMS packages.", tag: "STRATEGY" },
  { icon: FileText,  title: "Board-Ready Reports",     desc: "One-click print-to-PDF executive report with cover, scores, gap analysis, and roadmap. Ready for the boardroom.", tag: "REPORTING" },
  { icon: Lock,      title: "Full Audit Trail",        desc: "Every score, evidence reference, and approval event is immutably logged. Governance-ready from day one.", tag: "GOVERNANCE" },
  { icon: Globe,     title: "Multi-Tenant Platform",   desc: "Provision client organisations as isolated tenants. Six roles from Platform Owner to Executive Viewer. Enterprise-grade from the ground up.", tag: "ENTERPRISE" },
];

const STATS = [
  { value: 8,   suffix: "",  label: "Assessment Domains" },
  { value: 25,  suffix: "+", label: "Capabilities Assessed" },
  { value: 5,   suffix: "",  label: "EMS Maturity Levels" },
  { value: 4,   suffix: "",  label: "Roadmap Horizons" },
];

/* ── Score bar component ── */
function ScoreBar({ score, max = 5, color }: { score: number; max?: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className="h-2 flex-1 rounded-full transition-all duration-500"
          style={{ background: i < score ? color : "rgba(255,255,255,0.15)" }} />
      ))}
    </div>
  );
}

export default function Home() {
  const { loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const statsRef = useInView();
  const c0 = useCounter(STATS[0].value, 1200, statsRef.inView);
  const c1 = useCounter(STATS[1].value, 1500, statsRef.inView);
  const c2 = useCounter(STATS[2].value, 1000, statsRef.inView);
  const c3 = useCounter(STATS[3].value, 800,  statsRef.inView);
  const counters = [c0, c1, c2, c3];

  useEffect(() => {
    if (!loading && isAuthenticated) navigate("/dashboard");
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#1e3640" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#e2232a", borderTopColor: "transparent" }} />
          <p className="text-sm text-white/60 font-medium tracking-widest uppercase">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#ffffff", color: "#252525" }}>

      {/* ════════════════════════════════════════
          NAV
      ════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b"
        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderColor: "#e5e5e5" }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#1e3640" }}>
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-base tracking-tight" style={{ color: "#252525" }}>Utility IQ</span>
              <span className="text-[10px] font-medium tracking-widest uppercase" style={{ color: "#727272" }}>by IOT.nxt</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Platform", "Domains", "Features", "Standards"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-sm font-medium transition-colors"
                style={{ color: "#727272" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#e2232a")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#727272")}>
                {item}
              </a>
            ))}
          </div>
          <a href={getLoginUrl()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-150 active:scale-95"
            style={{ background: "#e2232a", boxShadow: "0 4px 14px rgba(226,35,42,0.35)" }}>
            Sign In <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </nav>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section id="platform" style={{ background: "#1e3640", paddingTop: "6rem" }}>
        {/* Diagonal red accent bar */}
        <div className="absolute left-0 right-0 h-1" style={{ background: "#e2232a", top: "64px" }} />

        <div className="max-w-7xl mx-auto px-6 pt-20 pb-0">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left copy */}
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border"
                style={{ background: "rgba(226,35,42,0.15)", borderColor: "rgba(226,35,42,0.40)", color: "#ff8080" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#e2232a" }} />
                Enterprise B2B SaaS Platform
              </div>

              <h1 className="font-display font-bold leading-[1.05] mb-6 text-white"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", letterSpacing: "-0.03em" }}>
                Measure What<br />
                <span style={{ color: "#e2232a" }}>Matters</span> in<br />
                Energy Maturity
              </h1>

              <p className="text-lg leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.65)", maxWidth: "520px" }}>
                Utility IQ transforms spreadsheet-based maturity assessments into a repeatable, team-based, auditable digital workflow — from initial scoring to board-ready transformation roadmaps.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <a href={getLoginUrl()}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base text-white transition-all duration-150 active:scale-95"
                  style={{ background: "#e2232a", boxShadow: "0 8px 24px rgba(226,35,42,0.40)" }}>
                  Get Started <ArrowRight className="w-5 h-5" />
                </a>
                <a href="#features"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base border transition-all duration-150"
                  style={{ borderColor: "rgba(255,255,255,0.20)", color: "rgba(255,255,255,0.80)" }}>
                  Explore Features <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4">
                {["ISO 50001", "ISO 55001", "NIST CSF", "IEC 62056"].map((std) => (
                  <div key={std} className="flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: "rgba(255,255,255,0.45)" }}>
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: "#44ebca" }} />
                    {std}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — mock assessment card */}
            <div className="relative animate-fade-up delay-150 hidden lg:block">
              {/* Glow */}
              <div className="absolute inset-0 rounded-3xl blur-3xl opacity-30 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center, #e2232a, transparent)" }} />

              <div className="relative rounded-3xl border overflow-hidden"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(20px)" }}>

                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.10)" }}>
                  <div>
                    <div className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: "#44ebca" }}>LIVE ASSESSMENT</div>
                    <div className="text-sm font-semibold text-white">Eskom Holdings — Q2 2025</div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(226,35,42,0.25)", color: "#ff8080" }}>
                    In Progress
                  </div>
                </div>

                {/* Domain scores */}
                <div className="p-5 space-y-3">
                  {[
                    { name: "Meter Management",    score: 3, target: 4 },
                    { name: "Analytics",           score: 2, target: 4 },
                    { name: "Cybersecurity",       score: 4, target: 5 },
                    { name: "Sustainability",      score: 1, target: 3 },
                    { name: "Asset Operations",    score: 3, target: 4 },
                  ].map((d) => (
                    <div key={d.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.70)" }}>{d.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: "#e2232a" }}>{d.score}/5</span>
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>→</span>
                          <span className="text-xs font-bold" style={{ color: "#44ebca" }}>{d.target}/5</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="h-1.5 flex-1 rounded-full"
                            style={{
                              background: i < d.score ? "#e2232a" : i < d.target ? "rgba(68,235,202,0.25)" : "rgba(255,255,255,0.08)"
                            }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overall score */}
                <div className="mx-5 mb-5 p-4 rounded-2xl border"
                  style={{ background: "rgba(226,35,42,0.10)", borderColor: "rgba(226,35,42,0.25)" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>Overall Maturity</div>
                      <div className="font-display text-3xl font-bold" style={{ color: "#e2232a" }}>2.6 <span className="text-base font-normal" style={{ color: "rgba(255,255,255,0.40)" }}>/5</span></div>
                      <div className="text-xs mt-0.5 font-medium" style={{ color: "#44ebca" }}>Understand — Energy Intelligence</div>
                    </div>
                    <div className="relative w-16 h-16">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2232a" strokeWidth="3"
                          strokeDasharray={`${(2.6/5)*100} 100`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white">52%</div>
                    </div>
                  </div>
                </div>

                {/* Assessors */}
                <div className="px-5 pb-5 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {["#e2232a","#1e3640","#44ebca","#727272"].map((c, i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ background: c, borderColor: "rgba(255,255,255,0.15)" }}>
                        {["A","B","C","D"][i]}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>4 assessors · 3 domains complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div style={{ marginTop: "4rem", lineHeight: 0 }}>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ width: "100%", height: "80px", display: "block" }}>
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* ════════════════════════════════════════
          STATS
      ════════════════════════════════════════ */}
      <section ref={statsRef.ref} className="py-16" style={{ background: "#ffffff" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <div key={stat.label} className="text-center p-6 rounded-2xl border"
                style={{ borderColor: "#e5e5e5", borderTop: "3px solid #e2232a" }}>
                <div className="font-display font-bold mb-1" style={{ fontSize: "3rem", color: "#252525", lineHeight: 1 }}>
                  {counters[i]}{stat.suffix}
                </div>
                <div className="text-sm font-medium" style={{ color: "#727272" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          EMS MATURITY LADDER
      ════════════════════════════════════════ */}
      <section id="platform-detail" className="py-24" style={{ background: "#f5f5f5" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#e2232a" }}>THE FRAMEWORK</div>
            <h2 className="font-display font-bold mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em", color: "#252525" }}>
              IOT.nxt Energy<br />Maturity Model
            </h2>
            <p style={{ color: "#727272", lineHeight: 1.7 }}>
              Five progressive levels guide organisations from basic energy visibility through to active market participation. Utility IQ tells you exactly where you are — and what it takes to get to the next level.
            </p>
          </div>

          <div className="space-y-3">
            {EMS_LEVELS.map((lvl, i) => (
              <div key={lvl.level}
                className="flex items-center gap-6 p-5 rounded-2xl border bg-white transition-all duration-300 group cursor-default"
                style={{ borderColor: "#e5e5e5" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = lvl.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${lvl.color}18`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5"; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}>

                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg text-white flex-shrink-0"
                  style={{ background: lvl.color }}>
                  {lvl.level}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-display font-bold text-lg" style={{ color: "#252525" }}>{lvl.label}</span>
                    <span className="text-sm font-medium" style={{ color: "#727272" }}>— {lvl.sub}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#f0f0f0" }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: lvl.width, background: lvl.color }} />
                  </div>
                </div>

                <div className="text-sm font-bold flex-shrink-0" style={{ color: lvl.color }}>
                  Level {lvl.level}/5
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          8 DOMAINS
      ════════════════════════════════════════ */}
      <section id="domains" className="py-24" style={{ background: "#1e3640" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#44ebca" }}>ASSESSMENT SCOPE</div>
              <h2 className="font-display font-bold text-white" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}>
                Eight Domains.<br />One Platform.
              </h2>
            </div>
            <p className="text-base max-w-sm" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
              Every domain is aligned to an internationally recognised standard, giving your assessment credibility with regulators, boards and auditors.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DOMAINS.map((d, i) => (
              <div key={d.name}
                className="group p-5 rounded-2xl border transition-all duration-300 cursor-default"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(226,35,42,0.12)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(226,35,42,0.35)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: i % 2 === 0 ? "rgba(226,35,42,0.20)" : "rgba(68,235,202,0.15)" }}>
                  <d.icon className="w-5 h-5" style={{ color: i % 2 === 0 ? "#e2232a" : "#44ebca" }} />
                </div>
                <div className="font-semibold text-sm mb-1 text-white">{d.name}</div>
                <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.40)" }}>{d.std}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════ */}
      <section id="features" className="py-24" style={{ background: "#ffffff" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#e2232a" }}>CAPABILITIES</div>
            <h2 className="font-display font-bold mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em", color: "#252525" }}>
              Built for the Entire<br />Assessment Lifecycle
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#727272" }}>
              From provisioning a client tenant to handing over a board-ready PDF — every step is covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className="group p-7 rounded-2xl border transition-all duration-300"
                style={{ borderColor: "#e5e5e5", borderTop: `3px solid ${i % 2 === 0 ? "#e2232a" : "#1e3640"}` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(37,37,37,0.10)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; (e.currentTarget as HTMLElement).style.transform = ""; }}>
                <div className="text-[10px] font-bold tracking-widest uppercase mb-4 px-2 py-1 rounded w-fit"
                  style={{ background: i % 2 === 0 ? "rgba(226,35,42,0.08)" : "rgba(30,54,64,0.08)", color: i % 2 === 0 ? "#e2232a" : "#1e3640" }}>
                  {f.tag}
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: i % 2 === 0 ? "rgba(226,35,42,0.08)" : "rgba(30,54,64,0.08)" }}>
                  <f.icon className="w-5 h-5" style={{ color: i % 2 === 0 ? "#e2232a" : "#1e3640" }} />
                </div>
                <h3 className="font-display font-bold text-lg mb-3" style={{ color: "#252525" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#727272" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          STANDARDS CREDIBILITY STRIP
      ════════════════════════════════════════ */}
      <section id="standards" className="py-16 border-y" style={{ borderColor: "#e5e5e5", background: "#f5f5f5" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#727272" }}>STANDARDS ALIGNMENT</div>
            <h3 className="font-display font-bold text-xl" style={{ color: "#252525" }}>
              Your assessment is credible because it is grounded in recognised standards
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { std: "ISO 50001",    desc: "Energy Management Systems",       domain: "Sustainability" },
              { std: "ISO 55001",    desc: "Asset Management",                domain: "Asset Operations" },
              { std: "NIST CSF",     desc: "Cybersecurity Framework",         domain: "Cybersecurity" },
              { std: "IEC 62056",    desc: "Smart Metering Data Exchange",    domain: "Meter Management" },
              { std: "C2M2",         desc: "Cybersecurity Capability Maturity",domain: "Cybersecurity" },
              { std: "ISO 8000",     desc: "Data Quality",                    domain: "Analytics" },
              { std: "SEI SGMM",     desc: "Smart Grid Maturity Model",       domain: "Smart Infrastructure" },
              { std: "ISO 14001",    desc: "Environmental Management",        domain: "Sustainability" },
            ].map((s) => (
              <div key={s.std} className="p-4 rounded-xl bg-white border flex flex-col gap-1"
                style={{ borderColor: "#e5e5e5" }}>
                <div className="font-display font-bold text-base" style={{ color: "#e2232a" }}>{s.std}</div>
                <div className="text-xs font-medium" style={{ color: "#252525" }}>{s.desc}</div>
                <div className="text-[10px] font-bold tracking-widest uppercase mt-1" style={{ color: "#c9c9c9" }}>{s.domain}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════ */}
      <section className="py-24" style={{ background: "#ffffff" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#e2232a" }}>PROCESS</div>
            <h2 className="font-display font-bold mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em", color: "#252525" }}>
              From Engagement to Roadmap<br />in Four Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Provision",    desc: "IOT.nxt provisions the client as a tenant and assigns roles — Facilitator, Assessors, Reviewers and Executive Viewers.", icon: Users },
              { step: "02", title: "Assess",       desc: "Assessors score each capability independently with a current score, target score, confidence level and evidence reference.", icon: Activity },
              { step: "03", title: "Analyse",      desc: "The platform calculates weighted scores, detects high-variance capabilities, and generates gap analysis across all 8 domains.", icon: BarChart3 },
              { step: "04", title: "Transform",    desc: "A prioritised roadmap is auto-generated, mapped to IOT.nxt EMS packages and four delivery horizons. Export to PDF.", icon: TrendingUp },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                {i < 3 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px z-0"
                    style={{ background: "linear-gradient(90deg, #e2232a, #e5e5e5)", width: "calc(100% - 3rem)", left: "calc(100% - 1.5rem)" }} />
                )}
                <div className="relative z-10 p-6 rounded-2xl border bg-white"
                  style={{ borderColor: "#e5e5e5", borderTop: "3px solid #e2232a" }}>
                  <div className="font-display font-bold text-4xl mb-4" style={{ color: "#f0f0f0" }}>{s.step}</div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(226,35,42,0.08)" }}>
                    <s.icon className="w-5 h-5" style={{ color: "#e2232a" }} />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2" style={{ color: "#252525" }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#727272" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA
      ════════════════════════════════════════ */}
      <section className="py-24" style={{ background: "#1e3640" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden p-12 md:p-16 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}>
            {/* Red glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ background: "#e2232a" }} />

            <div className="relative">
              <div className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#44ebca" }}>GET STARTED</div>
              <h2 className="font-display font-bold text-white mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}>
                Ready to Know Where<br />You Stand?
              </h2>
              <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.60)" }}>
                Contact IOT.nxt to get your organisation provisioned on Utility IQ and start your first energy maturity assessment.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href={getLoginUrl()}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-white transition-all duration-150 active:scale-95"
                  style={{ background: "#e2232a", boxShadow: "0 8px 32px rgba(226,35,42,0.45)" }}>
                  Sign In to Utility IQ <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="border-t py-10" style={{ borderColor: "rgba(255,255,255,0.08)", background: "#0d1f26" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#e2232a" }}>
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-display font-bold text-white">Utility IQ</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Enterprise Energy Maturity Platform by IOT.nxt</div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {["ISO 50001", "ISO 55001", "NIST CSF", "IEC 62056", "C2M2", "SEI SGMM"].map((s) => (
                <span key={s} className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.30)" }}>{s}</span>
              ))}
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
              © {new Date().getFullYear()} IOT.nxt. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
