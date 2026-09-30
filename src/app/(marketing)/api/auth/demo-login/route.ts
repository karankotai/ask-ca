import { signIn } from "@/lib/auth";
import { logError } from "@/lib/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const origin = new URL(req.url).origin;
    const dashboardUrl = `${origin}/dashboard`;

    const res = await signIn("demo", {
      redirect: false,
      callbackUrl: dashboardUrl,
    });

    if (res instanceof Response) {
      const location = res.headers.get("location");
      if (
        location &&
        (location.startsWith(`${origin}/dashboard`) ||
          location.startsWith("/dashboard")) &&
        !location.includes("error") &&
        !location.includes("CredentialsSignin")
      ) {
        return res;
      }
      if (location) {
        const filtered = res.headers
          .entries()
          .filter(([k]) => k.toLowerCase() !== "location")
          .reduce<Record<string, string>>((acc, [k, v]) => {
            acc[k] = v;
            return acc;
          }, {});
        return new Response(res.body, {
          status: 303,
          headers: { ...filtered, location: dashboardUrl },
        });
      }
      return res;
    }

    return Response.redirect(dashboardUrl, 303);
  } catch (e) {
    logError("auth.demo-login.uncaught", e);
    let origin = "http://localhost:3000";
    try {
      origin = new URL(req.url).origin;
    } catch {
      /* noop */
    }
    return Response.redirect(`${origin}/login?error=DemoServerError`, 303);
  }
}
