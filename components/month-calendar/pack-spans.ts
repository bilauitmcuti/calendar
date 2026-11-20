import type { PublicHolidayRow } from "@/lib/calendar-api";
import type { Activity, ActivityType } from "@/lib/data";
import { normalizeDateString } from "@/lib/malaysia-dates";

export type CalendarId = ActivityType | "holiday";

export const CALENDAR_IDS: CalendarId[] = [
  "lecture",
  "examination",
  "break",
  "registration",
  "other",
  "holiday",
];

export const MAX_VISIBLE_LANES = 3;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface MonthSpan {
  id: string;
  title: string;
  details?: string;
  duration?: string;
  states?: string[];
  calendarId: CalendarId;
  start: string;
  end: string;
  programType?: Activity["programType"];
  programTypes?: string[];
  allStudents?: boolean;
  general?: boolean;
}

export interface WeekLaneSpan {
  span: MonthSpan;
  start: string;
  end: string;
  continuesBefore: boolean;
  continuesAfter: boolean;
  lane: number;
  column: number;
  spanDays: number;
}

export interface WeekLayout {
  dates: string[];
  lanes: WeekLaneSpan[];
  overflowByDate: Record<string, number>;
}

export interface MonthFilterState {
  query: string;
  enabled: Record<CalendarId, boolean>;
  only: CalendarId | null;
}

export function defaultMonthFilters(): MonthFilterState {
  return {
    query: "",
    enabled: {
      lecture: true,
      examination: true,
      break: true,
      registration: true,
      other: true,
      holiday: true,
    },
    only: null,
  };
}

export function parseMonthParam(value: string | undefined, today: string): string {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (!match) return today.slice(0, 7);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return today.slice(0, 7);
  return `${match[1]}-${match[2]}`;
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthIndex - 1 + delta, 1));
  return formatUtcDate(date).slice(0, 7);
}

export function addDays(iso: string, days: number): string {
  const date = utcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return formatUtcDate(date);
}

export function monthBounds(month: string): { start: string; end: string } {
  const [year, monthIndex] = month.split("-").map(Number);
  const end = new Date(Date.UTC(year, monthIndex, 0));
  return { start: `${month}-01`, end: formatUtcDate(end) };
}

export function monthGridDates(month: string): string[][] {
  const [year, monthIndex] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, monthIndex - 1, 1));
  const weekday = first.getUTCDay();
  const offset = weekday === 0 ? 6 : weekday - 1;
  const start = new Date(first);
  start.setUTCDate(first.getUTCDate() - offset);
  const weeks: string[][] = [];
  for (let week = 0; week < 6; week += 1) {
    const dates: string[] = [];
    for (let day = 0; day < 7; day += 1) {
      const cursor = new Date(start);
      cursor.setUTCDate(start.getUTCDate() + week * 7 + day);
      dates.push(formatUtcDate(cursor));
    }
    weeks.push(dates);
  }
  return weeks;
}

export function gridYears(month: string): number[] {
  const weeks = monthGridDates(month);
  const first = weeks[0][0];
  const last = weeks[5][6];
  return [...new Set([Number(first.slice(0, 4)), Number(last.slice(0, 4))])];
}

export function dateInMonthGrid(month: string, iso: string): boolean {
  const weeks = monthGridDates(month);
  return iso >= weeks[0][0] && iso <= weeks[5][6];
}

export function buildMonthSpans(
  activities: Activity[],
  holidays: PublicHolidayRow[]
): MonthSpan[] {
  const spans: MonthSpan[] = [];
  const seen = new Map<string, MonthSpan>();

  activities.forEach((activity, index) => {
    const start = normalizeDateString(activity.startDate);
    if (!ISO_DATE.test(start)) return;
    const endRaw = activity.endDate ? normalizeDateString(activity.endDate) : start;
    const end = ISO_DATE.test(endRaw) ? endRaw : start;
    const [rangeStart, rangeEnd] = start <= end ? [start, end] : [end, start];
    const key = `${activity.type}|${activity.name}|${rangeStart}|${rangeEnd}`;
    const existing = seen.get(key);
    const programTypes = [
      ...(activity.programTypes ?? []),
      ...(activity.programType ? [activity.programType] : []),
    ];
    if (existing) {
      const merged = new Set([...(existing.programTypes ?? []), ...programTypes]);
      if (merged.size > 0) existing.programTypes = [...merged];
      return;
    }
    const span: MonthSpan = {
      id: `activity-${index}-${key}`,
      title: activity.name || "Activity",
      details: activity.details,
      duration: activity.duration,
      calendarId: activity.type,
      start: rangeStart,
      end: rangeEnd,
      programType: activity.programType,
      programTypes: programTypes.length > 0 ? programTypes : undefined,
      allStudents: activity.allStudents,
      general: activity.general,
    };
    seen.set(key, span);
    spans.push(span);
  });

  for (const holiday of holidays) {
    const date = normalizeDateString(holiday.date);
    if (!ISO_DATE.test(date)) continue;
    spans.push({
      id: `holiday-${holiday.id}-${date}`,
      title: holiday.name || "Public Holiday",
      details: holiday.isSubjectToChange ? "Subject to change" : undefined,
      states: holiday.states,
      calendarId: "holiday",
      start: date,
      end: date,
    });
  }

  return spans;
}

