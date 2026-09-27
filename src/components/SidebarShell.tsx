import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { logError } from "@/lib/logging";
import { getSessionSafe } from "@/lib/auth";
import Sidebar from "./Sidebar";

export async function SidebarShell() {
  let clientData: { id: string; name: string }[] = [];
  let userEmail: string | undefined;
  let userRole: string | undefined;
  try {
    clientData = await prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
      take: 50,
    });
    const session = await getSessionSafe();
    if (session?.user) {
      userEmail = session.user.email;
      userRole = session.user.role;
    }
  } catch (e) {
    logError("sidebar.clients.fetch", e);
  }

  return (
    <Sidebar
      firmName={env.NEXT_PUBLIC_FIRM_NAME}
      workspaceLabel={env.NEXT_PUBLIC_WORKSPACE_LABEL}
      clients={clientData}
      userEmail={userEmail}
      userRole={userRole}
    />
  );
}

export default SidebarShell;
