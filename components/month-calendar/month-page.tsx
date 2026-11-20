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
import { buildMonthHref, type MonthView } from "@/lib/month-routes";
import { DEFAULT_FILTER_STATES } from "@/lib/data";
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
  monthForSessionChange,
  planSessionArrival,
  readCarriedSessionFocus,
  writeCarriedSessionFocus,
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
  const pendingSessionId = useRef<string | null>(null);
  const selectedDateRef = useRef(selectedDate);
  useEffect(() => {
    selectedDateRef.current = selectedDate;
  }, [selectedDate]);
  const appliedArrival = useRef({ month: payload.month, sessionId: payload.sessionId });
  const playedContentFade = useRef(0);
  const [frame, setFrame] = useState(payload);
  const [ghost, setGhost] = useState<{ payload: MonthCalendarPayload; date: string } | null>(null);
  const [enterFrom, setEnterFrom] = useState<"next" | "prev" | null>(null);
  const [showKKT, setShowKKT] = useState<boolean>(DEFAULT_FILTER_STATES.showKKT);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("showKKT");
      if (stored) setShowKKT(JSON.parse(stored));
    } catch {
      setShowKKT(DEFAULT_FILTER_STATES.showKKT);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("showKKT", JSON.stringify(showKKT));
  }, [showKKT]);

  const hasRegionalDateRange = useMemo(
    () => payload.activities.some((activity) => activity.regionalStartDate || activity.regionalEndDate),
    [payload.activities]
  );

  const spans = useMemo(
    () => buildMonthSpans(frame.activities, frame.holidays, showKKT),
    [frame.activities, frame.holidays, showKKT]
  );
  const visibleSpans = useMemo(
    () => spans.filter((span) => spanMatchesFilter(span, filter)),
    [spans, filter]
  );
  const weeks = useMemo(
    () => packMonth(visibleSpans, frame.month),
    [visibleSpans, frame.month]
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
    markMonthContentFade();
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
    const arrivalChanged =
      appliedArrival.current.month !== payload.month ||
      appliedArrival.current.sessionId !== payload.sessionId;
    appliedArrival.current = { month: payload.month, sessionId: payload.sessionId };
    const plan = planSessionArrival({
      pendingSessionId: pendingSessionId.current,
      carried: readCarriedSessionFocus(),
      sessionId: payload.sessionId,
      month: payload.month,
      today: payload.today,
      defaultSessionId,
      activities: payload.activities,
      focusDate: payload.focusDate,
      arrivalChanged,
    });
    if (plan.action === "navigate") {
      writeCarriedSessionFocus(plan.carry);
      router.replace(
        buildMonthHref(payload.program, payload.view, plan.month, payload.sessionId, {
          today: payload.today,
          defaultSessionId,
        }),
        { scroll: false }
      );
      return;
    }
    if (plan.action === "keep") return;
    setSelectedDate(plan.date);
    if (!plan.clearPending) return;
    if (pendingSessionId.current === payload.sessionId) pendingSessionId.current = null;
    if (readCarriedSessionFocus()?.sessionId === payload.sessionId) writeCarriedSessionFocus(null);
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
    if (monthContentKey(payload) === monthContentKey(frame)) {
      if (payload !== frame) setFrame(payload);
      return;
    }
    const nonce = readMonthContentFadeNonce();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = nonce !== playedContentFade.current && !reduce;
    playedContentFade.current = Math.max(playedContentFade.current, nonce);
    if (animate) {
      setGhost({ payload: frame, date: selectedDateRef.current });
      setEnterFrom(monthEnterFrom(frame.month, payload.month));
    } else {
      setGhost(null);
      setEnterFrom(null);
    }
    setFrame(payload);
  }, [frame, payload]);

  useEffect(() => {
    if (!ghost) return;
    const timer = window.setTimeout(() => setGhost(null), 220);
    return () => window.clearTimeout(timer);
  }, [ghost]);

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
    const docked = window.matchMedia("(min-width: 1080px)").matches;
    if (docked) setDayDocked(true);
  }, []);

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
      if (typing) {
        if (event.key === "Escape" && target instanceof HTMLElement) target.blur();
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
  }, [goToMonth, goToToday, moveDays, openDayIfNeeded, payload.month, payload.view]);

  function href(month: string, sessionId: string) {
    return monthHref(month, sessionId);
  }

  function selectDate(date: string) {
    setSelectedDate(date);
    openDayIfNeeded();
  }

  const lectureWeek = frame.lectureWeekByDate[selectedDate];

  return (
    <div className="fixed inset-0 flex min-h-0 flex-col bg-muted text-foreground">
      {payload.error ? (
        <p className={cn("shrink-0 border-b border-border px-4 py-2", monthType.error)}>{payload.error}</p>
      ) : null}
      <div
        className={cn(
          "grid min-h-0 flex-1 grid-cols-1 gap-2 bg-muted p-2",
          sidebarDocked && "min-[900px]:grid-cols-[16rem_minmax(0,1fr)]"
        )}
      >
        <aside className={cn("hidden h-full min-h-0 overflow-hidden", sidebarDocked && "min-[900px]:flex")}>
          <MonthSidebar
            program={payload.program}
            view={payload.view}
            month={payload.month}
            sessionId={payload.sessionId}
            sessionOptions={payload.sessionOptions}
            programOptions={payload.programOptions}
            defaultSession={payload.defaultSession}
            today={payload.today}
            spans={spans}
            filter={filter}
            onFilterChange={setFilter}
            onSessionChange={changeSession}
            showKKT={showKKT}
            onShowKKTChange={setShowKKT}
            hasRegionalDateRange={hasRegionalDateRange}
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
            <Button type="button" variant="ghost" size="sm" className={headerButtonClass} onClick={goToToday}>
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
          <div className="month-content relative flex min-h-0 flex-1">
            {ghost ? (
              <div
                className="month-stage-out pointer-events-none absolute inset-0"
                aria-hidden
                onAnimationEnd={(event) => {
                  if (event.target !== event.currentTarget) return;
                  setGhost(null);
                }}
              >
                <MonthCards
                  payload={ghost.payload}
                  selectedDate={ghost.date}
                  showKKT={showKKT}
                  filter={filter}
                  dayDocked={dayDocked}
                  onSelectDate={selectDate}
                />
              </div>
            ) : null}
            <div
              className={cn(monthStageShellClass, ghost && "month-stage-in")}
              data-dir={enterFrom ?? undefined}
            >
            <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col">
              {frame.view === "grid" ? (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <MonthGrid
                    month={frame.month}
                    today={frame.today}
                    selectedDate={selectedDate}
                    weeks={weeks}
                    spans={visibleSpans}
                    lectureWeekByDate={frame.lectureWeekByDate}
                    onSelectDate={selectDate}
                  />
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-hidden">
                  <UpcomingList
                    month={frame.month}
                    today={frame.today}
                    program={frame.program}
                    selectedDate={selectedDate}
                    spans={visibleSpans}
                    onSelectDate={selectDate}
                  />
                </div>
              )}
            </div>
            <aside className={monthStageDayAsideClass(dayDocked, frame.view)}>
              <DayPanel
                date={selectedDate}
                today={payload.today}
                program={frame.program}
                spans={daySpans}
                lectureWeek={lectureWeek}
                className="h-full min-h-0 w-full"
              />
            </aside>
            </div>
          </div>
        </main>
      </div>
      <p className="sr-only" aria-live="polite">
        {formatDayHeading(selectedDate)}, {daySpans.length === 1 ? "1 event" : `${daySpans.length} events`}
      </p>
      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen} swipeDirection="left">
        <DrawerContent className="responsive-shell-bg h-dvh [--drawer-content-height:100dvh] [--drawer-content-width:18rem] [&_[data-slot=drawer-body-shell]]:min-h-0 [&_[data-slot=drawer-body-shell]]:flex-1 [&_[data-slot=drawer-body-shell]]:overflow-hidden">
          <DrawerTitle className="sr-only">Menu</DrawerTitle>
          <DrawerDescription className="sr-only">Programs, session, and calendars</DrawerDescription>
          <MonthSidebar
            program={payload.program}
            view={payload.view}
            month={payload.month}
            sessionId={payload.sessionId}
            sessionOptions={payload.sessionOptions}
            programOptions={payload.programOptions}
            defaultSession={payload.defaultSession}
            today={payload.today}
            spans={spans}
            filter={filter}
            onFilterChange={setFilter}
            onSessionChange={(sessionId) => {
              setSidebarOpen(false);
              changeSession(sessionId);
            }}
            onNavigate={() => setSidebarOpen(false)}
            onClose={() => setSidebarOpen(false)}
            showKKT={showKKT}
            onShowKKTChange={setShowKKT}
            hasRegionalDateRange={hasRegionalDateRange}
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

