import { parseSessionLabelDateRange, type Activity } from "@/lib/data";

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
