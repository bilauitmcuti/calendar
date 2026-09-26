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

/** Matches Button size="sm" (h-8). */
const FAB_HEIGHT_PX = 32;
/** Gap above visual viewport bottom (1.5rem). */
const FAB_GAP_PX = 24;

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

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  useEffect(() => {
    if (!isMounted) return;
    const button = buttonRef.current;
    const viewport = window.visualViewport;
    if (!button || !viewport) return;

    const syncFabPosition = () => {
      const visualBottom = viewport.offsetTop + viewport.height;
      const top = visualBottom - FAB_HEIGHT_PX - FAB_GAP_PX;
      button.style.top = `${top}px`;
      button.style.bottom = "auto";
      button.style.left = "50%";

      const toolbarInset = Math.max(0, window.innerHeight - visualBottom);
      document.documentElement.style.setProperty(
        "--today-fab-toolbar-inset",
        `${toolbarInset}px`
      );
    };

    syncFabPosition();
    viewport.addEventListener("resize", syncFabPosition);
    viewport.addEventListener("scroll", syncFabPosition);
    window.addEventListener("resize", syncFabPosition);
    window.addEventListener("orientationchange", syncFabPosition);

    return () => {
      viewport.removeEventListener("resize", syncFabPosition);
      viewport.removeEventListener("scroll", syncFabPosition);
      window.removeEventListener("resize", syncFabPosition);
      window.removeEventListener("orientationchange", syncFabPosition);
      document.documentElement.style.removeProperty("--today-fab-toolbar-inset");
    };
  }, [isMounted]);

  if (!isMounted) return null;

  return createPortal(
    <Button
      ref={buttonRef}
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
        transform: shouldShow
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(calc(100% + 24px))",
      }}
      className={cn(
        "fixed z-40 rounded-full px-4 shadow-md",
        "bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] left-1/2",
        "outline-none focus:outline-none focus-visible:border-transparent focus-visible:ring-0",
        "[&:focus]:ring-0 [&:focus-visible]:ring-0 [&:focus]:shadow-none [&:focus-visible]:shadow-none",
        "active:translate-y-0",
        shouldShow ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      Today
    </Button>,
    document.body
  );
}
