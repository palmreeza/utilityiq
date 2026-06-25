import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import {
  Zap, LayoutDashboard, Building2, ClipboardList, Settings,
  Shield, LogOut, ChevronDown, Menu, X, Users
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.10 0.01 240)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
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
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: "oklch(0.22 0.015 240)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(0.78 0.18 75)" }}>
            <Zap className="w-4 h-4" style={{ color: "oklch(0.10 0.01 240)" }} />
          </div>
          <div>
            <div className="font-display font-bold text-sm" style={{ color: "oklch(0.96 0.005 240)" }}>Utility IQ</div>
            <div className="text-xs" style={{ color: "oklch(0.50 0.01 240)" }}>by IOT.nxt</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button key={item.href} onClick={() => { navigate(item.href); setSidebarOpen(false); }}
            className={`nav-item w-full ${isActive(item.href) ? "active" : ""}`}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t" style={{ borderColor: "oklch(0.22 0.015 240)" }}>
        <div className="flex items-center gap-3 p-2 rounded-lg mb-2" style={{ background: "oklch(0.16 0.012 240)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0"
            style={{ background: "oklch(0.78 0.18 75 / 0.2)", color: "oklch(0.88 0.16 75)" }}>
            {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{user?.name ?? "User"}</div>
            <div className="text-xs truncate" style={{ color: "oklch(0.50 0.01 240)" }}>
              {isPlatformOwner ? "Platform Owner" : "Member"}
            </div>
          </div>
        </div>
        <button onClick={() => logout.mutate()} className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "oklch(0.10 0.01 240)" }}>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r"
        style={{ background: "oklch(0.10 0.01 240)", borderColor: "oklch(0.22 0.015 240)" }}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 flex flex-col border-r"
            style={{ background: "oklch(0.10 0.01 240)", borderColor: "oklch(0.22 0.015 240)" }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b flex-shrink-0"
          style={{ borderColor: "oklch(0.22 0.015 240)", background: "oklch(0.10 0.01 240)" }}>
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg" style={{ color: "oklch(0.70 0.01 240)" }}>
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "oklch(0.78 0.18 75)" }}>
              <Zap className="w-3 h-3" style={{ color: "oklch(0.10 0.01 240)" }} />
            </div>
            <span className="font-display font-bold text-sm">Utility IQ</span>
          </div>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
