import { cookies } from 'next/headers';
import { SharedCalendarLayout } from './shared-calendar-layout';
import { parseFiltersFromCookie } from '@/lib/cookie-utils';
import { loadInitialCalendarSnapshot } from '@/lib/calendar-initial-server';
import { getMalaysiaDateHeaderParts, getTodayISO } from '@/lib/malaysia-dates';
import type { ViewMode } from '@/app/page';

interface CalendarWrapperProps {
  viewMode: ViewMode;
  programFromRoute: string;
}

/**
 * Server component wrapper that reads filter states from cookies
 * and passes them to SharedCalendarLayout for SSR consistency
 */
export async function CalendarWrapper({ viewMode, programFromRoute }: CalendarWrapperProps) {
  const cookieStore = await cookies();
  const cookieString = cookieStore.get('calendar-filters')?.value || null;
  const initialFilters = parseFiltersFromCookie(cookieString);
  const now = new Date();
  const initialCurrentDate = getTodayISO(now);
  const { dayShort: initialDayShort, dateLabel: initialDateLabel } =
    getMalaysiaDateHeaderParts(now);
  const initialCalendar = await loadInitialCalendarSnapshot({
    programFromRoute,
    cookieValue: cookieString,
    currentDateStr: initialCurrentDate,
  });

  return (
    <SharedCalendarLayout 
      viewMode={viewMode} 
      programFromRoute={programFromRoute}
      initialFilters={initialFilters}
      initialCurrentDate={initialCurrentDate}
      initialDayShort={initialDayShort}
      initialDateLabel={initialDateLabel}
      initialLectureWeekByDate={initialCalendar.lectureWeekByDate}
      initialPublicHolidaysByYear={initialCalendar.publicHolidaysByYear}
      initialCalendarSnapshot={initialCalendar.snapshot}
      initialCalendarHydration={
        initialCalendar.programUsed != null && initialCalendar.hydrateKey != null
          ? {
              programUsed: initialCalendar.programUsed,
              hydrateKey: initialCalendar.hydrateKey,
            }
          : null
      }
    />
  );
}
