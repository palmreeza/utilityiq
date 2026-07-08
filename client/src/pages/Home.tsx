import { useAuth, authLogin, authRegister } from "@/_core/hooks/useAuth";
import { IOTNXT_LOGO } from "@/lib/logo";
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
  { icon: Gauge,    name: "Meter Management",    std: "IEC 62056",          what: "Meter coverage, AMI/AMR deployment, data quality and meter lifecycle management." },
  { icon: Receipt,  name: "Billing",             std: "Revenue Governance", what: "Billing accuracy, revenue protection, tariff management and dispute resolution." },
  { icon: Settings, name: "Asset Operations",    std: "ISO 55001",          what: "Asset register completeness, maintenance strategies, lifecycle planning and performance." },
  { icon: BarChart3,name: "Analytics",           std: "ISO 8000",           what: "Data quality, operational analytics, predictive insights and reporting maturity." },
  { icon: Shield,   name: "Cybersecurity",       std: "NIST CSF / C2M2",   what: "OT/IT security posture, incident response capability and cyber risk governance." },
  { icon: Leaf,     name: "Sustainability",      std: "ISO 50001",          what: "Energy efficiency programmes, carbon reporting, ESG targets and regulatory compliance." },
  { icon: Users,    name: "Customer Engagement", std: "Utility Benchmarks", what: "Customer communication channels, self-service capability and satisfaction measurement." },
  { icon: Zap,      name: "Smart Infrastructure",std: "SEI SGMM",           what: "Grid modernisation, smart device integration and digital infrastructure readiness." },
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

