import { useAuth } from "@/_core/hooks/useAuth";
import { IOTNXT_LOGO } from "@/lib/logo";
import { useLocation } from "wouter";
import { useState } from "react";
import {
  Zap, LayoutDashboard, Building2,
  Shield, LogOut, Menu, X, ChevronRight
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function AppLayout({ children, title, subtitle, actions }: AppLayoutProps) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
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
  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard",     href: "/dashboard",  desc: "Overview" },
    { icon: Building2,       label: "Organisations", href: "/dashboard",  desc: "Tenants" },
    ...(isPlatformOwner ? [{ icon: Shield, label: "Admin Panel", href: "/admin", desc: "Platform" }] : []),
  ];

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  const SidebarContent = () => (
    <div className="flex flex-col h-full relative overflow-hidden" style={{ background: "#1e3640" }}>
      {/* Subtle background texture */}
      <div className="absolute inset-0 pointer-events-none opacity-5"
        style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #e2232a 0%, transparent 60%)" }} />

      {/* Logo area */}
      <div className="relative px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <img src={IOTNXT_LOGO} alt="IoT.nxt" className="h-7 w-auto brightness-0 invert" />
            <div className="font-display font-bold text-sm text-white tracking-tight">Utility IQ</div>
          </div>
        </div>

        {/* Red accent line */}
        <div className="mt-5 h-px" style={{ background: "linear-gradient(90deg, #e2232a, transparent)" }} />
      </div>

      {/* Section label */}
      <div className="px-5 pb-2">
        <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.30)" }}>
          Navigation
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-4">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <button key={item.href + item.label}
              onClick={() => { navigate(item.href); setSidebarOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group relative"
              style={{
                background: active ? "rgba(226,35,42,0.20)" : "transparent",
                color: active ? "#ffffff" : "rgba(255,255,255,0.55)",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#ffffff"; }}
              onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; } }}>
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: "#e2232a" }} />
              )}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all`}
                style={{ background: active ? "rgba(226,35,42,0.30)" : "rgba(255,255,255,0.06)" }}>
                <item.icon className="w-4 h-4" style={{ color: active ? "#e2232a" : "inherit" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold leading-none mb-0.5">{item.label}</div>
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.30)" }}>{item.desc}</div>
              </div>
              {active && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#e2232a" }} />}
            </button>
          );
        })}
      </nav>

      {/* Bottom divider */}
      <div className="mx-5 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

      {/* User profile */}
      <div className="p-4">
        <div className="p-3 rounded-2xl mb-2" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #e2232a, #8c191c)" }}>
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate leading-none mb-0.5">{user?.name ?? "User"}</div>
              <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: isPlatformOwner ? "#44ebca" : "rgba(255,255,255,0.35)" }}>
                {isPlatformOwner ? "Platform Owner" : "Member"}
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => logout()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150"
          style={{ color: "rgba(255,255,255,0.40)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(226,35,42,0.15)"; (e.currentTarget as HTMLElement).style.color = "#ff8080"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.40)"; }}>
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f0f0f0" }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0"
        style={{ background: "#1e3640", boxShadow: "4px 0 24px rgba(0,0,0,0.15)" }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col shadow-2xl"
            style={{ background: "#1e3640" }}>
            <div className="absolute top-4 right-4">
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.50)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header bar */}
        {(title || actions) && (
          <header className="flex-shrink-0 border-b px-6 py-4 flex items-center justify-between gap-4"
            style={{ background: "#ffffff", borderColor: "#e5e5e5", boxShadow: "0 1px 0 #e5e5e5" }}>
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button className="lg:hidden p-1.5 rounded-lg mr-1" onClick={() => setSidebarOpen(true)}
                style={{ color: "#727272" }}>
                <Menu className="w-5 h-5" />
              </button>
              <div>
                {title && <h1 className="font-display font-bold text-xl" style={{ color: "#252525", letterSpacing: "-0.02em" }}>{title}</h1>}
                {subtitle && <p className="text-sm mt-0.5" style={{ color: "#727272" }}>{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
          </header>
        )}

        {/* Mobile top bar (when no title) */}
        {!title && (
          <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b flex-shrink-0"
            style={{ borderColor: "#e5e5e5", background: "#ffffff" }}>
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg" style={{ color: "#727272" }}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <img src={IOTNXT_LOGO} alt="IoT.nxt" className="h-6 w-auto" />
              <span className="font-display font-bold text-sm" style={{ color: "#252525" }}>Utility IQ</span>
            </div>
          </div>
        )}

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "#f5f5f5" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
