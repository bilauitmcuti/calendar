import type { PublicHolidayRow, SessionOptionRow, DefaultSessionMap } from "@/lib/calendar-api";
import type { Activity } from "@/lib/data";
import type { ProgramValue } from "@/lib/route-utils";
import type { MonthView } from "@/lib/month-routes";

export interface MonthCalendarPayload {
  program: ProgramValue;
  view: MonthView;
  month: string;
  sessionId: string;
  /** Date to focus after a month change, when the query includes `date`. */
  focusDate?: string;
  today: string;
  activities: Activity[];
  lectureWeekByDate: Record<string, number>;
  holidays: PublicHolidayRow[];
  sessionOptions: SessionOptionRow[];
  defaultSession: DefaultSessionMap;
  error?: string;
}
