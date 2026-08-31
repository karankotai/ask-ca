import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Currency ---------------------------------------------------------------
export type INRDenomination = "lakh" | "crore" | "auto";

export function formatINR(
  value: number | null | undefined,
  denomination: INRDenomination = "auto",
  digits = 2,
): string {
  if (value == null || Number.isNaN(value)) return "—";
  let n = value;
  let suffix = "";

  const pick = denomination;
  const abs = Math.abs(value);

  if (pick === "crore" || (pick === "auto" && abs >= 1e7)) {
    n = value / 1e7;
    suffix = " Cr";
  } else if (pick === "lakh" || (pick === "auto" && abs >= 1e5)) {
    n = value / 1e5;
    suffix = " L";
  } else if (pick === "auto") {
    suffix = "";
  }

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
  return `₹${formatted}${suffix}`;
}

export function formatNumber(
  value: number | null | undefined,
  digits = 0,
): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

// --- Dates ------------------------------------------------------------------
export type DateFormat = "short" | "long" | "iso";

export function formatDate(
  date: string | Date | null | undefined,
  format: DateFormat = "short",
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";

  if (format === "iso") {
    return d.toISOString().slice(0, 10);
  }
  if (format === "long") {
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function daysBetween(a: string | Date, b: string | Date = new Date()): number {
  const dA = typeof a === "string" ? new Date(a) : a;
  const dB = typeof b === "string" ? new Date(b) : b;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((dA.getTime() - dB.getTime()) / msPerDay);
}

export function formatDueDateLabel(
  dueDate: string | Date | null | undefined,
): { label: string; tone: "danger" | "warn" | "muted" | "success" } {
  if (!dueDate) return { label: "No due date", tone: "muted" };
  const days = daysBetween(dueDate);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, tone: "danger" };
  if (days === 0) return { label: "Today", tone: "danger" };
  if (days <= 7) return { label: `In ${days}d`, tone: "warn" };
  if (days <= 30) return { label: `In ${days}d`, tone: "muted" };
  return { label: formatDate(dueDate, "short"), tone: "success" };
}

// --- Strings ----------------------------------------------------------------
export function truncate(
  str: string | null | undefined,
  maxLen = 80,
  ellipsis = "…",
): string {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + ellipsis;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function initials(name: string | null | undefined, max = 2): string {
  if (!name) return "—";
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, max)
    .join("")
    .toUpperCase();
}
