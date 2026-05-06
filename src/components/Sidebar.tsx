"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, FileText, Calendar, Users, MessageSquare } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  match?: (path: string) => boolean;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, match: (p) => p === "/" || p.startsWith("/dashboard") },
  { href: "/circulars", label: "Circulars", icon: FileText, match: (p) => p.startsWith("/circulars") },
  { href: "/calendar", label: "Calendar", icon: Calendar, match: (p) => p.startsWith("/calendar") },
];

const INTEL: NavItem[] = [
  { href: "/comms/new", label: "Briefings", icon: MessageSquare, match: (p) => p.startsWith("/comms") },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "/";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Ask CA</h1>
        <p>Regulatory Intelligence</p>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-label">Workspace</div>
        {NAV.map((item) => {
          const active = item.match ? item.match(pathname) : pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`nav-btn ${active ? "active" : ""}`}>
              <Icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <div className="nav-label">Intelligence</div>
        {INTEL.map((item) => {
          const active = item.match ? item.match(pathname) : pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`nav-btn ${active ? "active" : ""}`}>
              <Icon />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <div className="nav-label">Clients</div>
        <Link href="/clients/client_astra" className={`nav-btn ${pathname.startsWith("/clients/client_astra") ? "active" : ""}`}>
          <Users />
          <span>Astra Formulations</span>
        </Link>
        <Link href="/clients/client_northwind" className={`nav-btn ${pathname.startsWith("/clients/client_northwind") ? "active" : ""}`}>
          <Users />
          <span>Northwind Tech India</span>
        </Link>
        <Link href="/clients/client_steelvine" className={`nav-btn ${pathname.startsWith("/clients/client_steelvine") ? "active" : ""}`}>
          <Users />
          <span>Steelvine Auto</span>
        </Link>
      </nav>
      <div className="sidebar-footer">
        <div className="firm-name">Karan Kotai &amp; Associates</div>
        <div className="firm-loc">Demo workspace</div>
      </div>
    </aside>
  );
}
