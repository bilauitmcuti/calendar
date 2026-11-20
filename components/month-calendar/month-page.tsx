"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { buildMonthHref } from "@/lib/month-routes";
import { getGroupFromProgram } from "@/lib/session-memory";
import type { MonthCalendarPayload } from "@/lib/month-calendar-types";
import "@/components/month-calendar/month-motion.css";
import { DayPanel } from "@/components/month-calendar/day-panel";
import { MonthGrid } from "@/components/month-calendar/month-grid";
import { MonthSidebar } from "@/components/month-calendar/month-sidebar";
import { UpcomingList } from "@/components/month-calendar/upcoming-list";
import { formatDayHeading, formatMonthShort, formatMonthTitle } from "@/components/month-calendar/calendar-style";
import { markMonthContentFade, monthType, readMonthContentFadeNonce } from "@/components/month-calendar/month-typography";
import {
  addDays,
  buildMonthSpans,
  dateInMonthGrid,
  defaultMonthFilters,
  packMonth,
  shiftMonth,
  spanMatchesFilter,
  spansOnDate,
  type MonthFilterState,
} from "@/components/month-calendar/pack-spans";
import {
  earliestActivityDate,
  monthForSessionChange,
  sessionContainsToday,
} from "@/components/month-calendar/session-focus";

const headerButtonClass =
  "hover:bg-secondary active:bg-secondary aria-expanded:bg-transparent dark:hover:bg-[#2A2A2A] dark:active:bg-[#2A2A2A]";

interface MonthPageProps {
  payload: MonthCalendarPayload;
}

