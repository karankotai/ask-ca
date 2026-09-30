import { redirect } from "next/navigation";
import SidebarShell from "@/components/SidebarShell";
import HeaderTitle from "@/components/HeaderTitle";
import NotificationBell from "@/components/NotificationBell";
import { getSessionSafe } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionSafe();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="app">
      <SidebarShell />
      <main className="main">
        <header className="header">
          <HeaderTitle />
          <div className="header-actions">
            <NotificationBell />
          </div>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
