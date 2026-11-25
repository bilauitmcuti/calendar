/**
 * Responsive type roles for the month calendar.
 * Breakpoints match the shell: 560 (grid bars), 900 (sidebar), 1080 (day dock).
 * Tailwind scale only — no arbitrary pixel font sizes.
 */
export const monthType = {
  pageTitle: "text-sm font-semibold min-[560px]:text-base min-[900px]:text-lg",
  error: "text-sm text-destructive",
  sectionLabel: "px-2 text-xs font-semibold text-muted-foreground",
  nav: "text-sm font-medium",
  menuItem: "text-sm font-medium",
  calendarRow: "text-sm font-medium",
  calendarCount: "shrink-0 text-xs text-muted-foreground tabular-nums",
  onlyChip: "text-xs font-medium text-muted-foreground",
  gridWeekday: "text-xs font-medium text-muted-foreground min-[900px]:text-sm",
  gridDayNumber:
    "text-xs font-medium tabular-nums min-[560px]:text-sm",
  gridBar:
    "text-xs leading-5 font-medium min-[900px]:text-sm min-[900px]:leading-6",
  gridOverflow: "text-xs font-medium text-muted-foreground tabular-nums",
  dayHeading: "text-sm font-semibold min-[560px]:text-base",
  daySummary: "text-xs text-muted-foreground tabular-nums min-[560px]:text-sm",
  eventTitle:
    "min-w-0 flex-1 text-sm leading-relaxed font-medium break-words text-foreground min-[560px]:text-base min-[560px]:leading-6",
  eventMeta:
    "text-xs leading-4 font-normal break-words text-muted-foreground min-[560px]:text-sm min-[560px]:leading-5",
  upcomingMonth:
    "text-lg leading-7 font-semibold text-foreground min-[560px]:text-xl",
  emptyTitle: "text-base font-medium text-foreground min-[560px]:text-lg",
  emptyBody: "text-sm text-muted-foreground",
  dateColumn:
    "flex w-20 flex-col items-start text-sm text-muted-foreground",
  dateColumnNum: "text-base font-medium text-foreground tabular-nums",
} as const;

/** Opacity-only bridge when month or view changes from a pointer control. */
let monthContentFadeNonce = 0;

export function markMonthContentFade() {
  monthContentFadeNonce += 1;
}

export function readMonthContentFadeNonce() {
  return monthContentFadeNonce;
}