export function MonthPage({ payload }: MonthPageProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<MonthFilterState>(defaultMonthFilters);
  const [selectedDate, setSelectedDate] = useState(() =>
    initialDate(payload.month, payload.today, payload.focusDate)
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(false);
  const [sidebarDocked, setSidebarDocked] = useState(true);
  const [dayDocked, setDayDocked] = useState(true);
  const sidebarFilterRef = useRef<HTMLInputElement>(null);
  const drawerFilterRef = useRef<HTMLInputElement>(null);
  const pendingFilterFocus = useRef(false);
  const pendingDrawerFilter = useRef(false);
  const pendingSessionId = useRef<string | null>(null);
  const playedContentFade = useRef(0);
  const [contentFade, setContentFade] = useState(false);

  const spans = useMemo(
    () => buildMonthSpans(payload.activities, payload.holidays),
    [payload.activities, payload.holidays]
  );
  const visibleSpans = useMemo(
    () => spans.filter((span) => spanMatchesFilter(span, filter)),
    [spans, filter]
  );
  const weeks = useMemo(
    () => packMonth(visibleSpans, payload.month),
    [visibleSpans, payload.month]
  );
  const daySpans = useMemo(
    () => spansOnDate(visibleSpans, selectedDate),
    [visibleSpans, selectedDate]
  );

  const defaultSessionId = payload.defaultSession[getGroupFromProgram(payload.program)];

  function monthHref(month: string, sessionId: string) {
    return buildMonthHref(payload.program, payload.view, month, sessionId, {
      today: payload.today,
      defaultSessionId,
    });
  }

  useEffect(() => {
    const next = buildMonthHref(payload.program, payload.view, payload.month, payload.sessionId, {
      today: payload.today,
      defaultSessionId,
    });
    const current = `${window.location.pathname}${window.location.search}`;
    if (current === next) return;
    router.replace(next, { scroll: false });
  }, [defaultSessionId, payload.month, payload.sessionId, payload.program, payload.today, payload.view, router]);

  const changeSession = useCallback((sessionId: string) => {
    if (sessionId === payload.sessionId) return;
    pendingSessionId.current = sessionId;
    const option = payload.sessionOptions.find((item) => item.id === sessionId);
    const month = monthForSessionChange({
      sessionId,
      label: option?.label,
      currentSessionId: defaultSessionId,
      today: payload.today,
      fallbackMonth: payload.month,
    });
    router.push(
      buildMonthHref(payload.program, payload.view, month, sessionId, {
        today: payload.today,
        defaultSessionId,
      }),
      { scroll: false }
    );
  }, [
    defaultSessionId,
    payload.month,
    payload.program,
    payload.sessionId,
    payload.sessionOptions,
    payload.today,
    payload.view,
    router,
  ]);

  useEffect(() => {
    setDayOpen(false);
    const pending = pendingSessionId.current;
    if (pending == null || pending !== payload.sessionId) {
      setSelectedDate(initialDate(payload.month, payload.today, payload.focusDate));
      return;
    }
    const isCurrent =
      payload.sessionId === defaultSessionId || sessionContainsToday(payload.activities, payload.today);
    const start = isCurrent ? payload.today : earliestActivityDate(payload.activities);
    if (start) {
      const month = start.slice(0, 7);
      if (payload.month !== month) {
        router.replace(
          buildMonthHref(payload.program, payload.view, month, payload.sessionId, {
            today: payload.today,
            defaultSessionId,
          }),
          { scroll: false }
        );
        return;
      }
      setSelectedDate(dateInMonthGrid(payload.month, start) ? start : `${payload.month}-01`);
    } else {
      setSelectedDate(initialDate(payload.month, payload.today, payload.focusDate));
    }
    const timeout = window.setTimeout(() => {
      if (pendingSessionId.current === payload.sessionId) pendingSessionId.current = null;
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [
    defaultSessionId,
    payload.activities,
    payload.focusDate,
    payload.month,
    payload.program,
    payload.sessionId,
    payload.today,
    payload.view,
    router,
  ]);

  useEffect(() => {
    const nonce = readMonthContentFadeNonce();
    if (nonce === 0 || nonce === playedContentFade.current) return;
    setContentFade(false);
    const frame = requestAnimationFrame(() => {
      playedContentFade.current = nonce;
      setContentFade(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [payload.month, payload.view]);

  const goToMonth = useCallback((month: string) => {
    router.push(
      buildMonthHref(payload.program, payload.view, month, payload.sessionId, {
        today: payload.today,
        defaultSessionId,
      }),
      { scroll: false }
    );
  }, [defaultSessionId, payload.program, payload.sessionId, payload.today, payload.view, router]);

  const goToToday = useCallback(() => {
    const month = payload.today.slice(0, 7);
    if (month !== payload.month) goToMonth(month);
    else setSelectedDate(payload.today);
  }, [goToMonth, payload.month, payload.today]);

  const moveDays = useCallback((days: number) => {
    const next = addDays(selectedDate, days);
    if (!dateInMonthGrid(payload.month, next)) {
      goToMonth(next.slice(0, 7));
      return;
    }
    setSelectedDate(next);
  }, [goToMonth, payload.month, selectedDate]);

  const openDayIfNeeded = useCallback(() => {
    const compact = window.matchMedia("(max-width: 559px)").matches;
    const docked = window.matchMedia("(min-width: 1080px)").matches;
    if (payload.view === "grid" && compact) return;
    if (docked) setDayDocked(true);
    else setDayOpen(true);
  }, [payload.view]);

  const focusFilter = useCallback(() => {
    const wide = window.matchMedia("(min-width: 900px)").matches;
    if (!wide) {
      pendingDrawerFilter.current = true;
      setSidebarOpen(true);
      return;
    }
    if (sidebarDocked) {
      sidebarFilterRef.current?.focus();
      return;
    }
    pendingFilterFocus.current = true;
    setSidebarDocked(true);
  }, [sidebarDocked]);

  useEffect(() => {
    if (!sidebarDocked || !pendingFilterFocus.current) return;
    pendingFilterFocus.current = false;
    sidebarFilterRef.current?.focus();
  }, [sidebarDocked]);

  useEffect(() => {
    if (!sidebarOpen || !pendingDrawerFilter.current) return;
    pendingDrawerFilter.current = false;
    drawerFilterRef.current?.focus();
  }, [sidebarOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const element = target instanceof HTMLElement ? target : null;
      const typing =
        element != null &&
        (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.isContentEditable);
      const outsideGrid =
        element != null &&
        Boolean(element.closest("a, button, select")) &&
        !element.closest("[role=gridcell]");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        focusFilter();
        return;
      }
      if (typing) {
        if (event.key === "Escape") {
          if (filter.query) setFilter((current) => ({ ...current, query: "" }));
          else if (target instanceof HTMLElement) target.blur();
        }
        return;
      }
      if (outsideGrid && event.key !== "Escape" && event.key !== "t" && event.key !== "T") return;
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setDayOpen(false);
        setDayDocked(false);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveDays(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        moveDays(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveDays(-7);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        moveDays(7);
      } else if (event.key === "PageUp") {
        event.preventDefault();
        goToMonth(shiftMonth(payload.month, -1));
      } else if (event.key === "PageDown") {
        event.preventDefault();
        goToMonth(shiftMonth(payload.month, 1));
      } else if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        goToToday();
      } else if (event.key === "Enter") {
        openDayIfNeeded();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    filter.query,
    focusFilter,
    goToMonth,
    goToToday,
    moveDays,
    openDayIfNeeded,
    payload.month,
    payload.view,
  ]);

  function href(month: string, sessionId: string) {
    return monthHref(month, sessionId);
  }

  function selectDate(date: string) {
    setSelectedDate(date);
    openDayIfNeeded();
  }

  const lectureWeek = payload.lectureWeekByDate[selectedDate];

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-muted text-foreground">
      {payload.error ? (
        <p className={cn("shrink-0 border-b border-border px-4 py-2", monthType.error)}>{payload.error}</p>
      ) : null}
      <div
        className={cn(
          "grid min-h-0 flex-1 grid-cols-1 gap-2 p-2",
          sidebarDocked && "min-[900px]:grid-cols-[16rem_minmax(0,1fr)]"
        )}
      >
        <aside className={cn("hidden min-h-0", sidebarDocked && "min-[900px]:flex")}>
          <MonthSidebar
            program={payload.program}
            view={payload.view}
            month={payload.month}
            sessionId={payload.sessionId}
            sessionOptions={payload.sessionOptions}
            defaultSession={payload.defaultSession}
            today={payload.today}
            spans={spans}
            filter={filter}
            onFilterChange={setFilter}
            onSessionChange={changeSession}
            filterInputId="month-filter"
            filterRef={sidebarFilterRef}
          />
        </aside>
        <main className="flex min-h-0 min-w-0 flex-col">
          <header className="flex h-12 shrink-0 items-center gap-1 px-1">
            {sidebarDocked ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={cn("hidden min-[900px]:inline-flex", headerButtonClass)}
                aria-label="Close sidebar"
                aria-expanded
                onClick={() => setSidebarDocked(false)}
              >
                <HugeiconsIcon icon={PanelLeftCloseIcon} strokeWidth={2} data-icon="inline-start" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(headerButtonClass, sidebarDocked && "min-[900px]:hidden")}
              aria-label="Open sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => {
                if (window.matchMedia("(min-width: 900px)").matches) setSidebarDocked(true);
                else setSidebarOpen(true);
              }}
            >
              <HugeiconsIcon icon={PanelLeftOpenIcon} strokeWidth={2} data-icon="inline-start" />
            </Button>
            <h1 className={cn("min-w-0 flex-1 truncate px-1", monthType.pageTitle)}>
              <span className="min-[560px]:hidden">{formatMonthShort(payload.month)}</span>
              <span className="hidden min-[560px]:inline">{formatMonthTitle(payload.month)}</span>
            </h1>
            <Button type="button" variant="ghost" size="sm" className={cn(headerButtonClass, "hidden sm:inline-flex")} onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={headerButtonClass}
                aria-label="Previous month"
                onClick={() => {
                  markMonthContentFade();
                  goToMonth(shiftMonth(payload.month, -1));
                }}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={headerButtonClass}
                aria-label="Next month"
                onClick={() => {
                  markMonthContentFade();
                  goToMonth(shiftMonth(payload.month, 1));
                }}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} data-icon="inline-start" />
              </Button>
            </div>
            {dayDocked ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={cn("hidden min-[1080px]:inline-flex", headerButtonClass)}
                aria-label="Close day"
                aria-expanded
                onClick={() => setDayDocked(false)}
              >
                <HugeiconsIcon icon={PanelRightCloseIcon} strokeWidth={2} data-icon="inline-start" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={cn("hidden min-[1080px]:inline-flex", headerButtonClass)}
                aria-label="Open day"
                aria-expanded={false}
                onClick={() => setDayDocked(true)}
              >
                <HugeiconsIcon icon={PanelRightOpenIcon} strokeWidth={2} data-icon="inline-start" />
              </Button>
            )}
          </header>
          <div className={cn("flex min-h-0 flex-1 gap-2", contentFade && "month-content-fade")}>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {payload.view === "grid" ? (
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto min-[560px]:overflow-hidden">
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
                    <MonthGrid
                      month={payload.month}
                      today={payload.today}
                      selectedDate={selectedDate}
                      weeks={weeks}
                      spans={visibleSpans}
                      lectureWeekByDate={payload.lectureWeekByDate}
                      onSelectDate={selectDate}
                    />
                  </div>
                  <div className="shrink-0 overflow-hidden rounded-xl border border-border bg-card min-[560px]:hidden">
                    <DayPanel
                      date={selectedDate}
                      today={payload.today}
                      program={payload.program}
                      spans={daySpans}
                      lectureWeek={lectureWeek}
                    />
                  </div>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
                  <UpcomingList
                    month={payload.month}
                    today={payload.today}
                    program={payload.program}
                    selectedDate={selectedDate}
                    spans={visibleSpans}
                    onSelectDate={selectDate}
                  />
                </div>
              )}
            </div>
            <aside className={cn("hidden min-h-0 w-80 shrink-0 overflow-hidden rounded-xl border border-border bg-card", dayDocked && "min-[1080px]:flex")}>
              <DayPanel
                date={selectedDate}
                today={payload.today}
                program={payload.program}
                spans={daySpans}
                lectureWeek={lectureWeek}
                className="w-full"
              />
            </aside>
          </div>
        </main>
      </div>
      <p className="sr-only" aria-live="polite">
        {formatDayHeading(selectedDate)}, {daySpans.length === 1 ? "1 event" : `${daySpans.length} events`}
      </p>
      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen} swipeDirection="left">
        <DrawerContent className="responsive-shell-bg h-dvh [--drawer-content-height:100dvh] [--drawer-content-width:18rem]">
          <DrawerTitle className="sr-only">Menu</DrawerTitle>
          <DrawerDescription className="sr-only">Programs, session, and calendars</DrawerDescription>
          <MonthSidebar
            program={payload.program}
            view={payload.view}
            month={payload.month}
            sessionId={payload.sessionId}
            sessionOptions={payload.sessionOptions}
            defaultSession={payload.defaultSession}
            today={payload.today}
            spans={spans}
            filter={filter}
            onFilterChange={setFilter}
            onSessionChange={(sessionId) => {
              setSidebarOpen(false);
              changeSession(sessionId);
            }}
            filterInputId="month-filter-drawer"
            filterRef={drawerFilterRef}
            onNavigate={() => setSidebarOpen(false)}
            onClose={() => setSidebarOpen(false)}
          />
        </DrawerContent>
      </Drawer>
      <Drawer open={dayOpen} onOpenChange={setDayOpen} swipeDirection="right">
        <DrawerContent className="h-dvh [--drawer-content-height:100dvh] [--drawer-content-width:20rem]">
          <DrawerTitle className="sr-only">{formatDayHeading(selectedDate)}</DrawerTitle>
          <DrawerDescription className="sr-only">Activities on the selected day</DrawerDescription>
          <DayPanel
            date={selectedDate}
            today={payload.today}
            program={payload.program}
            spans={daySpans}
            lectureWeek={lectureWeek}
            className="h-full"
            onClose={() => setDayOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function initialDate(month: string, today: string, focusDate?: string): string {
  if (focusDate && dateInMonthGrid(month, focusDate)) return focusDate;
  if (dateInMonthGrid(month, today)) return today;
  return `${month}-01`;
}