function monthContentKey(payload: MonthCalendarPayload): string {
  return `${payload.view}|${payload.program}|${payload.sessionId}|${payload.month}`;
}

function monthEnterFrom(from: string, to: string): "next" | "prev" | null {
  if (from === to) return null;
  return to > from ? "next" : "prev";
}

const monthStageShellClass =
  "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card min-[1080px]:flex-row";

function monthStageDayAsideClass(dayDocked: boolean, view: MonthView) {
  return cn(
    "flex min-h-0 w-full min-w-0 flex-1 basis-0 flex-col overflow-hidden",
    "border-t border-border min-[1080px]:w-80 min-[1080px]:flex-none min-[1080px]:shrink-0 min-[1080px]:border-t-0 min-[1080px]:border-l",
    view !== "grid" && "max-[1079px]:hidden",
    !dayDocked && "min-[1080px]:hidden"
  );
}

function MonthCards({
  payload,
  selectedDate,
  showKKT,
  filter,
  dayDocked,
  onSelectDate,
}: {
  payload: MonthCalendarPayload;
  selectedDate: string;
  showKKT: boolean;
  filter: MonthFilterState;
  dayDocked: boolean;
  onSelectDate: (date: string) => void;
}) {
  const spans = useMemo(
    () => buildMonthSpans(payload.activities, payload.holidays, showKKT).filter((span) => spanMatchesFilter(span, filter)),
    [filter, payload.activities, payload.holidays, showKKT]
  );
  const weeks = useMemo(() => packMonth(spans, payload.month), [payload.month, spans]);
  const daySpans = useMemo(() => spansOnDate(spans, selectedDate), [selectedDate, spans]);
  const lectureWeek = payload.lectureWeekByDate[selectedDate];

  return (
    <div className={monthStageShellClass}>
      <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col">
        {payload.view === "grid" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <MonthGrid
              month={payload.month}
              today={payload.today}
              selectedDate={selectedDate}
              weeks={weeks}
              spans={spans}
              lectureWeekByDate={payload.lectureWeekByDate}
              onSelectDate={onSelectDate}
            />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-hidden">
            <UpcomingList
              month={payload.month}
              today={payload.today}
              program={payload.program}
              selectedDate={selectedDate}
              spans={spans}
              onSelectDate={onSelectDate}
            />
          </div>
        )}
      </div>
      <aside className={monthStageDayAsideClass(dayDocked, payload.view)}>
        <DayPanel
          date={selectedDate}
          today={payload.today}
          program={payload.program}
          spans={daySpans}
          lectureWeek={lectureWeek}
          className="h-full min-h-0 w-full"
        />
      </aside>
    </div>
  );
}

function initialDate(month: string, today: string, focusDate?: string): string {
  if (focusDate && dateInMonthGrid(month, focusDate)) return focusDate;
  if (dateInMonthGrid(month, today)) return today;
  return `${month}-01`;
}