const AUDIENCE_TAGS = [
  "Energy Management",
  "Utility Operations",
  "Sustainability",
  "Asset Management",
  "Cybersecurity",
  "Executive Reporting",
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
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const statsRef = useInView();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      if (authMode === "login") {
        await authLogin(authEmail, authPassword);
      } else {
        if (!authName.trim()) { setAuthError("Name is required"); setAuthLoading(false); return; }
        await authRegister(authName, authEmail, authPassword);
      }
      window.location.href = "/dashboard";
    } catch (err: any) {
      setAuthError(err.message ?? "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };
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
        style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderColor: "#e5e5e5" }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={IOTNXT_LOGO} alt="IoT.nxt" className="h-8 w-auto" />
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-base tracking-tight" style={{ color: "#252525" }}>Utility IQ</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "01 Platform",   href: "#platform" },
              { label: "02 Domains",    href: "#domains" },
              { label: "03 Standards",  href: "#standards" },
              { label: "04 Roadmap",    href: "#roadmap" },
            ].map((item) => (
              <a key={item.label} href={item.href}
                className="text-sm font-medium transition-colors"
                style={{ color: "#727272" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#e2232a")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#727272")}>
                {item.label}
              </a>
            ))}
          </div>
          <button onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-150 active:scale-95"
            style={{ background: "#e2232a", boxShadow: "0 4px 14px rgba(226,35,42,0.30)" }}>
            Access Platform <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section id="platform" className="relative overflow-hidden" style={{ paddingTop: "6rem", background: "linear-gradient(135deg, #0b1220 0%, #111827 50%, #1f2937 100%)" }}>

        {/* ── Ambient orbs ── */}
        <div className="hero-orb-1 absolute pointer-events-none" style={{ top: "-80px", left: "-60px", width: "480px", height: "480px", borderRadius: "50%", background: "radial-gradient(circle, rgba(226,35,42,0.18) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="hero-orb-2 absolute pointer-events-none" style={{ bottom: "-60px", right: "-40px", width: "420px", height: "420px", borderRadius: "50%", background: "radial-gradient(circle, rgba(68,235,202,0.10) 0%, transparent 70%)", filter: "blur(50px)" }} />

        {/* ── Subtle grid texture ── */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04, backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        {/* ── Vignette ── */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, transparent 40%, rgba(0,0,0,0.45) 100%)" }} />

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-0">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left copy */}
            <div className="animate-fade-up">

              {/* Audience strip */}
              <div className="flex flex-wrap gap-2 mb-8">
                {AUDIENCE_TAGS.map((tag) => (
                  <span key={tag}
                    className="text-[11px] font-semibold tracking-wide px-3 py-1 rounded-full border"
                    style={{ borderColor: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.04)" }}>
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="font-display font-bold leading-[1.05] mb-6 text-white"
                style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.6rem)", letterSpacing: "-0.03em" }}>
                Assess. Benchmark.<br />
                <span style={{ color: "#e2232a" }}>Transform.</span><br />
                <span style={{ fontSize: "0.75em", color: "rgba(255,255,255,0.80)" }}>Your Energy &amp; Utility Maturity.</span>
              </h1>

              <p className="text-lg leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.55)", maxWidth: "520px" }}>
                A structured, evidence-based platform that turns complex energy and utility assessments into clear maturity scores, gap analysis, and board-ready transformation roadmaps.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <button
                  onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base text-white"
                  style={{ background: "#e2232a", boxShadow: "0 8px 28px rgba(226,35,42,0.45)", transition: "all 200ms cubic-bezier(0.23,1,0.32,1)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 14px 36px rgba(226,35,42,0.55)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(226,35,42,0.45)"; }}>
                  Access Platform <ArrowRight className="w-5 h-5" />
                </button>
                <a href="#domains"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base border"
                  style={{ borderColor: "rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.75)", background: "rgba(255,255,255,0.04)", transition: "all 200ms cubic-bezier(0.23,1,0.32,1)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.transform = ""; }}>
                  Explore Domains <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-4">
                {["ISO 50001", "ISO 55001", "NIST CSF", "IEC 62056"].map((std) => (
                  <div key={std} className="flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: "rgba(255,255,255,0.35)" }}>
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: "#44ebca" }} />
                    {std}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — mock assessment dashboard card */}
            <div className="relative animate-fade-up delay-150 hidden lg:block">
              {/* Ambient glow behind card */}
              <div className="absolute pointer-events-none" style={{ inset: "-20px", borderRadius: "2rem", background: "radial-gradient(ellipse at 60% 40%, rgba(226,35,42,0.18) 0%, rgba(68,235,202,0.08) 60%, transparent 80%)", filter: "blur(32px)", zIndex: 0 }} />

              {/* Floating card wrapper */}
              <div className="hero-card-float relative" style={{ zIndex: 1 }}>
                <div className="relative rounded-3xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.13)",
                    backdropFilter: "blur(24px)",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.50), 0 1px 0 rgba(255,255,255,0.10) inset"
                  }}>

                  {/* Card header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b"
                    style={{ borderColor: "rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.03)" }}>
                    <div>
                      <div className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: "#44ebca" }}>LIVE ASSESSMENT</div>
                      <div className="text-sm font-semibold text-white">Metro Utility — Q2 2025</div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(68,235,202,0.12)", border: "1px solid rgba(68,235,202,0.25)" }}>
                      {/* Pulsing live dot */}
                      <span className="relative flex h-2 w-2">
                        <span className="live-dot-pulse absolute inline-flex h-full w-full rounded-full" style={{ background: "#44ebca", opacity: 0.6 }} />
                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#44ebca" }} />
                      </span>
                      <span className="text-xs font-bold" style={{ color: "#44ebca" }}>In Progress</span>
                    </div>
                  </div>

                  {/* Domain scores — animated bars */}
                  <div className="p-5 space-y-3">
                    {[
                      { name: "Meter Management",  score: 3, target: 4, delay: "0.4s" },
                      { name: "Analytics",          score: 2, target: 4, delay: "0.55s" },
                      { name: "Cybersecurity",      score: 4, target: 5, delay: "0.7s" },
                      { name: "Sustainability",     score: 1, target: 3, delay: "0.85s" },
                      { name: "Asset Operations",   score: 3, target: 4, delay: "1.0s" },
                    ].map((d) => (
                      <div key={d.name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{d.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold" style={{ color: "#e2232a" }}>{d.score}/5</span>
                            <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>→</span>
                            <span className="text-xs font-bold" style={{ color: "#44ebca" }}>{d.target}/5</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-1.5 flex-1 rounded-full"
                              style={{
                                background: i < d.score ? "#e2232a" : i < d.target ? "rgba(68,235,202,0.22)" : "rgba(255,255,255,0.07)",
                                transform: i < d.score ? "scaleX(1)" : undefined,
                                transformOrigin: "left",
                                transition: `transform 600ms cubic-bezier(0.23,1,0.32,1) ${d.delay}`,
                              }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dashboard metrics row */}
                  <div className="mx-5 mb-4 grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl border text-center" style={{ background: "rgba(226,35,42,0.07)", borderColor: "rgba(226,35,42,0.18)" }}>
                      <div className="font-display text-xl font-bold" style={{ color: "#e2232a" }}>2.6</div>
                      <div className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>Overall Score</div>
                    </div>
                    <div className="p-3 rounded-xl border text-center" style={{ background: "rgba(226,35,42,0.07)", borderColor: "rgba(226,35,42,0.18)" }}>
                      <div className="font-display text-xl font-bold" style={{ color: "#e2232a" }}>+2.0</div>
                      <div className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>Highest Gap</div>
                    </div>
                    <div className="p-3 rounded-xl border text-center" style={{ background: "rgba(68,235,202,0.07)", borderColor: "rgba(68,235,202,0.18)" }}>
                      <div className="font-display text-xl font-bold" style={{ color: "#44ebca" }}>14</div>
                      <div className="text-[10px] font-medium mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>Evidence Items</div>
                    </div>
                  </div>

                  {/* Overall score with animated ring */}
                  <div className="mx-5 mb-5 p-4 rounded-2xl flex items-center gap-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="relative w-14 h-14 flex-shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2232a" strokeWidth="3"
                          strokeDasharray="52 100" strokeLinecap="round"
                          style={{ animation: "ringDraw 1.2s cubic-bezier(0.23,1,0.32,1) 0.3s both" }} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white">52%</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Overall Maturity</div>
                      <div className="font-display text-2xl font-bold" style={{ color: "#e2232a" }}>2.6 <span className="text-sm font-normal" style={{ color: "rgba(255,255,255,0.35)" }}>/5</span></div>
                      <div className="text-xs font-medium" style={{ color: "#44ebca" }}>Understand — Energy Intelligence</div>
                    </div>
                  </div>

                  {/* Assessors */}
                  <div className="px-5 pb-5 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {["#e2232a","#1e3640","#44ebca","#727272"].map((c, i) => (
                        <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: c, borderColor: "rgba(255,255,255,0.12)" }}>
                          {["A","B","C","D"][i]}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>4 assessors · 3 domains complete</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Angled section transition ── */}
        <div style={{ marginTop: "5rem", lineHeight: 0 }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ width: "100%", height: "60px", display: "block" }}>
            <path d="M0,0 L1440,40 L1440,60 L0,60 Z" fill="#ffffff" />
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
                style={{ borderColor: "#e5e5e5", borderTop: "3px solid #1e3640" }}>
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
          01 PLATFORM — EMS MATURITY LADDER
      ════════════════════════════════════════ */}
      <section id="platform-detail" className="py-28" style={{ background: "#f7f7f7" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#727272" }}>01 PLATFORM</div>
            <h2 className="font-display font-bold mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em", color: "#252525" }}>
              IOT.nxt Energy<br />Maturity Model
            </h2>
            <p style={{ color: "#727272", lineHeight: 1.7 }}>
              Five progressive levels guide organisations from basic energy visibility through to active market participation. Utility IQ tells you exactly where you are — and what it takes to reach the next level.
            </p>
          </div>

          <div className="space-y-3">
            {EMS_LEVELS.map((lvl) => (
              <div key={lvl.level}
                className="flex items-center gap-6 p-5 rounded-2xl border bg-white transition-all duration-300 cursor-default"
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
          02 ASSESSMENT DOMAINS
      ════════════════════════════════════════ */}
      <section id="domains" className="py-28" style={{ background: "#1e3640" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "rgba(255,255,255,0.40)" }}>02 ASSESSMENT DOMAINS</div>
              <h2 className="font-display font-bold text-white" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}>
                Eight Domains.<br />One Platform.
              </h2>
            </div>
            <p className="text-base max-w-sm" style={{ color: "rgba(255,255,255,0.50)", lineHeight: 1.7 }}>
              Every domain is aligned to an internationally recognised standard, giving your assessment credibility with regulators, boards and auditors.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {DOMAINS.map((d, i) => (
              <div key={d.name}
                className="group p-5 rounded-2xl border transition-all duration-300 cursor-default"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: i % 2 === 0 ? "rgba(226,35,42,0.18)" : "rgba(68,235,202,0.12)" }}>
                  <d.icon className="w-5 h-5" style={{ color: i % 2 === 0 ? "#e2232a" : "#44ebca" }} />
                </div>
                <div className="font-semibold text-sm mb-1 text-white">{d.name}</div>
                <div className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: "rgba(255,255,255,0.30)" }}>{d.std}</div>
                <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{d.what}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════ */}
      <section id="features" className="py-28" style={{ background: "#ffffff" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#727272" }}>CAPABILITIES</div>
            <h2 className="font-display font-bold mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em", color: "#252525" }}>
              Built for the Entire<br />Assessment Lifecycle
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#727272" }}>
              From provisioning a client organisation to handing over a board-ready report — every step is covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                className="group p-7 rounded-2xl border transition-all duration-300"
                style={{ borderColor: "#e5e5e5", borderTop: `3px solid ${i % 2 === 0 ? "#1e3640" : "#e2232a"}` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(37,37,37,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ""; (e.currentTarget as HTMLElement).style.transform = ""; }}>
                <div className="text-[10px] font-bold tracking-widest uppercase mb-4 px-2 py-1 rounded w-fit"
                  style={{ background: "rgba(30,54,64,0.07)", color: "#1e3640" }}>
                  {f.tag}
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(30,54,64,0.07)" }}>
                  <f.icon className="w-5 h-5" style={{ color: "#1e3640" }} />
                </div>
                <h3 className="font-display font-bold text-lg mb-3" style={{ color: "#252525" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#727272" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          03 STANDARDS ALIGNMENT
      ════════════════════════════════════════ */}
      <section id="standards" className="py-28" style={{ background: "#f7f7f7" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#727272" }}>03 STANDARDS ALIGNMENT</div>
            <h2 className="font-display font-bold mb-3" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", letterSpacing: "-0.02em", color: "#252525" }}>
              Industry-aligned assessment framework.
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: "#727272" }}>
              Informed by recognised energy, asset, cybersecurity, sustainability and smart infrastructure frameworks.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { std: "ISO 50001",    desc: "Energy Management Systems",        domain: "Sustainability" },
              { std: "ISO 55001",    desc: "Asset Management",                 domain: "Asset Operations" },
              { std: "NIST CSF",     desc: "Cybersecurity Framework",          domain: "Cybersecurity" },
              { std: "IEC 62056",    desc: "Smart Metering Data Exchange",     domain: "Meter Management" },
              { std: "C2M2",         desc: "Cybersecurity Capability Maturity", domain: "Cybersecurity" },
              { std: "ISO 8000",     desc: "Data Quality",                     domain: "Analytics" },
              { std: "SEI SGMM",     desc: "Smart Grid Maturity Model",        domain: "Smart Infrastructure" },
              { std: "ISO 14001",    desc: "Environmental Management",         domain: "Sustainability" },
            ].map((s) => (
              <div key={s.std} className="p-4 rounded-xl bg-white border flex flex-col gap-1"
                style={{ borderColor: "#e5e5e5" }}>
                <div className="font-display font-bold text-base" style={{ color: "#1e3640" }}>{s.std}</div>
                <div className="text-xs font-medium" style={{ color: "#252525" }}>{s.desc}</div>
                <div className="text-[10px] font-bold tracking-widest uppercase mt-1" style={{ color: "#c9c9c9" }}>{s.domain}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          04 ROADMAP OUTPUT — HOW IT WORKS
      ════════════════════════════════════════ */}
      <section id="roadmap" className="py-28" style={{ background: "#ffffff" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#727272" }}>04 ROADMAP OUTPUT</div>
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
                    style={{ background: "linear-gradient(90deg, #1e3640, #e5e5e5)", width: "calc(100% - 3rem)", left: "calc(100% - 1.5rem)" }} />
                )}
                <div className="relative z-10 p-6 rounded-2xl border bg-white"
                  style={{ borderColor: "#e5e5e5", borderTop: "3px solid #1e3640" }}>
                  <div className="font-display font-bold text-4xl mb-4" style={{ color: "#f0f0f0" }}>{s.step}</div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(30,54,64,0.07)" }}>
                    <s.icon className="w-5 h-5" style={{ color: "#1e3640" }} />
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
          CTA / ACCESS
      ════════════════════════════════════════ */}
      <section className="py-28" style={{ background: "#1e3640" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden p-12 md:p-16 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)" }}>
            {/* Subtle red glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
              style={{ background: "#e2232a" }} />

            <div className="relative">
              <div className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#44ebca" }}>REQUEST ACCESS</div>
              <h2 className="font-display font-bold text-white mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}>
                Ready to Know Where<br />You Stand?
              </h2>
              <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
                Contact IOT.nxt to have your organisation provisioned on Utility IQ and begin your first structured energy maturity assessment.
              </p>
              <div id="auth-section" className="flex flex-col items-center gap-4 max-w-sm mx-auto">
                {/* Auth mode toggle */}
                <div className="flex rounded-xl overflow-hidden border w-full" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                  {(["login", "register"] as const).map((mode) => (
                    <button key={mode} onClick={() => { setAuthMode(mode); setAuthError(""); }}
                      className="flex-1 py-2.5 text-sm font-semibold transition-all"
                      style={{ background: authMode === mode ? "#e2232a" : "transparent", color: authMode === mode ? "#fff" : "rgba(255,255,255,0.50)" }}>
                      {mode === "login" ? "Sign In" : "Request Access"}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleAuth} className="w-full flex flex-col gap-3">
                  {authMode === "register" && (
                    <input value={authName} onChange={e => setAuthName(e.target.value)}
                      placeholder="Full name" required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
                  )}
                  <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                    placeholder="Email address" required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
                  <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)}
                    placeholder="Password" required minLength={8}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }} />
                  {authError && <p className="text-sm text-center" style={{ color: "#ff8080" }}>{authError}</p>}
                  <button type="submit" disabled={authLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-base text-white transition-all duration-150 active:scale-95 disabled:opacity-60"
                    style={{ background: "#e2232a", boxShadow: "0 8px 32px rgba(226,35,42,0.40)" }}>
                    {authLoading ? "Please wait…" : authMode === "login" ? "Sign In" : "Request Access"}
                    {!authLoading && <ArrowRight className="w-5 h-5" />}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="border-t py-12" style={{ borderColor: "rgba(255,255,255,0.08)", background: "#0d1f26" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col gap-2">
              <img src={IOTNXT_LOGO} alt="IoT.nxt" className="h-7 w-auto brightness-0 invert" />
              <div className="font-display font-bold text-white">Utility IQ</div>
              <div className="text-xs font-semibold tracking-wide" style={{ color: "rgba(255,255,255,0.40)" }}>
                Industry-aligned. Evidence-based. Executive-ready.
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-5">
              {["ISO 50001", "ISO 55001", "NIST CSF", "IEC 62056", "C2M2", "SEI SGMM"].map((s) => (
                <span key={s} className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>{s}</span>
              ))}
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
              © {new Date().getFullYear()} IOT.nxt. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
