import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { logError } from "@/lib/logging";
import Sidebar from "./Sidebar";

export async function SidebarShell() {
  let clientData: { id: string; name: string }[] = [];
  try {
    clientData = await prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
      take: 50,
    });
  } catch (e) {
    logError("sidebar.clients.fetch", e);
  }

  return (
    <Sidebar
      firmName={env.NEXT_PUBLIC_FIRM_NAME}
      workspaceLabel={env.NEXT_PUBLIC_WORKSPACE_LABEL}
      clients={clientData}
    />
  );
}

export default SidebarShell;
