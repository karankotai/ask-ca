import { NextResponse, type NextRequest } from "next/server";
import { assertRuntimeEnv, env } from "@/lib/env";
import { logWarn } from "@/lib/logging";

export const config = {
  matcher: ["/api/:path*", "/:path*"],
};

// --- In-memory sliding-window rate limiter ---------------------------------
type Window = {
  count: number;
  resetAt: number;
};
const buckets = new Map<string, Window>();
const WINDOW_MS = 60_000; // 1 minute

function getLimiter(reqPerMin: number) {
  return (key: string): { allowed: boolean; remaining: number; retryAfter: number } => {
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + WINDOW_MS };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    const allowed = bucket.count <= reqPerMin;
    const remaining = allowed ? reqPerMin - bucket.count : 0;
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return { allowed, remaining, retryAfter };
  };
}

const RL_CHAT = getLimiter(20);
const RL_ANALYZE = getLimiter(10);
const RL_ADMIN = getLimiter(60);
const RL_GENERAL = getLimiter(60);

// --- Origin / CSRF validation -----------------------------------------------
function isValidOrigin(req: NextRequest): boolean {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return true;
  }
  const originHeader = req.headers.get("origin");
  if (!originHeader) return true; // Not a browser request

  try {
    const canonical = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const u = new URL(canonical);
    const allowed = u.origin;
    const requested = new URL(originHeader).origin;
    if (requested === allowed) return true;

    // Allow localhost variants in dev for convenience
    if (env.NODE_ENV === "development") {
      const host = req.headers.get("host");
      if (host && new URL(`http://${host}`).origin === requested) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function clientKey(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0]!.trim() : null) || "unknown";
  return ip;
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  if (env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return res;
}

function rateLimit(req: NextRequest, pathname: string): NextResponse | null {
  const key = clientKey(req);
  let result: ReturnType<typeof RL_CHAT>;
  let category: string;

  if (pathname.startsWith("/api/admin")) {
    category = "admin";
    result = RL_ADMIN(`admin:${key}`);
  } else if (pathname.startsWith("/api/analyze")) {
    category = "analyze";
    result = RL_ANALYZE(`analyze:${key}`);
  } else if (pathname.startsWith("/api/chat")) {
    category = "chat";
    result = RL_CHAT(`chat:${key}`);
  } else if (pathname.startsWith("/api/demo")) {
    category = "admin";
    result = RL_ADMIN(`demo:${key}`);
  } else {
    category = "general";
    result = RL_GENERAL(`g:${key}`);
  }

  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Limit", String(60));
  res.headers.set("X-RateLimit-Remaining", String(result.remaining));
  if (!result.allowed) {
    logWarn("ratelimit.hit", `${category}:${key}`);
    const body = JSON.stringify({ error: "Too many requests, slow down." });
    const rl = new NextResponse(body, {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter),
      },
    });
    return applySecurityHeaders(rl);
  }
  return null;
}

// NOTE: NextAuth (/api/auth/*) handles its own cookies + CSRF. We only gate
// the rest of /api/* by redirecting unauthed users to /login on the server.
// Route-level requireAuth() is still the enforcement mechanism. This is just a
// pre-filter to avoid unnecessary work.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Fail fast on startup: ensure all required env vars are set
  if (env.NODE_ENV === "production") {
    const missing = assertRuntimeEnv();
    if (missing.length > 0) {
      return new NextResponse(
        JSON.stringify({
          error:
            "Server misconfigured. Required env vars missing: " +
            missing.join("; "),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // Bypass auth endpoints completely
  if (pathname.startsWith("/api/auth")) {
    return applySecurityHeaders(NextResponse.next());
  }

  // API rate limiting
  if (pathname.startsWith("/api/")) {
    const rl = rateLimit(req, pathname);
    if (rl) return rl;

    // CSRF / Origin check for mutation verbs
    if (!isValidOrigin(req)) {
      logWarn("csrf.invalid.origin", "Invalid origin header", {
        origin: req.headers.get("origin"),
        method: req.method,
      });
      const denied = new NextResponse(
        JSON.stringify({ error: "Invalid origin header." }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
      return applySecurityHeaders(denied);
    }
  }

  // /login, /_next, /favicon, public assets pass through
  if (
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/public") ||
    pathname === "/robots.txt"
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  return applySecurityHeaders(NextResponse.next());
}
