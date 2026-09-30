import { getSessionSafe } from "@/lib/auth";
import MarketingPage from "./MarketingPage";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSessionSafe();
  if (session?.user) redirect("/dashboard");
  return <MarketingPage />;
}
