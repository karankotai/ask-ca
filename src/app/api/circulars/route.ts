import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Parse human-readable date strings like "November 28, 2025" or "Feb 06, 2026"
 * into a Date object. Returns null if parsing fails.
 */
function parseCircularDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const source = url.searchParams.get("source");
    const search = url.searchParams.get("search");
    const from = url.searchParams.get("from"); // YYYY-MM
    const to = url.searchParams.get("to"); // YYYY-MM
    const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
    const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 100);

    const where: Prisma.ScrapedDocumentWhereInput = {};

    if (source) {
      where.source = { startsWith: source, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { circularNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch all matching records — we sort by parsed date in JS
    // since dates are stored as human-readable strings (e.g. "November 28, 2025")
    const circulars = await prisma.scrapedDocument.findMany({
      where,
      select: {
        id: true,
        source: true,
        title: true,
        date: true,
        link: true,
        circularNumber: true,
        pdfLinks: true,
        department: true,
      },
    });

    // Parse dates and apply date range filter + sort
    let withParsed = circulars.map((c) => ({
      ...c,
      _parsed: parseCircularDate(c.date),
    }));

    if (from) {
      const fromDate = new Date(from + "-01");
      withParsed = withParsed.filter(
        (c) => c._parsed && c._parsed >= fromDate
      );
    }
    if (to) {
      // End of the selected month
      const toDate = new Date(to + "-01");
      toDate.setMonth(toDate.getMonth() + 1);
      toDate.setDate(0); // last day of month
      toDate.setHours(23, 59, 59, 999);
      withParsed = withParsed.filter((c) => c._parsed && c._parsed <= toDate);
    }

    // Sort by parsed date descending (nulls last)
    withParsed.sort((a, b) => {
      if (!a._parsed && !b._parsed) return 0;
      if (!a._parsed) return 1;
      if (!b._parsed) return -1;
      return b._parsed.getTime() - a._parsed.getTime();
    });

    const filteredTotal = withParsed.length;
    const totalPages = Math.ceil(filteredTotal / limit);
    const offset = (page - 1) * limit;
    const pageItems = withParsed.slice(offset, offset + limit).map(({ _parsed, ...c }) => c);

    return NextResponse.json({
      circulars: pageItems,
      page,
      totalPages,
      total: filteredTotal,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch circulars";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