export function spanMatchesFilter(span: MonthSpan, filter: MonthFilterState): boolean {
  if (filter.only) {
    if (span.calendarId !== filter.only) return false;
  } else if (!filter.enabled[span.calendarId]) {
    return false;
  }
  const query = filter.query.trim().toLowerCase();
  if (!query) return true;
  const haystack = `${span.title} ${span.details ?? ""} ${(span.states ?? []).join(" ")}`.toLowerCase();
  return haystack.includes(query);
}

export function spansOnDate(spans: MonthSpan[], date: string): MonthSpan[] {
  return spans.filter((span) => span.start <= date && span.end >= date);
}

export function countSpansInMonth(
  spans: MonthSpan[],
  month: string,
  calendarId: CalendarId,
  query: string
): number {
  const { start, end } = monthBounds(month);
  const needle = query.trim().toLowerCase();
  return spans.filter((span) => {
    if (span.calendarId !== calendarId) return false;
    if (span.end < start || span.start > end) return false;
    if (!needle) return true;
    const haystack = `${span.title} ${span.details ?? ""}`.toLowerCase();
    return haystack.includes(needle);
  }).length;
}

export interface UpcomingGroup {
  date: string;
  spans: MonthSpan[];
}

export function groupUpcoming(spans: MonthSpan[], month: string): UpcomingGroup[] {
  const { start, end } = monthBounds(month);
  const groups = new Map<string, MonthSpan[]>();
  for (const span of spans) {
    if (span.end < start || span.start > end) continue;
    const anchor = span.start < start ? start : span.start;
    const list = groups.get(anchor) ?? [];
    list.push(span);
    groups.set(anchor, list);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => (left < right ? -1 : 1))
    .map(([date, items]) => ({
      date,
      spans: [...items].sort((left, right) => left.title.localeCompare(right.title)),
    }));
}

export function packMonth(spans: MonthSpan[], month: string): WeekLayout[] {
  return monthGridDates(month).map((dates) => packWeek(dates, spans));
}

function packWeek(dates: string[], spans: MonthSpan[]): WeekLayout {
  const weekStart = dates[0];
  const weekEnd = dates[6];
  const clipped: WeekLaneSpan[] = spans
    .filter((span) => span.start <= weekEnd && span.end >= weekStart)
    .map((span) => {
      const start = span.start < weekStart ? weekStart : span.start;
      const end = span.end > weekEnd ? weekEnd : span.end;
      const column = dates.indexOf(start) + 1;
      const spanDays = diffDays(start, end) + 1;
      return {
        span,
        start,
        end,
        continuesBefore: span.start < weekStart,
        continuesAfter: span.end > weekEnd,
        lane: 0,
        column,
        spanDays,
      };
    })
    .sort((left, right) => {
      if (left.start !== right.start) return left.start < right.start ? -1 : 1;
      if (left.spanDays !== right.spanDays) return right.spanDays - left.spanDays;
      return left.span.title.localeCompare(right.span.title);
    });

  const laneEnds: string[] = [];
  for (const item of clipped) {
    const freeLane = laneEnds.findIndex((end) => end < item.start);
    if (freeLane === -1) {
      item.lane = laneEnds.length;
      laneEnds.push(item.end);
    } else {
      item.lane = freeLane;
      laneEnds[freeLane] = item.end;
    }
  }

  const overflowByDate: Record<string, number> = {};
  for (const item of clipped) {
    if (item.lane < MAX_VISIBLE_LANES) continue;
    for (const date of dates) {
      if (date < item.start || date > item.end) continue;
      overflowByDate[date] = (overflowByDate[date] ?? 0) + 1;
    }
  }

  return {
    dates,
    lanes: clipped.filter((item) => item.lane < MAX_VISIBLE_LANES),
    overflowByDate,
  };
}

function diffDays(start: string, end: string): number {
  return Math.round((utcDate(end).getTime() - utcDate(start).getTime()) / 86400000);
}

function utcDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtcDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
