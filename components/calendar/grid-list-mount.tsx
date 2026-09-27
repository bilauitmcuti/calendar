'use client';

import { useSyncExternalStore } from 'react';
import { ListView } from '@/components/list-view';
import { GridView } from '@/components/grid-view';
import {
  useCalendarCommittedProgram,
  useCalendarCommittedSessions,
} from '@/components/calendar-data-gate';
import { useCalendarHydrationVersion } from '@/components/calendar-hydration-context';
import { usePublicHolidaysForSessions } from '@/components/calendar/use-public-holidays-for-sessions';
import { getSnapshot, subscribe } from '@/lib/calendar-store';
import type { PublicHolidaysByYear } from '@/lib/public-holidays-for-view';
import type { ViewMode } from '@/app/page';

export interface CalendarGridListMountProps {
  bothViewsMounted: boolean;
  activeViewMode: ViewMode;
  showKKT: boolean;
  showRegistration: boolean;
  showLecture: boolean;
  showSemesterPendek: boolean;
  showKuliahIntersesi: boolean;
  showExamination: boolean;
  showOthersExams: boolean;
  showBreak: boolean;
  showCountdown: boolean;
  onMonthChange: (month: string) => void;
  selectedStates: string[];
  initialCurrentDate?: string;
  initialLectureWeekByDate?: Record<string, number> | null;
  initialPublicHolidaysByYear?: PublicHolidaysByYear;
}

/** Grid/list use committed program + sessions so they stay in sync with the store (see CalendarDataGate). */
export function CalendarGridListMount({
  bothViewsMounted,
  activeViewMode,
  showKKT,
  showRegistration,
  showLecture,
  showSemesterPendek,
  showKuliahIntersesi,
  showExamination,
  showOthersExams,
  showBreak,
  showCountdown,
  onMonthChange,
  selectedStates,
  initialCurrentDate,
  initialLectureWeekByDate = null,
  initialPublicHolidaysByYear = {},
}: CalendarGridListMountProps) {
  const calendarDataProgram = useCalendarCommittedProgram();
  const calendarDataSessions = useCalendarCommittedSessions();
  const hydrationServerVersion = useCalendarHydrationVersion();
  const calendarDataVersion = useSyncExternalStore(
    subscribe,
    () => getSnapshot().version,
    () => hydrationServerVersion
  );
  const holidaysByDateAll = usePublicHolidaysForSessions(
    calendarDataSessions,
    showKKT,
    initialPublicHolidaysByYear,
    calendarDataVersion
  );
  const holidaysByDate = showBreak ? holidaysByDateAll : {};

  const sharedViewProps = {
    selectedProgram: calendarDataProgram,
    selectedSessions: calendarDataSessions,
    showKKT,
    showRegistration,
    showLecture,
    showSemesterPendek,
    showKuliahIntersesi,
    showExamination,
    showOthersExams,
    showBreak,
    showCountdown,
    onMonthChange,
    selectedStates,
    initialCurrentDate,
    initialLectureWeekByDate,
    holidaysByDate,
  };

  return (
    <>
      {(bothViewsMounted || activeViewMode === 'list') && (
        <div
          data-calendar-view="list"
          style={{ display: activeViewMode === 'list' ? 'block' : 'none' }}
        >
          <ListView {...sharedViewProps} />
        </div>
      )}
      {(bothViewsMounted || activeViewMode === 'grid') && (
        <div
          data-calendar-view="grid"
          style={{ display: activeViewMode === 'grid' ? 'block' : 'none' }}
        >
          <GridView {...sharedViewProps} />
        </div>
      )}
    </>
  );
}
