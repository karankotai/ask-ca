import { NextRequest, NextResponse } from "next/server";

/**
 * Proxies external PDF files to bypass X-Frame-Options / CSP restrictions.
 * Usage: /api/circulars/pdf?url=<encoded-pdf-url>
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Only allow known government PDF domains
  const allowed = [
    "rbidocs.rbi.org.in",
    "www.rbi.org.in",
    "rbi.org.in",
    "www.sebi.gov.in",
    "sebi.gov.in",
    "www.mca.gov.in",
    "mca.gov.in",
    "www.irdai.gov.in",
    "irdai.gov.in",
    "egazette.gov.in",
    "www.egazette.gov.in",
  ];

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!allowed.includes(parsed.hostname)) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "application/pdf,*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Referer: parsed.origin + "/",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
      },
      redirect: "follow",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "application/pdf";

    // Detect CAPTCHA / HTML responses when we expected a PDF
    if (
      contentType.includes("text/html") &&
      (url.endsWith(".pdf") || url.includes(".pdf"))
    ) {
      return NextResponse.json(
        { error: "Blocked by CAPTCHA – open PDF directly in browser" },
        { status: 403 }
      );
    }

    const body = upstream.body;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch PDF";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
