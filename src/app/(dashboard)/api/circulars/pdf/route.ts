import { NextRequest } from "next/server";
import { withAuth, NextResponse } from "@/lib/auth";
import { logError, logWarn } from "@/lib/logging";
import { env } from "@/lib/env";

const MAX_REDIRECT_HOPS = 2;
const ALLOWED_HOSTNAMES = new Set<string>([
  "rbidocs.rbi.org.in",
  "www.rbi.org.in",
  "rbi.org.in",
  "www.sebi.gov.in",
  "sebi.gov.in",
  "circular.sebi.gov.in",
  "www.mca.gov.in",
  "mca.gov.in",
  "cdn.icai.org",
  "www.icai.org",
  "icai.org",
  "icmai.in",
  "www.icmai.in",
  "icsi.edu",
  "www.icsi.edu",
  "www.incometax.gov.in",
  "incometax.gov.in",
  "cbic.gov.in",
  "www.cbic.gov.in",
  "gst.gov.in",
  "www.gst.gov.in",
  "epfindia.gov.in",
  "www.epfindia.gov.in",
  "labour.gov.in",
  "www.labour.gov.in",
]);

function isHostnameAllowed(hostname: string): boolean {
  if (ALLOWED_HOSTNAMES.has(hostname)) return true;
  return hostname.endsWith(".gov.in") ||
    hostname.endsWith(".rbi.org.in") ||
    hostname.endsWith(".sebi.gov.in") ||
    hostname.endsWith(".mca.gov.in") ||
    hostname.endsWith(".icai.org") ||
    hostname.endsWith(".icmai.in") ||
    hostname.endsWith(".icsi.edu") ||
    hostname.endsWith(".incometax.gov.in") ||
    hostname.endsWith(".cbic.gov.in") ||
    hostname.endsWith(".gst.gov.in") ||
    hostname.endsWith(".epfindia.gov.in") ||
    hostname.endsWith(".labour.gov.in");
}

function sanitizeFilename(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "circular.pdf";
}

class BlockedHostError extends Error {
  status = 403;
  constructor(public readonly host: string) {
    super(`PDF hostname not allowed: ${host}`);
    this.name = "BlockedHostError";
  }
}
class InvalidRedirectError extends Error {
  status = 403;
  constructor(public readonly location: string) {
    super(`Malformed redirect location.`);
    this.name = "InvalidRedirectError";
  }
}
class TooManyRedirectsError extends Error {
  status = 403;
  constructor() {
    super(`Too many redirects while fetching PDF.`);
    this.name = "TooManyRedirectsError";
  }
}

async function fetchWithRedirectGuard(
  initialUrl: string,
  headersFetch: HeadersInit,
): Promise<{ response: Response; finalUrl: URL }> {
  let url = new URL(initialUrl);
  let hops = 0;

  while (hops <= MAX_REDIRECT_HOPS) {
    if (!isHostnameAllowed(url.hostname)) {
      logWarn("pdf.ssrf.blocked", "Hostname blocked", {
        hostname: url.hostname,
        url: url.href,
      });
      throw new BlockedHostError(url.hostname);
    }

    const response = await fetch(url, {
      headers: headersFetch,
      redirect: "manual",
    });

    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.has("location")
    ) {
      const location = response.headers.get("location")!;
      let next: URL;
      try {
        next = new URL(location, url);
      } catch {
        logWarn("pdf.redirect.invalid", "Invalid redirect location", { location });
        throw new InvalidRedirectError(location);
      }
      hops += 1;
      if (hops > MAX_REDIRECT_HOPS) {
        logWarn("pdf.redirect.tooMany", "Too many redirects", {
          from: initialUrl,
          hops,
        });
        throw new TooManyRedirectsError();
      }
      url = next;
      continue;
    }

    return { response, finalUrl: url };
  }

  throw new TooManyRedirectsError();
}

export async function GET(req: NextRequest) {
  return withAuth(req, { role: "user" }, async ({ req: r }) => {
    try {
      const url = r.nextUrl.searchParams.get("url");
      if (!url) {
        return NextResponse.json(
          { error: "Missing `url` query param." },
          { status: 400 },
        );
      }
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return NextResponse.json(
          { error: "Invalid `url` parameter." },
          { status: 400 },
        );
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return NextResponse.json(
          { error: "Only http/https URLs allowed." },
          { status: 400 },
        );
      }

      const { response, finalUrl } = await fetchWithRedirectGuard(url, {
        "User-Agent": env.HTTP_USER_AGENT || "RegMitra/1.0 (+https://regmitra.in)",
        "Accept": "application/pdf,*/*;q=0.8",
      });

      if (!response.ok) {
        logWarn("pdf.fetch.upstreamFailed", "Upstream returned non-ok", {
          status: response.status,
          url: finalUrl.href,
        });
        return NextResponse.json(
          { error: "Upstream failed to serve PDF." },
          { status: 502 },
        );
      }

      const contentType = response.headers.get("content-type") || "application/pdf";
      if (!contentType.toLowerCase().includes("pdf")) {
        logWarn("pdf.fetch.badContentType", "Upstream returned non-PDF content", {
          contentType,
          url: finalUrl.href,
        });
        return NextResponse.json(
          { error: "URL does not point to a PDF." },
          { status: 415 },
        );
      }

      const suggestedName =
        finalUrl.pathname.split("/").pop() || "circular.pdf";
      const disposition =
        `inline; filename="${sanitizeFilename(suggestedName)}"`;
      const headers = new Headers();
      headers.set("Content-Type", "application/pdf");
      headers.set("Content-Disposition", disposition);
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("Content-Security-Policy", "default-src 'none'");
      const len = response.headers.get("content-length");
      if (len) headers.set("Content-Length", len);

      const body = new ReadableStream({
        async start(controller) {
          try {
            const reader = response.body!.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
            controller.close();
          } catch (streamErr) {
            logError("pdf.fetch.stream", streamErr);
            controller.error(streamErr as Error);
          }
        },
      });

      return new NextResponse(body, { status: 200, headers });
    } catch (e) {
      if (e instanceof BlockedHostError ||
        e instanceof InvalidRedirectError ||
        e instanceof TooManyRedirectsError) {
        return NextResponse.json(
          { error: e.message },
          { status: e.status },
        );
      }
      logError("pdf.fetch.uncaught", e);
      return NextResponse.json(
        { error: "Failed to fetch PDF." },
        { status: 500 },
      );
    }
  });
}
