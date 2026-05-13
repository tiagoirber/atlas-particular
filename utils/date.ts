import { Timestamp } from "firebase/firestore";

export type AnyDate = Date | Timestamp | string | number | null | undefined;

export function toDate(value: AnyDate): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === "number") return new Date(value);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toInputDate(value: AnyDate): string {
  const date = toDate(value);
  if (!date) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function fromInputDate(value: string): Date | null {
  if (!value) return null;
  // <input type="date"> returns YYYY-MM-DD in local time
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const LONG_DATE_FMT = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(value: AnyDate): string {
  const date = toDate(value);
  return date ? DATE_FMT.format(date) : "";
}

export function formatLongDate(value: AnyDate): string {
  const date = toDate(value);
  return date ? LONG_DATE_FMT.format(date) : "";
}

export function formatDateRange(start: AnyDate, end: AnyDate): string {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s && e) return `${s} — ${e}`;
  return s || e || "";
}

export function daysBetween(start: AnyDate, end: AnyDate): number {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return 0;
  const ms = e.getTime() - s.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}
