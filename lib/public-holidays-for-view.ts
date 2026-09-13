import type { PublicHolidayRow } from "@/lib/calendar-api";
import {
  getMonthsUnionFromSessionIds,
  getSessionActivityDateRange,
  getSessionOptions,
  parseSessionLabelDateRange,
  type SessionId,
} from "@/lib/data";

export type PublicHolidaysByYear = Record<number, PublicHolidayRow[]>;

export type SessionDateRange = { start: string; end: string };

const KKT_SLUGS = new Set(["kedah", "kelantan", "terengganu"]);

const LIST_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function isNationwide(states: string[]): boolean {
  return states.length >= 16;
}

export function holidayVisibleForKKT(row: PublicHolidayRow, showKKT: boolean): boolean {
  if (!showKKT) return true;
  if (isNationwide(row.states)) return true;
  return row.states.some((s) => KKT_SLUGS.has(s));
}

export function holidayYearsFromSessionIds(sessionIds: SessionId[]): number[] {
  const months = getMonthsUnionFromSessionIds(sessionIds);
  if (!months) return [];
  return [...new Set(months.map((m) => m.year))].sort((a, b) => a - b);
}

export function yearsInclusiveFromRange(range: SessionDateRange): number[] {
  const startY = Number(range.start.slice(0, 4));
  const endY = Number(range.end.slice(0, 4));
  if (!Number.isFinite(startY) || !Number.isFinite(endY) || endY < startY) return [];
  const years: number[] = [];
  for (let year = startY; year <= endY; year++) years.push(year);
  return years;
}

function sessionLabelRange(
  sessionId: SessionId,
  sessionOptions?: Array<{ id: string; label: string }>
): SessionDateRange | null {
  const label =
    sessionOptions?.find((session) => session.id === sessionId)?.label ??
    getSessionOptions().find((session) => session.id === sessionId)?.label;
  if (!label) return null;
  return parseSessionLabelDateRange(label);
}

/**
 * Calendar years to fetch for public holidays. Prefers loaded activity dates, then
 * API session labels (e.g. "Sep 2026 - Feb 2027"), then the academic-year fallback.
 * `allowedYears` comes from `/public-holiday` `yearOptions` so new dataset years
 * are requested automatically and unpublished years are skipped.
 */
export function holidayYearsForSessions(
  sessionIds: SessionId[],
  options?: {
    sessionOptions?: Array<{ id: string; label: string }>;
    allowedYears?: readonly number[];
  }
): number[] {
  const years = new Set<number>();

  for (const sessionId of sessionIds) {
    let hadRange = false;
    const activityRange = getSessionActivityDateRange(sessionId);
    if (activityRange) {
      for (const year of yearsInclusiveFromRange(activityRange)) years.add(year);
      hadRange = true;
    }
    const labelRange = sessionLabelRange(sessionId, options?.sessionOptions);
    if (labelRange) {
      for (const year of yearsInclusiveFromRange(labelRange)) years.add(year);
      hadRange = true;
    }
    if (!hadRange) {
      for (const year of holidayYearsFromSessionIds([sessionId])) years.add(year);
    }
  }

  let list = [...years].sort((a, b) => a - b);
  if (options?.allowedYears && options.allowedYears.length > 0) {
    const allowed = new Set(options.allowedYears);
    list = list.filter((year) => allowed.has(year));
  }
  return list;
}

export function academicDateRangeFromSessionIds(
  sessionIds: SessionId[]
): SessionDateRange | null {
  const months = getMonthsUnionFromSessionIds(sessionIds);
  if (!months || months.length === 0) return null;
  const first = months[0]!;
  const last = months[months.length - 1]!;
  const lastDay = new Date(Date.UTC(last.year, last.month, 0)).getUTCDate();
  return {
    start: `${first.year}-${String(first.month).padStart(2, "0")}-01`,
    end: `${last.year}-${String(last.month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function sessionHolidayDateRange(
  sessionIds: SessionId[],
  options?: {
    sessionOptions?: Array<{ id: string; label: string }>;
  }
): SessionDateRange | null {
  let start: string | null = null;
  let end: string | null = null;

  const absorb = (range: SessionDateRange | null) => {
    if (!range) return;
    if (start == null || range.start < start) start = range.start;
    if (end == null || range.end > end) end = range.end;
  };

  for (const sessionId of sessionIds) {
    const labelRange = sessionLabelRange(sessionId, options?.sessionOptions);
    if (labelRange) {
      absorb(labelRange);
      continue;
    }
    const activityRange = getSessionActivityDateRange(sessionId);
    if (activityRange) {
      absorb(activityRange);
      continue;
    }
    absorb(academicDateRangeFromSessionIds([sessionId]));
  }

  if (start && end) return { start, end };
  return academicDateRangeFromSessionIds(sessionIds);
}

export function flattenHolidaysByYear(byYear: PublicHolidaysByYear): PublicHolidayRow[] {
  const out: PublicHolidayRow[] = [];
  const seen = new Set<string>();
  for (const rows of Object.values(byYear)) {
    for (const row of rows) {
      const key = `${row.id}|${row.date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
  }
  return out;
}

const HOLIDAY_YMD = /^(\d{4})-(\d{2})-(\d{2})/;

function holidayDateKey(date: string): string {
  const ymd = date.match(HOLIDAY_YMD);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  return date.slice(0, 10);
}

export function buildHolidaysByDateIndex(
  holidays: PublicHolidayRow[],
  options: { showKKT: boolean; range: SessionDateRange | null }
): Record<string, PublicHolidayRow[]> {
  const index: Record<string, PublicHolidayRow[]> = {};
  const { showKKT, range } = options;
  for (const row of holidays) {
    const date = holidayDateKey(row.date);
    if (!date) continue;
    if (range && (date < range.start || date > range.end)) continue;
    if (!holidayVisibleForKKT(row, showKKT)) continue;
    (index[date] ??= []).push(date === row.date ? row : { ...row, date });
  }
  for (const date of Object.keys(index)) {
    index[date]!.sort((a, b) => a.name.localeCompare(b.name));
  }
  return index;
}

const STATE_LABELS: Record<string, string> = {
  johor: "Johor",
  kedah: "Kedah",
  kelantan: "Kelantan",
  melaka: "Melaka",
  "negeri-sembilan": "Negeri Sembilan",
  pahang: "Pahang",
  perak: "Perak",
  perlis: "Perlis",
  "pulau-pinang": "Pulau Pinang",
  sabah: "Sabah",
  sarawak: "Sarawak",
  selangor: "Selangor",
  terengganu: "Terengganu",
  "kuala-lumpur": "Kuala Lumpur",
  labuan: "Labuan",
  putrajaya: "Putrajaya",
};

export function formatHolidayStates(states: string[]): string {
  if (states.length >= 16) return "Nationwide";
  const labels = states
    .map((slug) => STATE_LABELS[slug] ?? slug.replace(/-/g, " "))
    .filter(Boolean);
  return labels.join(", ");
}

export function listMonthKeyFromIsoDate(dateStr: string): string {
  const [year, month] = dateStr.split("-").map(Number);
  const m = month && month >= 1 && month <= 12 ? month : 1;
  return `${LIST_MONTH_NAMES[m - 1]} ${year}`;
}
