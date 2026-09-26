"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { ViewMode } from "@/app/page";
import { useCalendarHydrationVersion } from "@/components/calendar-hydration-context";
import { usePublicHolidaysForSessions } from "@/components/calendar/use-public-holidays-for-sessions";
import { Button } from "@/components/ui/button";
import { useCalendarTodayFab } from "@/hooks/use-calendar-today-fab";
import { getSnapshot, subscribe } from "@/lib/calendar-store";
import {
  getActivitiesForList,
  getMonthsForSessions,
  getUniqueListActivities,
  resolveListTodayAnchorKey,
  type ActivityFilterOptions,
  type GetMonthsOptions,
  type SessionId,
} from "@/lib/data";
import { getTodayISO } from "@/lib/malaysia-dates";
import type { PublicHolidaysByYear } from "@/lib/public-holidays-for-view";
import { cn } from "@/lib/utils";

const EMPTY_PUBLIC_HOLIDAYS_BY_YEAR: PublicHolidaysByYear = {};

interface CalendarTodayFabProps {
  viewMode: ViewMode;
  initialCurrentDate?: string;
  selectedProgram: string;
  selectedSessions: SessionId[];
  showKKT: boolean;
  showRegistration: boolean;
  showLecture: boolean;
  showSemesterPendek: boolean;
  showKuliahIntersesi: boolean;
  showExamination: boolean;
  showOthersExams: boolean;
  showBreak: boolean;
  initialPublicHolidaysByYear?: PublicHolidaysByYear;
}

function isTodayInSessionRange(
  todayStr: string,
  months: Array<{ month: number; year: number }>
): boolean {
  const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(todayStr);
  if (!match || months.length === 0) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return months.some((entry) => entry.year === year && entry.month === month);
}

export function CalendarTodayFab({
  viewMode,
  initialCurrentDate,
  selectedProgram,
  selectedSessions,
  showKKT,
  showRegistration,
  showLecture,
  showSemesterPendek,
  showKuliahIntersesi,
  showExamination,
  showOthersExams,
  showBreak,
  initialPublicHolidaysByYear = EMPTY_PUBLIC_HOLIDAYS_BY_YEAR,
}: CalendarTodayFabProps) {
  const [todayStr, setTodayStr] = useState(() => initialCurrentDate ?? "");

  useEffect(() => {
    const sync = () => setTodayStr(getTodayISO());
    sync();
    const interval = setInterval(sync, 60000);
    return () => clearInterval(interval);
  }, []);

  const hydrationServerVersion = useCalendarHydrationVersion();
  const calendarDataVersion = useSyncExternalStore(
    subscribe,
    () => getSnapshot().version,
    () => hydrationServerVersion
  );

  const monthOptions = useMemo<GetMonthsOptions>(
    () => ({
      selectedProgram,
      showRegistration,
      showLecture,
      showExamination,
      showOthersExams,
      showBreak,
      showSemesterPendek,
      showKuliahIntersesi,
      showKKT,
    }),
    [
      selectedProgram,
      showRegistration,
      showLecture,
      showExamination,
      showOthersExams,
      showBreak,
      showSemesterPendek,
      showKuliahIntersesi,
      showKKT,
    ]
  );

  const todayInRange = useMemo(() => {
    if (calendarDataVersion < 0) return false;
    const months = getMonthsForSessions(selectedSessions, monthOptions);
    return isTodayInSessionRange(todayStr, months);
  }, [calendarDataVersion, selectedSessions, monthOptions, todayStr]);

  const anchorRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const viewport = window.visualViewport;
    const anchor = anchorRef.current;
    if (!viewport || !anchor) return;

    const syncBottomInset = () => {
      const layoutHeight = Math.max(window.innerHeight, document.documentElement.clientHeight);
      const visualBottom = viewport.offsetTop + viewport.height;
      const inset = Math.max(0, layoutHeight - visualBottom);
      anchor.style.setProperty("--today-fab-vv-bottom", `${inset}px`);
    };

    syncBottomInset();
    viewport.addEventListener("resize", syncBottomInset);
    viewport.addEventListener("scroll", syncBottomInset);
    window.addEventListener("resize", syncBottomInset);
    return () => {
      viewport.removeEventListener("resize", syncBottomInset);
      viewport.removeEventListener("scroll", syncBottomInset);
      window.removeEventListener("resize", syncBottomInset);
    };
  }, [isMounted]);

  const listFilterOptions = useMemo<ActivityFilterOptions>(
    () => ({
      selectedProgram,
      showRegistration,
      showLecture,
      showSemesterPendek,
      showKuliahIntersesi,
      showExamination,
      showOthersExams,
      showBreak,
    }),
    [
      selectedProgram,
      showRegistration,
      showLecture,
      showSemesterPendek,
      showKuliahIntersesi,
      showExamination,
      showOthersExams,
      showBreak,
    ]
  );

  const holidaysByDateAll = usePublicHolidaysForSessions(
    selectedSessions,
    showKKT,
    initialPublicHolidaysByYear,
    calendarDataVersion
  );
  const holidaysByDate = showBreak ? holidaysByDateAll : {};

  const listTodayAnchorKey = useMemo(() => {
    if (viewMode !== "list" || !todayStr || calendarDataVersion < 0) return null;
    const uniqueActivities = getUniqueListActivities(
      getActivitiesForList(selectedSessions, listFilterOptions),
      selectedProgram === "All"
    );
    return resolveListTodayAnchorKey(uniqueActivities, holidaysByDate, todayStr, showKKT).rowKey;
  }, [
    viewMode,
    todayStr,
    calendarDataVersion,
    selectedSessions,
    listFilterOptions,
    selectedProgram,
    holidaysByDate,
    showKKT,
  ]);

  const sessionKey = selectedSessions.join(",");
  const { shouldShow, scrollToToday } = useCalendarTodayFab({
    viewMode,
    todayStr,
    todayInRange,
    listTodayAnchorKey,
    program: selectedProgram,
    sessionIds: selectedSessions,
    anchorVersion: `${calendarDataVersion}|${viewMode}|${sessionKey}|${todayStr}|${listTodayAnchorKey ?? "none"}`,
  });

  if (!isMounted) return null;

  return createPortal(
    <div
      ref={anchorRef}
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center bottom-[calc(max(1.5rem,env(safe-area-inset-bottom,0px))+var(--today-fab-vv-bottom,0px))] supports-[height:100dvh]:bottom-[calc(1.5rem+max(env(safe-area-inset-bottom,0px),100lvh-100dvh,var(--today-fab-vv-bottom,0px)))]"
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label="Go to today"
        aria-hidden={!shouldShow}
        data-today-fab=""
        tabIndex={-1}
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onClick={scrollToToday}
        style={{
          transitionProperty: "translate, opacity",
          transitionDuration: "300ms",
          transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
        }}
        className={cn(
          "rounded-full px-4 shadow-md",
          "outline-none focus:outline-none focus-visible:border-transparent focus-visible:ring-0",
          "[&:focus]:ring-0 [&:focus-visible]:ring-0 [&:focus]:shadow-none [&:focus-visible]:shadow-none",
          shouldShow
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-[calc(100%+1.75rem+max(env(safe-area-inset-bottom,0px),100lvh-100dvh,var(--today-fab-vv-bottom,0px)))] opacity-0"
        )}
      >
        Today
      </Button>
    </div>,
    document.body
  );
}
