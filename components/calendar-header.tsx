"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getMalaysiaDateHeaderParts, getTodayISO } from "@/lib/malaysia-dates";
import {
  EMPTY_LECTURE_WEEK_BY_SESSION,
  getSnapshot,
  subscribe,
} from "@/lib/calendar-store";
import type { ProgramGroup, SessionId } from "@/lib/data";
import {
  getLectureWeekNumberForDate,
  resolveLectureWeekMapForSessions,
} from "@/lib/lecture-weeks-resolve";
import {
  calendarTitleH1Class,
  calendarTitleH1Style,
} from "@/lib/calendar-title-styles";
import { BrandName } from "@/components/brand-name";

interface CalendarHeaderProps {
  selectedSessions?: SessionId[];
  programGroup: ProgramGroup;
  initialCurrentDate?: string;
  initialDayShort?: string;
  initialDateLabel?: string;
  initialLectureWeekByDate?: Record<string, number> | null;
}

const calendarHeaderBadgeClass =
  "mb-2 text-xs px-3 py-1.5 rounded-full border border-border bg-secondary/50 dark:bg-[#2A2A2A] text-foreground transition-none whitespace-nowrap";
const calendarHeaderBadgeStyle = { transition: "none" } as const;

export function CalendarHeader({
  selectedSessions = [],
  initialCurrentDate,
  initialDayShort,
  initialDateLabel,
  initialLectureWeekByDate = null,
}: CalendarHeaderProps) {
  const mutedColor = "text-muted-foreground";
  const { dayShort, dateLabel } = useMemo(
    () =>
      initialDayShort && initialDateLabel
        ? { dayShort: initialDayShort, dateLabel: initialDateLabel }
        : getMalaysiaDateHeaderParts(),
    [initialDayShort, initialDateLabel]
  );
  const [currentDateStr, setCurrentDateStr] = useState(
    () => initialCurrentDate ?? ""
  );

  const storeLectureWeekBySession = useSyncExternalStore(
    subscribe,
    () => getSnapshot().lectureWeekBySession,
    () => EMPTY_LECTURE_WEEK_BY_SESSION
  );

  const lectureWeekByDate = useMemo(
    () =>
      resolveLectureWeekMapForSessions({
        lectureWeekBySession: storeLectureWeekBySession,
        selectedSessions,
        initialLectureWeekByDate,
      }),
    [storeLectureWeekBySession, selectedSessions, initialLectureWeekByDate]
  );

  useEffect(() => {
    const sync = () => setCurrentDateStr(getTodayISO());
    sync();
    const interval = setInterval(sync, 60000);
    return () => clearInterval(interval);
  }, []);

  const weekNum = useMemo(() => {
    const dateStr = currentDateStr || initialCurrentDate;
    if (!dateStr || !lectureWeekByDate) return null;
    return getLectureWeekNumberForDate(lectureWeekByDate, dateStr);
  }, [currentDateStr, initialCurrentDate, lectureWeekByDate]);

  const headerBadgeLabel = useMemo(() => {
    if (weekNum != null) return `Week ${weekNum}`;
    const dateStr = currentDateStr || initialCurrentDate;
    if (dateStr) {
      const y = Number.parseInt(dateStr.slice(0, 4), 10);
      if (Number.isFinite(y) && y > 0) return String(y);
    }
    return String(
      Number.parseInt((initialCurrentDate ?? getTodayISO()).slice(0, 4), 10) ||
        new Date().getFullYear()
    );
  }, [weekNum, currentDateStr, initialCurrentDate]);

  const legend = (
    <div
      className="flex flex-wrap gap-2 justify-start text-sm transition-none"
      role="list"
      aria-label="Activity type legend"
      suppressHydrationWarning
      style={{ transition: "none" }}
    >
      <div className="flex items-center gap-2" role="listitem">
        <div className="h-2 w-2 rounded-full bg-[#d1d5db]" aria-hidden="true" />
        <span className={mutedColor} suppressHydrationWarning>
          Registration
        </span>
      </div>
      <div className="flex items-center gap-2" role="listitem">
        <div className="h-2 w-2 rounded-full bg-[#8b5cf6]" aria-hidden="true" />
        <span className={mutedColor} suppressHydrationWarning>
          Lecture
        </span>
      </div>
      <div className="flex items-center gap-2" role="listitem">
        <div className="h-2 w-2 rounded-full bg-[#dc2626]" aria-hidden="true" />
        <span className={mutedColor} suppressHydrationWarning>
          Examination
        </span>
      </div>
      <div className="flex items-center gap-2" role="listitem">
        <div className="h-2 w-2 rounded-full bg-[#10b981]" aria-hidden="true" />
        <span className={mutedColor} suppressHydrationWarning>
          Breaks
        </span>
      </div>
    </div>
  );

  return (
    <div
      suppressHydrationWarning
      className="flex flex-col justify-center items-start gap-[2px] transition-none"
      style={{ transition: "none" }}
    >
      <span
        className={calendarHeaderBadgeClass}
        suppressHydrationWarning
        style={calendarHeaderBadgeStyle}
      >
        {headerBadgeLabel}
      </span>

      {/* Browser: site title */}
      <div className="standalone:hidden w-full">
        <h1
          className={`mb-2 ${calendarTitleH1Class}`}
          suppressHydrationWarning
          style={calendarTitleH1Style}
        >
          <BrandName questionMark />
        </h1>
      </div>

      {/* PWA standalone: today weekday + date (CSS, no hydration flip) */}
      <div className="mb-2 hidden standalone:flex w-full flex-wrap items-center gap-2 sm:gap-3">
        <h1
          className={`shrink-0 ${calendarTitleH1Class}`}
          suppressHydrationWarning
          style={calendarTitleH1Style}
        >
          {dayShort}
        </h1>
        <h1
          className={`min-w-0 ${calendarTitleH1Class}`}
          suppressHydrationWarning
          style={calendarTitleH1Style}
        >
          {dateLabel}
        </h1>
      </div>

      {legend}
    </div>
  );
}
