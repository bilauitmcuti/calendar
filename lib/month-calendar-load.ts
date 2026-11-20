import "server-only";

import {
  fetchCalendarSession,
  fetchMetaCached,
  fetchPublicHolidays,
} from "@/lib/calendar-api-server";
import { calendarProgramQueryForRoute, FALLBACK_DEFAULT_SESSION_MAP } from "@/lib/calendar-api";
import type { PublicHolidayRow } from "@/lib/calendar-api";
import { resolveSessionsForProgram } from "@/lib/calendar-session-resolve";
import { getTodayISO } from "@/lib/malaysia-dates";
import type { MonthCalendarPayload } from "@/lib/month-calendar-types";
import type { MonthView } from "@/lib/month-routes";
import { gridYears, parseMonthParam } from "@/components/month-calendar/pack-spans";
import { getGroupFromProgram } from "@/lib/session-memory";
import type { ProgramValue } from "@/lib/route-utils";

export async function loadMonthCalendar(params: {
  program: ProgramValue;
  view: MonthView;
  monthParam?: string;
  sessionParam?: string;
  dateParam?: string;
}): Promise<MonthCalendarPayload> {
  const today = getTodayISO();
  const month = parseMonthParam(params.monthParam, today);
  const focusDate = params.dateParam?.match(/^\d{4}-\d{2}-\d{2}$/) ? params.dateParam : undefined;
  const meta = await fetchMetaCached({ entire: true });
  const group = getGroupFromProgram(params.program);
  const resolved = resolveSessionsForProgram({
    meta,
    program: params.program,
    candidates: params.sessionParam ? [params.sessionParam] : [],
    dateStr: today,
  });
  const sessionId =
    resolved.sessions[0] ??
    meta.defaultSession[group] ??
    FALLBACK_DEFAULT_SESSION_MAP[group];

  const programQuery = calendarProgramQueryForRoute(params.program);
  let activities: MonthCalendarPayload["activities"] = [];
  let lectureWeekByDate: Record<string, number> = {};
  let error: string | undefined;

  try {
    const session = await fetchCalendarSession({
      sessionId,
      group,
      program: group === "B" ? programQuery : undefined,
    });
    activities = session.activities;
    lectureWeekByDate = session.lectureWeekByDate ?? {};
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Could not load this session";
  }

  const holidays = await loadHolidays(gridYears(month));

  return {
    program: params.program,
    view: params.view,
    month,
    sessionId,
    focusDate,
    today,
    activities,
    lectureWeekByDate,
    holidays,
    sessionOptions: meta.sessionOptions,
    programOptions: meta.programOptions,
    defaultSession: meta.defaultSession,
    error,
  };
}

async function loadHolidays(years: number[]): Promise<PublicHolidayRow[]> {
  const batches = await Promise.all(
    years.map(async (year) => {
      try {
        const result = await fetchPublicHolidays({ coverage: "all", year });
        return result.holidays;
      } catch {
        return [];
      }
    })
  );
  const seen = new Set<string>();
  const holidays: PublicHolidayRow[] = [];
  for (const row of batches.flat()) {
    const key = `${row.id}|${row.date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    holidays.push(row);
  }
  return holidays;
}
