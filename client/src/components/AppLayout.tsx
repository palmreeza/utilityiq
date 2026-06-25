import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import {
  Zap, LayoutDashboard, Building2,
  Shield, LogOut, Menu
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f5f5" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#e2232a", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const isPlatformOwner = (user as any)?.platformRole === "platform_owner" || user?.role === "admin";

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Building2, label: "Organisations", href: "/dashboard" },
    ...(isPlatformOwner ? [{ icon: Shield, label: "Admin Panel", href: "/admin" }] : []),
  ];

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "#1e3640" }}>
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.10)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#e2232a" }}>
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-sm text-white">Utility IQ</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>by IOT.nxt</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <button key={item.href} onClick={() => { navigate(item.href); setSidebarOpen(false); }}
            className={`nav-item w-full ${isActive(item.href) ? "active" : ""}`}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.10)" }}>
        <div className="flex items-center gap-3 p-2.5 rounded-xl mb-2"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
            style={{ background: "#e2232a" }}>
            {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate">{user?.name ?? "User"}</div>
            <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
              {isPlatformOwner ? "Platform Owner" : "Member"}
            </div>
          </div>
        </div>
        <button onClick={() => logout.mutate()}
          className="nav-item w-full"
          style={{ color: "rgba(255,255,255,0.50)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ffffff"; (e.currentTarget as HTMLElement).style.background = "rgba(226,35,42,0.15)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.50)"; (e.currentTarget as HTMLElement).style.background = ""; }}>
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f5f5f5" }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r"
        style={{ background: "#1e3640", borderColor: "rgba(255,255,255,0.08)" }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 flex flex-col"
            style={{ background: "#1e3640" }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b flex-shrink-0"
          style={{ borderColor: "#d8d8d8", background: "#ffffff" }}>
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg text-gray-500">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#e2232a" }}>
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-display font-bold text-sm" style={{ color: "#252525" }}>Utility IQ</span>
          </div>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto" style={{ background: "#f5f5f5" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
