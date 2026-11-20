import { parseSessionLabelDateRange, type Activity } from "@/lib/data";
import { dateInMonthGrid } from "@/components/month-calendar/pack-spans";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function activityBounds(activities: Pick<Activity, "startDate" | "endDate">[]): { start: string; end: string } | null {
  let start: string | null = null;
  let end: string | null = null;
  for (const activity of activities) {
    const activityStart = activity.startDate.slice(0, 10);
    if (!ISO_DATE.test(activityStart)) continue;
    const activityEnd = (activity.endDate ?? activity.startDate).slice(0, 10);
    const safeEnd = ISO_DATE.test(activityEnd) ? activityEnd : activityStart;
    if (start == null || activityStart < start) start = activityStart;
    if (end == null || safeEnd > end) end = safeEnd;
  }
  if (!start || !end) return null;
  return { start, end };
}

export function earliestActivityDate(activities: Pick<Activity, "startDate" | "endDate">[]): string | null {
  return activityBounds(activities)?.start ?? null;
}

export function sessionContainsToday(
  activities: Pick<Activity, "startDate" | "endDate">[],
  today: string
): boolean {
  const bounds = activityBounds(activities);
  if (!bounds) return false;
  return today >= bounds.start && today <= bounds.end;
}

/** Month to open when the session dropdown changes. Current session stays on today. */
export function monthForSessionChange(input: {
  sessionId: string;
  label?: string;
  currentSessionId: string;
  today: string;
  fallbackMonth: string;
}): string {
  if (input.sessionId === input.currentSessionId) return input.today.slice(0, 7);
  const range = input.label ? parseSessionLabelDateRange(input.label) : null;
  if (range && input.today >= range.start && input.today <= range.end) return input.today.slice(0, 7);
  if (range) return range.start.slice(0, 7);
  return input.fallbackMonth;
}

export interface CarriedSessionFocus {
  sessionId: string;
  date: string;
}

let carriedSessionFocus: CarriedSessionFocus | null = null;

export function readCarriedSessionFocus(): CarriedSessionFocus | null {
  return carriedSessionFocus;
}

export function writeCarriedSessionFocus(value: CarriedSessionFocus | null): void {
  carriedSessionFocus = value;
}

export type SessionArrivalPlan =
  | { action: "navigate"; month: string; carry: CarriedSessionFocus }
  | { action: "select"; date: string; clearPending: boolean }
  | { action: "keep" };

function initialDate(month: string, today: string, focusDate?: string): string {
  if (focusDate && dateInMonthGrid(month, focusDate)) return focusDate;
  if (dateInMonthGrid(month, today)) return today;
  return `${month}-01`;
}

/** Where the month page should land after a session change or a later payload. */
export function planSessionArrival(input: {
  pendingSessionId: string | null;
  carried: CarriedSessionFocus | null;
  sessionId: string;
  month: string;
  today: string;
  defaultSessionId: string;
  activities: Pick<Activity, "startDate" | "endDate">[];
  focusDate?: string;
  arrivalChanged: boolean;
}): SessionArrivalPlan {
  const pending = input.pendingSessionId === input.sessionId;
  const carried = input.carried?.sessionId === input.sessionId ? input.carried : null;
  if (!pending && !carried) {
    if (!input.arrivalChanged) return { action: "keep" };
    return {
      action: "select",
      date: initialDate(input.month, input.today, input.focusDate),
      clearPending: false,
    };
  }

  const isCurrent =
    input.sessionId === input.defaultSessionId || sessionContainsToday(input.activities, input.today);
  const start = isCurrent ? input.today : earliestActivityDate(input.activities);
  const date = start ?? carried?.date ?? null;
  if (!date) {
    return {
      action: "select",
      date: initialDate(input.month, input.today, input.focusDate),
      clearPending: true,
    };
  }

  const month = date.slice(0, 7);
  if (input.month !== month) {
    return { action: "navigate", month, carry: { sessionId: input.sessionId, date } };
  }
  return { action: "select", date, clearPending: true };
}
