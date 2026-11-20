import {
  Alert02Icon,
  BeachIcon,
  BookOpen01Icon,
  Flag01Icon,
  NotebookIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import type { CalendarId } from "@/components/month-calendar/pack-spans";

export const CALENDAR_STYLE: Record<
  CalendarId,
  { label: string; dot: string; bar: string; text: string; icon: typeof BookOpen01Icon }
> = {
  lecture: {
    label: "Lecture",
    dot: "bg-[#8b5cf6]",
    bar: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-[#6d28d9] dark:text-[#ddd6fe]",
    icon: BookOpen01Icon,
  },
  examination: {
    label: "Examination",
    dot: "bg-[#dc2626]",
    bar: "bg-red-100 dark:bg-red-900/35",
    text: "text-[#b91c1c] dark:text-[#fecaca]",
    icon: Alert02Icon,
  },
  break: {
    label: "Break",
    dot: "bg-[#10b981]",
    bar: "bg-emerald-100 dark:bg-emerald-900/35",
    text: "text-[#047857] dark:text-[#a7f3d0]",
    icon: BeachIcon,
  },
  registration: {
    label: "Registration",
    dot: "bg-[#d1d5db]",
    bar: "bg-stone-100 dark:bg-stone-800/50",
    text: "text-stone-700 dark:text-stone-200",
    icon: Task01Icon,
  },
  other: {
    label: "Other",
    dot: "bg-gray-400",
    bar: "bg-slate-100 dark:bg-slate-800/50",
    text: "text-slate-700 dark:text-slate-200",
    icon: NotebookIcon,
  },
  holiday: {
    label: "Public Holiday",
    dot: "bg-[#10b981]",
    bar: "bg-emerald-100 dark:bg-emerald-900/35",
    text: "text-[#047857] dark:text-[#a7f3d0]",
    icon: Flag01Icon,
  },
};

const WEEKDAY_FORMAT = new Intl.DateTimeFormat("en-MY", {
  weekday: "short",
  timeZone: "UTC",
});

const MONTH_TITLE = new Intl.DateTimeFormat("en-MY", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const MONTH_SHORT = new Intl.DateTimeFormat("en-MY", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const DAY_HEADING = new Intl.DateTimeFormat("en-MY", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const DAY_LIST = new Intl.DateTimeFormat("en-MY", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function utcFromIso(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
}

export function formatMonthTitle(month: string): string {
  return MONTH_TITLE.format(utcFromIso(`${month}-01`));
}

export function formatMonthShort(month: string): string {
  return MONTH_SHORT.format(utcFromIso(`${month}-01`));
}

export function formatDayHeading(iso: string): string {
  return DAY_HEADING.format(utcFromIso(iso));
}

export function formatDayList(iso: string): string {
  return DAY_LIST.format(utcFromIso(iso));
}

export function weekdayInitials(): string[] {
  const monday = new Date(Date.UTC(2026, 0, 5));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    return WEEKDAY_FORMAT.format(date);
  });
}
