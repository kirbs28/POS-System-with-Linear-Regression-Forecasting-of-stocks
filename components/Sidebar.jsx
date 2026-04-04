"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, ShoppingCart, Package, Upload,
  BarChart3, TrendingUp, Users, LogOut, Menu, X, ChevronRight
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    roles: ["admin", "manager", "cashier"],
  },
  {
    href: "/pos",
    icon: ShoppingCart,
    label: "Point of Sale",
    roles: ["admin", "manager", "cashier"],
  },
  {
    href: "/products",
    icon: Package,
    label: "Products",
    roles: ["admin", "manager"],
  },
  {
    href: "/upload",
    icon: Upload,
    label: "Upload Data",
    roles: ["admin", "manager"],
  },
  {
    href: "/reports",
    icon: BarChart3,
    label: "Reports",
    roles: ["admin", "manager"],
  },
  {
    href: "/forecast",
    icon: TrendingUp,
    label: "Forecast",
    roles: ["admin", "manager"],
  },
  {
    href: "/users",
    icon: Users,
    label: "Users",
    roles: ["admin"],
  },
];

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = session?.user?.role || "cashier";

  const filteredNav = navItems.filter((item) => item.roles.includes(role));

  const roleColors = {
    admin: "bg-jollibee-red text-white",
    manager: "bg-jollibee-orange text-white",
    cashier: "bg-jollibee-yellow text-jollibee-brown",
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-jollibee-yellow/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-jollibee-gradient flex items-center justify-center shadow-md">
            <span className="text-xl">🐝</span>
          </div>
          <div>
            <h1 className="font-display text-jollibee-red text-xl tracking-widest">JOLLIBEE</h1>
            <p className="text-[10px] text-jollibee-brown/50 font-bold uppercase tracking-wider">BI System</p>
          </div>
        </div>
      </div>

      {/* User info */}
      {session && (
        <div className="mx-3 mt-4 p-3 rounded-xl bg-jollibee-cream border border-jollibee-yellow/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-jollibee-gradient flex items-center justify-center text-white font-bold text-sm">
              {session.user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-jollibee-brown text-sm truncate">{session.user.name}</p>
              <span className={`badge text-[10px] ${roleColors[role]}`}>
                {role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <button
              key={item.href}
              onClick={() => { router.push(item.href); setMobileOpen(false); }}
              className={`sidebar-link w-full ${isActive ? "active" : ""}`}
            >
              <Icon size={18} className={isActive ? "text-jollibee-red" : ""} />
              <span className="flex-1 text-left">{item.label}</span>
              {isActive && <ChevronRight size={14} className="text-jollibee-red" />}
            </button>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-jollibee-yellow/20">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-jollibee-yellow/20 fixed left-0 top-0 z-30 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-jollibee-yellow flex items-center justify-center shadow-md"
      >
        <Menu size={20} className="text-jollibee-brown" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
        >
          <X size={16} />
        </button>
        <SidebarContent />
      </aside>
    </>
  );
}
