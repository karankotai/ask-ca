"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  Calendar,
  Users,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

export type SidebarClient = {
  id: string;
  name: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (path: string) => boolean;
};

type SidebarProps = {
  firmName: string;
  workspaceLabel: string;
  clients: SidebarClient[];
};

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutGrid,
    match: (p) => p === "/",
  },
  {
    href: "/circulars",
    label: "Circulars",
    icon: FileText,
    match: (p) => p.startsWith("/circulars"),
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: Calendar,
    match: (p) => p.startsWith("/calendar"),
  },
];

const INTEL: NavItem[] = [
  {
    href: "/briefings",
    label: "Briefings",
    icon: MessageSquare,
    match: (p) => p.startsWith("/briefings") || p.startsWith("/comms"),
  },
];

export default function Sidebar({
  firmName,
  workspaceLabel,
  clients,
}: SidebarProps) {
  const pathname = usePathname() ?? "/";

  function renderNav(items: NavItem[]) {
    return items.map((item) => {
      const active = item.match ? item.match(pathname) : pathname === item.href;
      const Icon = item.icon;
      return (
        <Link
          key={item.href}
          href={item.href}
          className={`nav-btn ${active ? "active" : ""}`}
        >
          <Icon />
          <span>{item.label}</span>
        </Link>
      );
    });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>RegMitra</h1>
        <p>Regulatory Intelligence</p>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-label">Workspace</div>
        {renderNav(NAV)}
        <div className="nav-label">Intelligence</div>
        {renderNav(INTEL)}
        <div className="nav-label">Clients</div>
        {clients.map((client) => {
          const active = pathname.startsWith(
            `/clients/${client.id}`,
          );
          return (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className={`nav-btn ${active ? "active" : ""}`}
            >
              <Users />
              <span>{client.name}</span>
            </Link>
          );
        })}
        {clients.length === 0 && (
          <div className="nav-empty">No clients yet</div>
        )}
      </nav>
      <div className="sidebar-footer">
        <div className="firm-name">{firmName}</div>
        <div className="firm-loc">{workspaceLabel}</div>
      </div>
    </aside>
  );
}
