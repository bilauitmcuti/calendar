'use client';

import React, { memo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons"

import { useState, useEffect, useLayoutEffect, useMemo, useSyncExternalStore, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
} from '@/components/ui/tooltip';
import {
  KeyboardAwareDrawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  activityDrawerContentClassName,
  activityDrawerBodyClassName,
  drawerBodyClassName,
  drawerSafeAreaBottomClassName,
} from '@/components/ui/drawer';
import { useCalendarHydrationVersion } from '@/components/calendar-hydration-context';
import {
  EMPTY_LECTURE_WEEK_BY_SESSION,
  getSnapshot,
  subscribe,
} from '@/lib/calendar-store';
import { getActivitiesForDateMultiSessions, getMonthsForSessions, getDaysUntilStart, formatCountdown, getProgramBadgeConfig, getProgramBadgesConfig, type Activity, type ActivityFilterOptions, type ActivityType, type SessionId } from '@/lib/data';
import type { PublicHolidayRow } from '@/lib/calendar-api';
import { formatHolidayStates } from '@/lib/public-holidays-for-view';
import { resolveLectureWeekMapForSessions } from '@/lib/lecture-weeks-resolve';
import { useMobileViewport } from '@/lib/use-mobile-viewport';
import { useEngagementPrompt } from '@/components/engagement-prompt';
import { trackZarazEvent, ZARAZ_EVENTS } from '@/lib/zaraz';

interface TooltipActivityListProps {
  dateKey: string;
  activities: Activity[];
  selectedProgram: string;
  showCountdown: boolean;
  currentDateStr: string | null;
  showKKT: boolean;
  /** Tooltip: mobile chevron paging. Drawer: full list with internal scroll when overflow. */
  listMode: 'paginated' | 'full';
  /** Lecture week chip; rendered inside this list (scrolls with activities). */
  weekNum?: number | null;
  surface: 'tooltip' | 'drawer';
  /** Drawer only: ref for horizontal swipe navigation on the list scroller. */
  listScrollRef?: React.RefCallback<HTMLDivElement>;
  /** Drawer only: enable inner scroll (long lists with snap). */
  listScrollable?: boolean;
  holidays?: PublicHolidayRow[];
}

function TooltipActivityList({
  dateKey,
  activities,
  selectedProgram,
  showCountdown,
  currentDateStr,
  showKKT,
  listMode,
  weekNum = null,
  surface,
  listScrollRef,
  listScrollable = false,
  holidays = [],
}: TooltipActivityListProps) {
  const badgeTextClass = 'text-xs';
  const activityTextClass = surface === 'tooltip' ? 'text-xs' : 'text-sm';
  /** Dot (8px) + gap-2 (8px); aligns badges/week chip with activity name column. */
  const activityContentIndentClass = 'pl-4';
  /** First-line box so the dot centers on line 1; extra lines flow below without shifting the dot. */
  const activityDotColumnClass = cn(
    'flex h-[1lh] shrink-0 items-center',
    activityTextClass,
    'leading-relaxed',
  );
  const PAGE_SIZE = 7;
  const [startIndex, setStartIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [listOverflows, setListOverflows] = useState(false);
  const listScrollElRef = useRef<HTMLDivElement | null>(null);

  const setListScrollNode = useCallback(
    (node: HTMLDivElement | null) => {
      listScrollElRef.current = node;
      listScrollRef?.(node);
    },
    [listScrollRef]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const sync = () => setIsMobile(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    setStartIndex(0);
  }, [dateKey, activities.length, holidays.length, weekNum]);

  // Overflow measure only gates scroll-fade — never gates overflow-y-auto,
  // so long lists paint immediately (toggling overflow/mask was delaying text).
  useLayoutEffect(() => {
    if (surface !== 'drawer' || !listScrollable) {
      setListOverflows(false);
      return;
    }

    const el = listScrollElRef.current;
    if (!el) {
      setListOverflows(false);
      return;
    }

    let fadeRaf = 0;
    const measure = () => {
      if (el.clientHeight < 8) {
        setListOverflows(false);
        return;
      }
      const overflows = el.scrollHeight > el.clientHeight + 1;
      if (!overflows) {
        if (fadeRaf) cancelAnimationFrame(fadeRaf);
        fadeRaf = 0;
        setListOverflows(false);
        return;
      }
      // Defer fade until after the list has painted without a mask.
      if (fadeRaf) cancelAnimationFrame(fadeRaf);
      fadeRaf = requestAnimationFrame(() => {
        fadeRaf = 0;
        setListOverflows(true);
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const child of el.children) ro.observe(child);
    const popup = el.closest('[data-slot="drawer-popup"]');
    if (popup) ro.observe(popup);

    return () => {
      if (fadeRaf) cancelAnimationFrame(fadeRaf);
      ro.disconnect();
    };
  }, [surface, listScrollable, dateKey, activities, holidays, weekNum]);

  const shouldPaginate = listMode === 'paginated' && isMobile && activities.length > PAGE_SIZE;
  const hasPrev = startIndex > 0;
  const hasNext = startIndex + PAGE_SIZE < activities.length;
  const visibleActivities = shouldPaginate
    ? activities.slice(startIndex, startIndex + PAGE_SIZE)
    : activities;
  const mutedTextClass = cn(activityTextClass, 'font-normal leading-4 text-muted-foreground break-words');
  const useDrawerScrollShell = surface === 'drawer' && listScrollable;

  return (
    <div
      data-grid-day-activities
      className={cn(
        'w-full min-w-0 border-0 py-1 text-left shadow-none outline-none ring-0 ring-offset-0',
        useDrawerScrollShell && 'flex min-h-0 flex-1 flex-col overflow-hidden'
      )}
    >
      <div
        ref={setListScrollNode}
        data-grid-activity-list-scroll={surface === 'drawer' ? '' : undefined}
        data-slot={surface === 'drawer' ? 'drawer-no-drag' : undefined}
        data-base-ui-swipe-ignore={surface === 'drawer' ? '' : undefined}
        data-grid-activity-drawer-swipe={surface === 'drawer' ? '' : undefined}
        data-overflows={useDrawerScrollShell && listOverflows ? '' : undefined}
        className={cn(
          'flex min-w-0 flex-col gap-2 border-0 shadow-none outline-none ring-0 ring-offset-0',
          // Always scrollable when constrained — do not wait on overflow measure.
          useDrawerScrollShell &&
            'min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-pb-4',
          // Top + bottom fade only after overflow is confirmed (after paint).
          useDrawerScrollShell && listOverflows && 'scroll-fade'
        )}
      >
        {shouldPaginate && hasPrev ? (
          <div className="pb-1">
            <button
              type="button"
              onClick={() => setStartIndex((prev) => Math.max(0, prev - 1))}
              className="flex h-6 w-full items-center justify-center rounded-md text-muted-foreground md:hover:bg-accent md:hover:text-accent-foreground"
              aria-label="Show previous events"
            >
              <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {weekNum != null ? (
          <div className={cn('min-w-0 text-left', activityContentIndentClass)}>
            <span className={cn('inline-block rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200', badgeTextClass)}>
              Week {weekNum}
            </span>
          </div>
        ) : null}

        {visibleActivities.map((activity, idx) => {
          const dotColor =
            activity.type === 'registration' ? 'bg-[#d1d5db]' :
            activity.type === 'lecture' ? 'bg-[#8b5cf6]' :
            activity.type === 'examination' ? 'bg-[#dc2626]' :
            activity.type === 'break' ? 'bg-[#10b981]' : 'bg-gray-400';
          const countdownTypes: ActivityType[] = ['lecture', 'examination', 'break'];
          const days = showCountdown && countdownTypes.includes(activity.type) && currentDateStr
            ? getDaysUntilStart(activity, currentDateStr, showKKT)
            : null;
          const badgeConfigs = selectedProgram === 'All'
            ? getProgramBadgesConfig(activity, selectedProgram).length > 0
              ? getProgramBadgesConfig(activity, selectedProgram)
              : getProgramBadgeConfig(activity) ? [getProgramBadgeConfig(activity)!] : []
            : getProgramBadgesConfig(activity, selectedProgram).length > 0
              ? getProgramBadgesConfig(activity, selectedProgram)
              : getProgramBadgeConfig(activity) ? [getProgramBadgeConfig(activity)!] : [];
          const label = activity.name;
          const displayName = days != null ? `${label} (${formatCountdown(days)})` : label;

          return (
            <div key={`${activity.name}|${activity.startDate}|${idx}`} className="min-w-0 transition-none">
              {badgeConfigs.length > 0 ? (
                <div className={cn('mb-1 flex flex-wrap gap-1', activityContentIndentClass)}>
                  {badgeConfigs.map((cfg) => (
                    <div key={cfg.label} className={cn('inline-block rounded-full px-2 py-0.5 font-medium', badgeTextClass, cfg.bgClass, cfg.textClass)}>
                      {cfg.label}
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="flex items-start gap-2 transition-none">
                <div className={activityDotColumnClass}>
                  <div
                    className={cn('h-2 w-2 shrink-0 rounded-full transition-none', dotColor)}
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn(activityTextClass, 'leading-relaxed whitespace-normal text-wrap break-words [overflow-wrap:anywhere] transition-none')}>
                    {displayName}
                  </p>
                  {activity.duration ? (
                    <p className={cn('mt-1', mutedTextClass)}>
                      {activity.duration}
                    </p>
                  ) : null}
                  {activity.details ? (
                    <p className={cn('mt-1', mutedTextClass)}>
                      {activity.details}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {holidays.map((holiday) => {
          const title = holiday.isSubjectToChange ? `${holiday.name} *` : holiday.name;
          const statesLabel = formatHolidayStates(holiday.states);
          return (
            <div key={`${holiday.id}|${holiday.date}`} className="min-w-0 transition-none">
              <div className="flex items-start gap-2 transition-none">
                <div className={activityDotColumnClass}>
                  <div
                    className="h-2 w-2 shrink-0 rounded-full bg-[#10b981] transition-none"
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn(activityTextClass, 'leading-relaxed whitespace-normal text-wrap break-words [overflow-wrap:anywhere] transition-none')}>
                    {title}
                  </p>
                  {statesLabel ? (
                    <p className={cn('mt-1', mutedTextClass)}>
                      {statesLabel}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {shouldPaginate && hasNext ? (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setStartIndex((prev) => Math.min(activities.length - PAGE_SIZE, prev + 1))}
              className="flex h-6 w-full items-center justify-center rounded-md text-muted-foreground md:hover:bg-accent md:hover:text-accent-foreground"
              aria-label="Show next events"
            >
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function normalizeProgramType(programType: string | undefined, selectedProgram: string): string {
  if (!programType) return '';
  if (selectedProgram !== 'All') return programType;
  if (programType === 'DiplomaPartTime' || programType === 'BachelorPartTime') return 'PartTime';
  return programType;
}

function getActivityPriority(activity: Activity, allDayActivities?: Activity[]): number {
  const { type, name } = activity;
  if (type === 'examination') return 0;
  if (type === 'break') return 1;
  if (type === 'lecture') {
    if (/^(Lecture|Kuliah)\s+\d+$/.test(name)) return 2;
    if ((name.includes('Short Semester') || name.includes('Semester Pendek')) && allDayActivities) {
      const hasSemesterPendek = allDayActivities.some(a => a.name.includes('Short Semester') || a.name.includes('Semester Pendek'));
      const hasLectureIntersesi = allDayActivities.some(a => a.name.includes('Intersession Classes') || a.name.includes('Intersesi'));
      const hasCutiSemester = allDayActivities.some(a => a.name.includes('Cuti Semester'));
      if (hasSemesterPendek && (hasLectureIntersesi || hasCutiSemester)) return 1;
    }
    if (name.includes('Short Semester') || name.includes('Semester Pendek')) return 3;
    if (name.includes('Intersession Classes') || name.includes('Intersesi')) return 4;
    return 5;
  }
  if (type === 'registration') return 6;
  return 7;
}

function resolveDayActivitiesForDrawer(
  dateStr: string,
  sessionIds: SessionId[],
  showKKT: boolean,
  filters: ActivityFilterOptions,
  selectedProgram: string,
): Activity[] {
  if (sessionIds.length === 0) return [];
  const activities = getActivitiesForDateMultiSessions(dateStr, sessionIds, showKKT, filters);
  activities.sort((a, b) => getActivityPriority(a, activities) - getActivityPriority(b, activities));
  return dedupDayActivities(activities, selectedProgram);
}

function dedupDayActivities(activities: Activity[], selectedProgram: string): Activity[] {
  const seenKey = new Set<string>();
  return activities.filter((a) => {
    const key = [
      a.name,
      a.startDate,
      a.endDate ?? '',
      a.type,
      a.programTypes?.length
        ? a.programTypes.join(',')
        : normalizeProgramType(a.programType, selectedProgram),
      a.allStudents ? '1' : '0',
    ].join('|');
    if (seenKey.has(key)) return false;
    seenKey.add(key);
    return true;
  });
}

interface GridDayActivitiesPanelProps {
  dateStr: string;
  activities: Activity[];
  weekNum: number | null;
  selectedProgram: string;
  showCountdown: boolean;
  currentDateStr: string | null;
  showKKT: boolean;
  surface: 'tooltip' | 'drawer';
  listScrollRef?: React.RefCallback<HTMLDivElement>;
  listScrollable?: boolean;
  holidays?: PublicHolidayRow[];
}

function GridDayActivitiesPanel({
  dateStr,
  activities,
  weekNum,
  selectedProgram,
  showCountdown,
  currentDateStr,
  showKKT,
  surface,
  listScrollRef,
  listScrollable = false,
  holidays = [],
}: GridDayActivitiesPanelProps) {
  if (surface === 'tooltip') {
    return (
      <TooltipActivityList
        dateKey={dateStr}
        activities={activities}
        selectedProgram={selectedProgram}
        showCountdown={showCountdown}
        currentDateStr={currentDateStr}
        showKKT={showKKT}
        listMode="paginated"
        weekNum={weekNum}
        surface="tooltip"
        holidays={holidays}
      />
    );
  }

  return (
    <TooltipActivityList
      dateKey={dateStr}
      activities={activities}
      selectedProgram={selectedProgram}
      showCountdown={showCountdown}
      currentDateStr={currentDateStr}
      showKKT={showKKT}
      listMode="full"
      weekNum={weekNum}
      surface="drawer"
      listScrollRef={listScrollRef}
      listScrollable={listScrollable}
      holidays={holidays}
    />
  );
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-MY', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/** Fills remaining drawer height below the fixed date header. */
function ActivityDrawerAnimatedSection({
  animateKey,
  children,
  className,
}: {
  animateKey: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}>
      <div key={animateKey} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

interface GridViewProps {
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
  showCountdown: boolean;
  onMonthChange?: (month: string) => void;
  selectedStates?: string[];
  initialCurrentDate?: string;
  initialLectureWeekByDate?: Record<string, number> | null;
  holidaysByDate?: Record<string, PublicHolidayRow[]>;
}

const miniCalendarCellFrame = 'aspect-square w-full rounded-md';

function MiniCalendar({ month, year, selectedProgram, selectedSessions, showKKT, onDateClick, selectedDate, showRegistration, showLecture, showSemesterPendek, showKuliahIntersesi, showExamination, showOthersExams, showBreak, showCountdown, selectedStates = [], initialCurrentDate, tooltipOpenKey, hoveredDateStr, setTooltipOpenKey, setHoveredDateStr, tooltipAnchorRef, calendarDataVersion, suppressHoverDuringScrollRef, lectureWeekByDate, useDayActivityDrawer, onOpenActivityDrawer, holidaysByDate = {} }: { month: number; year: number; selectedProgram: string; selectedSessions: SessionId[]; showKKT: boolean; onDateClick: (date: string) => void; selectedDate: string | null; showRegistration: boolean; showLecture: boolean; showSemesterPendek: boolean; showKuliahIntersesi: boolean; showExamination: boolean; showOthersExams: boolean; showBreak: boolean; showCountdown: boolean; selectedStates?: string[]; initialCurrentDate?: string; tooltipOpenKey: string | null; hoveredDateStr: string | null; setTooltipOpenKey: React.Dispatch<React.SetStateAction<string | null>>; setHoveredDateStr: React.Dispatch<React.SetStateAction<string | null>>; tooltipAnchorRef: React.MutableRefObject<HTMLElement | null>; calendarDataVersion: number; suppressHoverDuringScrollRef: React.MutableRefObject<boolean>; lectureWeekByDate: Map<string, number> | null; useDayActivityDrawer: boolean; onOpenActivityDrawer: (dateStr: string) => void; holidaysByDate?: Record<string, PublicHolidayRow[]> }) {
  const [hasHoverCapability, setHasHoverCapability] = useState(false);
  const [hasTouchInput, setHasTouchInput] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hoverMq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const touchMq = window.matchMedia('(hover: none), (pointer: coarse)');
    const syncCapability = () => {
      const touchCapable = touchMq.matches || (navigator.maxTouchPoints ?? 0) > 0;
      setHasTouchInput(touchCapable);
      setHasHoverCapability(hoverMq.matches);
    };

    syncCapability();
    hoverMq.addEventListener('change', syncCapability);
    touchMq.addEventListener('change', syncCapability);
    return () => {
      hoverMq.removeEventListener('change', syncCapability);
      touchMq.removeEventListener('change', syncCapability);
    };
  }, []);

  const isDesktopHoverMode = hasHoverCapability && !hasTouchInput && !useDayActivityDrawer;

  useEffect(() => {
    if (isDesktopHoverMode) return;
    setHoveredDateStr(null);
    setTooltipOpenKey(null);
  }, [isDesktopHoverMode, setHoveredDateStr, setTooltipOpenKey]);

  useEffect(() => {
    if (!useDayActivityDrawer) return;
    setHoveredDateStr(null);
    setTooltipOpenKey(null);
  }, [useDayActivityDrawer, setHoveredDateStr, setTooltipOpenKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!tooltipOpenKey || isDesktopHoverMode) return;

    const closeTooltip = () => setTooltipOpenKey(null);
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-mini-calendar-trigger]')) return;
      if (target.closest('[data-mini-calendar-tooltip]')) return;
      closeTooltip();
    };

    window.addEventListener('scroll', closeTooltip, true);
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('scroll', closeTooltip, true);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [tooltipOpenKey, isDesktopHoverMode, setTooltipOpenKey]);

  // Initialize currentDateStr synchronously on client to prevent hydration mismatch
  // This ensures the same value is used on first render (client-side)
  const getInitialCurrentDate = (): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const now = new Date();
      // Convert to Malaysia time (UTC+8)
      const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
      const year = malaysiaTime.getFullYear();
      const month = String(malaysiaTime.getMonth() + 1).padStart(2, '0');
      const day = String(malaysiaTime.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return null;
    }
  };

  const [currentDateStr, setCurrentDateStr] = useState<string | null>(() => initialCurrentDate ?? getInitialCurrentDate());

  const isKKTStates = selectedStates.some(state => ['Kedah', 'Kelantan', 'Terengganu'].includes(state));
  
  // Update current date every minute to catch date changes
  useEffect(() => {
    const getMalaysiaDate = () => {
      const now = new Date();
      // Convert to Malaysia time (UTC+8)
      const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
      const year = malaysiaTime.getFullYear();
      const month = String(malaysiaTime.getMonth() + 1).padStart(2, '0');
      const day = String(malaysiaTime.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Set current date immediately on mount (after hydration)
    setCurrentDateStr(getMalaysiaDate());
    
    // Update every minute to catch date changes
    const interval = setInterval(() => {
      setCurrentDateStr(getMalaysiaDate());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filterOptions = useMemo(
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

  const monthsForRange = useMemo(
    () => {
      if (calendarDataVersion < 0) return [];
      return getMonthsForSessions(selectedSessions, {
        selectedProgram,
        showRegistration,
        showLecture,
        showExamination,
        showOthersExams,
        showBreak,
        showSemesterPendek,
        showKuliahIntersesi,
        showKKT,
      });
    },
    [
      selectedSessions,
      selectedProgram,
      showRegistration,
      showLecture,
      showExamination,
      showOthersExams,
      showBreak,
      showSemesterPendek,
      showKuliahIntersesi,
      showKKT,
      calendarDataVersion,
    ]
  );

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  
  // Always use Monday-Sunday layout (7 columns, Sunday = 6, Monday = 0)
  // Convert Sunday (0) to position 6 for Monday-start layout
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  
  const dayCells = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < adjustedFirstDay; i++) {
    dayCells.push(null);
  }
  
  // Add day cells
  for (let day = 1; day <= daysInMonth; day++) {
    dayCells.push(day);
  }

  const dayActivitiesMap = useMemo(() => {
    const map = new Map<number, Activity[]>();
    if (calendarDataVersion < 0 || selectedSessions.length === 0) return map;
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const activities = getActivitiesForDateMultiSessions(dateStr, selectedSessions, showKKT, filterOptions);
      activities.sort((a, b) => getActivityPriority(a, activities) - getActivityPriority(b, activities));
      map.set(day, activities);
    }
    return map;
  }, [daysInMonth, filterOptions, month, selectedSessions, showKKT, year, calendarDataVersion]);

  // Single source for day activities - used by tooltip, colors, dots, ring/border
  const getDayActivities = (day: number | null): Activity[] => {
    if (!day) return [];
    return dayActivitiesMap.get(day) ?? [];
  };
  
  // Helper function to check if date is weekend based on selected states
  const isWeekend = (day: number | null) => {
    if (!day) return false;
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // If Kedah, Kelantan, or Terengganu states are selected, weekend is Friday (5) and Saturday (6)
    if (selectedStates.some(state => ['Kedah', 'Kelantan', 'Terengganu'].includes(state))) {
      return dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
    }
    
    // Default: Saturday (6) and Sunday (0)
    return dayOfWeek === 0 || dayOfWeek === 6;
  };
  
  const getDayColor = (day: number | null) => {
    const activities = getDayActivities(day);
    const highest = activities[0];
    if (!highest) return '';
    if (highest.type === 'lecture') return 'bg-purple-100 dark:bg-purple-900/30';
    if (highest.type === 'examination') return 'bg-red-100 dark:bg-red-900/30';
    if (highest.type === 'break') return 'bg-green-100 dark:bg-green-900/30';
    if (highest.type === 'registration') return 'bg-gray-100 dark:bg-gray-800/30';
    return '';
  };

  const getRingColor = (day: number | null) => {
    const activities = getDayActivities(day);
    const highest = activities[0];
    if (!highest) return '';
    if (highest.type === 'registration') return 'ring-[#d1d5db]';
    if (highest.type === 'lecture') return 'ring-[#8b5cf6]';
    if (highest.type === 'examination') return 'ring-[#dc2626]';
    if (highest.type === 'break') return 'ring-[#10b981]';
    return '';
  };

  const getDayHighlightColor = (day: number | null): string => {
    const activities = getDayActivities(day);
    const highest = activities[0];
    if (!highest) return 'bg-gray-100 dark:bg-gray-900/80';
    if (highest.type === 'lecture') return 'bg-purple-200 dark:bg-purple-900/80';
    if (highest.type === 'examination') return 'bg-red-200 dark:bg-red-900/80';
    if (highest.type === 'break') return 'bg-green-200 dark:bg-green-900/80';
    if (highest.type === 'registration') return 'bg-gray-200 dark:bg-gray-900/80';
    return 'bg-gray-100 dark:bg-gray-900/80';
  };

  // Check if current date is within the calendar range for this group
  // No window check: server and client must agree when initialCurrentDate is set so SSR HTML has the border
  const isCurrentDateInRange = useMemo((): boolean => {
    if (!currentDateStr || monthsForRange.length === 0) return false;
    const firstMonth = monthsForRange[0];
    const lastMonth = monthsForRange[monthsForRange.length - 1];
    const minDate = new Date(firstMonth.year, firstMonth.month - 1, 1);
    const maxDate = new Date(lastMonth.year, lastMonth.month, 0);
    const currentDate = new Date(currentDateStr);
    return currentDate >= minDate && currentDate <= maxDate;
  }, [currentDateStr, monthsForRange]);

  const getCurrentDateBorderColor = (day: number | null): string => {
    if (!day || !currentDateStr) return '';
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (dateStr !== currentDateStr) return '';
    if (!isCurrentDateInRange) return '';
    const activities = getDayActivities(day);
    const highest = activities[0];
    if (!highest) return 'border-[1.5px] border-gray-400/50';
    if (highest.type === 'registration') return 'border-[1.5px] border-[#d1d5db]';
    if (highest.type === 'lecture') return 'border-[1.5px] border-[#8b5cf6]';
    if (highest.type === 'examination') return 'border-[1.5px] border-[#dc2626]';
    if (highest.type === 'break') return 'border-[1.5px] border-[#10b981]';
    return 'border-[1.5px] border-gray-400/50';
  };

  // Check if date is current date
  // No window check: server and client must agree when initialCurrentDate is set so SSR HTML has the border
  const isCurrentDate = (day: number | null): boolean => {
    if (!day || !currentDateStr) return false;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === currentDateStr;
  };

  const getPriorityActivitiesForDay = (day: number | null): Activity[] => {
    return getDayActivities(day).slice(0, 3);
  };

  const getActivityDotColor = (type: ActivityType): string => {
    if (type === 'registration') return 'bg-[#d1d5db]';
    if (type === 'lecture') return 'bg-[#8b5cf6]';
    if (type === 'examination') return 'bg-[#dc2626]';
    if (type === 'break') return 'bg-[#10b981]';
    return 'bg-gray-400';
  };

  const getIndicatorDots = (day: number | null) => {
    if (!day) return null;

    const priorityActivities = getPriorityActivitiesForDay(day);
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayHolidays = holidaysByDate[dateStr] ?? [];

    const activityTypeMap = new Map<ActivityType, Activity>();
    for (const activity of priorityActivities) {
      if (!activityTypeMap.has(activity.type)) {
        activityTypeMap.set(activity.type, activity);
      }
    }

    const MAX_DOTS = 3;
    const dots: Array<{ key: string; color: string }> = [];
    for (const activity of activityTypeMap.values()) {
      dots.push({
        key: `${activity.type}|${activity.name}|${activity.startDate}`,
        color: getActivityDotColor(activity.type),
      });
    }

    const holidaySlots = MAX_DOTS - dots.length;
    if (holidaySlots > 0 && dayHolidays.length > 0) {
      for (const holiday of dayHolidays.slice(0, holidaySlots)) {
        dots.push({
          key: `${dateStr}-public-holiday|${holiday.id}`,
          color: 'bg-[#10b981]',
        });
      }
    }

    const visibleDots = dots;

    return (
      <div
        className="mt-1 flex h-1.5 min-h-[6px] items-center justify-center gap-1 transition-none"
        style={{ transition: 'none' }}
      >
        {visibleDots.map((dot) => (
          <div
            key={dot.key}
            className={`h-1.5 w-1.5 rounded-full ${dot.color} transition-none`}
            style={{ transition: 'none' }}
          />
        ))}
      </div>
    );
  };

  const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  // Theme-aware classes
  const textClass = 'text-foreground';
  const mutedClass = 'text-muted-foreground';
  
  return (
    <div className="group relative w-full h-full transition-none" suppressHydrationWarning style={{ transition: 'none' }}>
      {/* Month header - same styling as list view */}
      <div className="w-full pb-4 pt-3 px-0 transition-none" suppressHydrationWarning style={{ transition: 'none' }}>
        <h3 className={`w-full font-semibold text-xl leading-7 text-left ${textClass} px-0 transition-none`} suppressHydrationWarning style={{ transition: 'none' }}>{monthNames[month - 1]} {year}</h3>
      </div>
      
      {/* Week day headers */}
      <div className="w-full mb-1 grid grid-cols-7 gap-0.5 transition-none" suppressHydrationWarning style={{ transition: 'none' }}>
        {weekDays.map((day) => (
          <div key={day} className={`text-center text-xs font-semibold ${mutedClass} transition-none`} suppressHydrationWarning style={{ transition: 'none' }}>
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="w-full grid grid-cols-7 gap-1 transition-none" style={{ transition: 'none' }}>
        {dayCells.map((day, index) => {
          const dateStr = day ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
          const isSelected = selectedDate === dateStr;
          const isHighlighted = (hoveredDateStr === dateStr || tooltipOpenKey === dateStr);
          
          if (!day) {
            return (
              <div
                key={index}
                className={`flex flex-col aspect-square w-full items-center justify-center text-xs font-medium ${textClass} transition-none`}
                style={{ transition: 'none' }}
                suppressHydrationWarning
              />
            );
          }

          // Always calculate colors - use CSS classes instead of inline styles to prevent hydration mismatch
          // Server and client will render the same HTML with CSS classes
          const dayColor = getDayColor(day);
          const ringColor = getRingColor(day);
          const borderColor = getCurrentDateBorderColor(day);
          const highlightColor = getDayHighlightColor(day);

          const uniqueDayActivities = dateStr
            ? dedupDayActivities(getDayActivities(day), selectedProgram)
            : [];
          const dayHolidays = dateStr ? holidaysByDate[dateStr] ?? [] : [];
          const hasDayItems = uniqueDayActivities.length > 0 || dayHolidays.length > 0;

          const calendarCell = (
            <div
              data-mini-calendar-trigger={dateStr ?? undefined}
              onClick={(e) => {
                if (!dateStr) return;
                if (useDayActivityDrawer) {
                  onDateClick(dateStr);
                  if (hasDayItems) {
                    onOpenActivityDrawer(dateStr);
                  }
                  return;
                }
                if (!isDesktopHoverMode) {
                  if (hasDayItems) {
                    const nextKey = tooltipOpenKey === dateStr ? null : dateStr;
                    tooltipAnchorRef.current = nextKey ? e.currentTarget : null;
                    setTooltipOpenKey(nextKey);
                  }
                  onDateClick(dateStr);
                  return;
                }
                onDateClick(dateStr);
              }}
              onMouseEnter={(e) => {
                if (suppressHoverDuringScrollRef.current) return;
                if (!isDesktopHoverMode || !dateStr) return;
                setHoveredDateStr(dateStr);
                if (hasDayItems) {
                  tooltipAnchorRef.current = e.currentTarget;
                  setTooltipOpenKey(dateStr);
                  return;
                }
                tooltipAnchorRef.current = null;
                setTooltipOpenKey(null);
              }}
              onMouseLeave={(e) => {
                if (suppressHoverDuringScrollRef.current) return;
                if (!isDesktopHoverMode) return;
                const related = e.relatedTarget;
                if (
                  related instanceof Element &&
                  (related.closest("[data-mini-calendar-trigger]") ||
                    related.closest("[data-mini-calendar-tooltip]"))
                ) {
                  return;
                }
                setHoveredDateStr(null);
                setTooltipOpenKey(null);
                tooltipAnchorRef.current = null;
              }}
              onMouseDown={(e) => {
                // Keep desktop focus suppression without affecting touch click synthesis on iOS.
                if (isDesktopHoverMode) e.preventDefault();
              }}
              onFocus={(e) => {
                // Keep focus suppression on hover devices only.
                if (isDesktopHoverMode) e.currentTarget.blur();
              }}
              className={`calendar-date-cell flex flex-col ${miniCalendarCellFrame} items-center justify-center text-sm font-semibold cursor-pointer transition-none touch-manipulation select-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:shadow-none focus-visible:shadow-none [&:focus]:ring-0 [&:focus-visible]:ring-0 [&:focus]:shadow-none [&:focus-visible]:shadow-none [&:focus]:outline-none [&:focus-visible]:outline-none ${dayColor} ${isHighlighted ? highlightColor : ''} ${isSelected ? `ring-2 ${ringColor}` : ''} ${isCurrentDate(day) && isCurrentDateInRange ? borderColor : 'border border-transparent'} ${textClass}`}
              tabIndex={-1}
              suppressHydrationWarning
            >
              <div suppressHydrationWarning>{day}</div>
              <div suppressHydrationWarning>{getIndicatorDots(day)}</div>
            </div>
          );

          return (
            <div key={index} suppressHydrationWarning>
              {calendarCell}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const GridView = memo(function GridView({ 
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
  showCountdown,
  onMonthChange,
  selectedStates = [],
  initialCurrentDate,
  initialLectureWeekByDate = null,
  holidaysByDate = {},
}: GridViewProps) {
  const hydrationServerVersion = useCalendarHydrationVersion();
  const calendarDataVersion = useSyncExternalStore(
    subscribe,
    () => getSnapshot().version,
    () => hydrationServerVersion
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tooltipOpenKey, setTooltipOpenKey] = useState<string | null>(null);
  const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null);
  const tooltipAnchorRef = useRef<HTMLElement | null>(null);
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
  const [drawerDateKey, setDrawerDateKey] = useState<string | null>(null);
  const drawerListScrollElRef = useRef<HTMLDivElement | null>(null);
  const [drawerCurrentDateStr, setDrawerCurrentDateStr] = useState<string | null>(initialCurrentDate ?? null);
  const drawerSwipeGestureRef = useRef<{
    startX: number | null;
    startY: number | null;
    tracking: boolean;
  }>({ startX: null, startY: null, tracking: false });
  const drawerSwipeCleanupRef = useRef<(() => void) | null>(null);
  const isMobileViewport = useMobileViewport();
  const { recordEngagementAction } = useEngagementPrompt();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const getMalaysiaDate = () => {
      const now = new Date();
      const malaysiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kuala_Lumpur' }));
      const year = malaysiaTime.getFullYear();
      const month = String(malaysiaTime.getMonth() + 1).padStart(2, '0');
      const day = String(malaysiaTime.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    setDrawerCurrentDateStr(getMalaysiaDate());
    const interval = setInterval(() => {
      setDrawerCurrentDateStr(getMalaysiaDate());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenActivityDrawer = (dateStr: string) => {
    setDrawerDateKey(dateStr);
    setSelectedDate(dateStr);
    recordEngagementAction('grid_cell_open');
    trackZarazEvent(ZARAZ_EVENTS.viewCalendarDate, {
      date: dateStr,
      program: selectedProgram,
      session_ids: selectedSessions.join(','),
      view: 'grid',
    });
  };

  useEffect(() => {
    if (!isMobileViewport) setDrawerDateKey(null);
  }, [isMobileViewport]);

  const suppressHoverDuringScrollRef = useRef(false);
  const scrollSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SCROLL_SETTLE_MS = 160;

    const onScrollActivity = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-mini-calendar-tooltip]')) return;
      const wasSuppressed = suppressHoverDuringScrollRef.current;
      suppressHoverDuringScrollRef.current = true;
      if (!wasSuppressed) {
        setHoveredDateStr(null);
        setTooltipOpenKey(null);
        tooltipAnchorRef.current = null;
      }
      if (scrollSettleTimerRef.current) clearTimeout(scrollSettleTimerRef.current);
      scrollSettleTimerRef.current = setTimeout(() => {
        suppressHoverDuringScrollRef.current = false;
        scrollSettleTimerRef.current = null;
      }, SCROLL_SETTLE_MS);
    };

    const opts: AddEventListenerOptions = { passive: true, capture: true };
    window.addEventListener('wheel', onScrollActivity, opts);
    window.addEventListener('scroll', onScrollActivity, opts);
    window.addEventListener('touchmove', onScrollActivity, opts);

    return () => {
      window.removeEventListener('wheel', onScrollActivity, opts);
      window.removeEventListener('scroll', onScrollActivity, opts);
      window.removeEventListener('touchmove', onScrollActivity, opts);
      if (scrollSettleTimerRef.current) clearTimeout(scrollSettleTimerRef.current);
    };
  }, []);

  const months = useMemo(
    () => {
      if (calendarDataVersion < 0) return [];
      return getMonthsForSessions(selectedSessions, {
        selectedProgram,
        showRegistration,
        showLecture,
        showExamination,
        showOthersExams,
        showBreak,
        showSemesterPendek,
        showKuliahIntersesi,
        showKKT,
      });
    },
    [
      selectedSessions,
      selectedProgram,
      showRegistration,
      showLecture,
      showExamination,
      showOthersExams,
      showBreak,
      showSemesterPendek,
      showKuliahIntersesi,
      showKKT,
      calendarDataVersion,
    ]
  );

  const gridFilterOptions = useMemo<ActivityFilterOptions>(
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

  const activityDateKeys = useMemo<string[]>(() => {
    if (calendarDataVersion < 0 || selectedSessions.length === 0) return [];
    const keys: string[] = [];
    for (const { month, year } of months) {
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const activities = getActivitiesForDateMultiSessions(dateStr, selectedSessions, showKKT, gridFilterOptions);
        const holidays = holidaysByDate[dateStr] ?? [];
        if (activities.length > 0 || holidays.length > 0) keys.push(dateStr);
      }
    }
    return keys;
  }, [months, selectedSessions, showKKT, gridFilterOptions, calendarDataVersion, holidaysByDate]);

  const drawerActivities = useMemo<Activity[]>(() => {
    if (calendarDataVersion < 0 || !drawerDateKey) return [];
    return resolveDayActivitiesForDrawer(drawerDateKey, selectedSessions, showKKT, gridFilterOptions, selectedProgram);
  }, [drawerDateKey, selectedSessions, showKKT, gridFilterOptions, selectedProgram, calendarDataVersion]);

  const activeTooltipData = useMemo(() => {
    if (calendarDataVersion < 0 || !tooltipOpenKey) return null;
    const activities = resolveDayActivitiesForDrawer(
      tooltipOpenKey,
      selectedSessions,
      showKKT,
      gridFilterOptions,
      selectedProgram
    );
    const holidays = holidaysByDate[tooltipOpenKey] ?? [];
    if (activities.length === 0 && holidays.length === 0) return null;
    return { dateStr: tooltipOpenKey, activities, holidays };
  }, [
    tooltipOpenKey,
    selectedSessions,
    showKKT,
    gridFilterOptions,
    selectedProgram,
    calendarDataVersion,
    holidaysByDate,
  ]);

  const drawerNavIndex = drawerDateKey ? activityDateKeys.indexOf(drawerDateKey) : -1;

  const navigateDrawerActivityDate = (delta: -1 | 1) => {
    if (drawerNavIndex < 0) return;
    const nextKey = activityDateKeys[drawerNavIndex + delta];
    if (!nextKey) return;
    setDrawerDateKey(nextKey);
    setSelectedDate(nextKey);
    recordEngagementAction('grid_drawer_nav');
    trackZarazEvent(ZARAZ_EVENTS.navigateCalendarDay, {
      date: nextKey,
      direction: delta === 1 ? 'next' : 'prev',
      program: selectedProgram,
      session_ids: selectedSessions.join(','),
    });
  };

  const navigateDrawerActivityDateRef = useRef(navigateDrawerActivityDate);

  useEffect(() => {
    navigateDrawerActivityDateRef.current = navigateDrawerActivityDate;
  });

  const setDrawerSwipeAreaRef = useCallback((node: HTMLDivElement | null) => {
    drawerListScrollElRef.current = node;
    if (drawerSwipeCleanupRef.current) {
      drawerSwipeCleanupRef.current();
      drawerSwipeCleanupRef.current = null;
    }
    if (!node) return;

    const SWIPE_COMMIT_PX = 40;
    const SWIPE_HORIZONTAL_RATIO = 1.2;
    const SWIPE_LOCK_PX = 12;

    const resetGesture = () => {
      drawerSwipeGestureRef.current = { startX: null, startY: null, tracking: false };
    };

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      drawerSwipeGestureRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        tracking: true,
      };
    };

    const onTouchMove = (event: TouchEvent) => {
      const { startX, startY, tracking } = drawerSwipeGestureRef.current;
      if (!tracking || startX == null || startY == null) return;
      const touch = event.touches[0];
      if (!touch) return;
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      if (
        Math.abs(deltaX) > SWIPE_LOCK_PX &&
        Math.abs(deltaX) > Math.abs(deltaY) * SWIPE_HORIZONTAL_RATIO
      ) {
        event.preventDefault();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      const { startX, startY, tracking } = drawerSwipeGestureRef.current;
      resetGesture();
      if (!tracking || startX == null || startY == null) return;
      const touch = event.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const isHorizontalSwipe =
        Math.abs(deltaX) > SWIPE_COMMIT_PX &&
        Math.abs(deltaX) > Math.abs(deltaY) * SWIPE_HORIZONTAL_RATIO;
      if (!isHorizontalSwipe) return;

      if (deltaX > 0) navigateDrawerActivityDateRef.current(-1);
      else navigateDrawerActivityDateRef.current(1);
    };

    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchmove', onTouchMove, { passive: false });
    node.addEventListener('touchend', onTouchEnd, { passive: true });
    node.addEventListener('touchcancel', resetGesture, { passive: true });

    drawerSwipeCleanupRef.current = () => {
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchmove', onTouchMove);
      node.removeEventListener('touchend', onTouchEnd);
      node.removeEventListener('touchcancel', resetGesture);
      resetGesture();
    };
  }, []);

  useEffect(() => {
    return () => {
      drawerSwipeCleanupRef.current?.();
      drawerSwipeCleanupRef.current = null;
    };
  }, []);

  return (
    <>
      <div className="space-y-8 transition-none" style={{ transition: 'none' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-max transition-none" style={{ transition: 'none' }}>
          {months.map(({ month, year }) => (
            <MiniCalendar
              key={`${year}-${month}`}
              month={month}
              year={year}
              selectedProgram={selectedProgram}
              selectedSessions={selectedSessions}
              showKKT={showKKT}
              onDateClick={setSelectedDate}
              selectedDate={selectedDate}
              showRegistration={showRegistration}
              showLecture={showLecture}
              showSemesterPendek={showSemesterPendek}
              showKuliahIntersesi={showKuliahIntersesi}
              showExamination={showExamination}
              showOthersExams={showOthersExams}
              showBreak={showBreak}
              showCountdown={showCountdown}
              selectedStates={selectedStates}
              initialCurrentDate={initialCurrentDate}
              tooltipOpenKey={tooltipOpenKey}
              hoveredDateStr={hoveredDateStr}
              setTooltipOpenKey={setTooltipOpenKey}
              setHoveredDateStr={setHoveredDateStr}
              tooltipAnchorRef={tooltipAnchorRef}
              calendarDataVersion={calendarDataVersion}
              suppressHoverDuringScrollRef={suppressHoverDuringScrollRef}
              lectureWeekByDate={lectureWeekByDate}
              useDayActivityDrawer={isMobileViewport}
              onOpenActivityDrawer={handleOpenActivityDrawer}
              holidaysByDate={holidaysByDate}
            />
          ))}
        </div>
      </div>
      {!isMobileViewport && activeTooltipData ? (
        <Tooltip
          open
          onOpenChange={(open) => {
            if (open) return;
            setTooltipOpenKey(null);
            setHoveredDateStr(null);
            tooltipAnchorRef.current = null;
          }}
        >
          <TooltipContent
            suppressHydrationWarning
            anchor={tooltipAnchorRef}
            data-mini-calendar-tooltip={activeTooltipData.dateStr}
            side="top"
            className="flex w-auto max-w-[300px] flex-col items-start gap-2 overflow-hidden px-3 py-2 sm:max-w-[330px] mx-2 rounded-lg shadow-lg border border-border bg-popover text-popover-foreground"
            sideOffset={8}
            collisionPadding={12}
            style={
              { pointerEvents: 'auto' } as React.CSSProperties & {
                '--transform-origin'?: string;
              }
            }
          >
            <GridDayActivitiesPanel
              dateStr={activeTooltipData.dateStr}
              activities={activeTooltipData.activities}
              weekNum={lectureWeekByDate?.get(activeTooltipData.dateStr) ?? null}
              selectedProgram={selectedProgram}
              showCountdown={showCountdown}
              currentDateStr={drawerCurrentDateStr}
              showKKT={showKKT}
              surface="tooltip"
              holidays={activeTooltipData.holidays}
            />
          </TooltipContent>
        </Tooltip>
      ) : null}
      <KeyboardAwareDrawer
        open={drawerDateKey != null}
        onOpenChange={(open) => {
          if (!open) setDrawerDateKey(null);
        }}
      >
        <DrawerContent className={activityDrawerContentClassName}>
          <div
            data-grid-activity-drawer-body
            className={cn(
              drawerBodyClassName,
              activityDrawerBodyClassName,
              'min-h-0 gap-0 px-0'
            )}
          >
            {drawerDateKey ? (
              <>
                <div
                  data-slot="drawer-no-drag"
                  data-base-ui-swipe-ignore=""
                  className="w-full shrink-0 px-4 pt-0"
                >
                  <DrawerTitle className="min-w-0 w-full text-center">
                    {formatDateLabel(drawerDateKey)}
                  </DrawerTitle>
                  <DrawerDescription className="sr-only border-0 shadow-none">
                    Activities for the selected date. Swipe left or right to change day.
                  </DrawerDescription>
                </div>
                <ActivityDrawerAnimatedSection
                  animateKey={`${drawerDateKey}-${drawerActivities.length}-${lectureWeekByDate?.get(drawerDateKey) ?? 'none'}`}
                  className={cn(
                    'w-full min-w-0 max-w-full px-4',
                    drawerSafeAreaBottomClassName
                  )}
                >
                  <GridDayActivitiesPanel
                    dateStr={drawerDateKey}
                    activities={drawerActivities}
                    weekNum={lectureWeekByDate?.get(drawerDateKey) ?? null}
                    selectedProgram={selectedProgram}
                    showCountdown={showCountdown}
                    currentDateStr={drawerCurrentDateStr}
                    showKKT={showKKT}
                    surface="drawer"
                    listScrollRef={setDrawerSwipeAreaRef}
                    listScrollable
                    holidays={holidaysByDate[drawerDateKey] ?? []}
                  />
                </ActivityDrawerAnimatedSection>
              </>
            ) : null}
          </div>
        </DrawerContent>
      </KeyboardAwareDrawer>
    </>
  );
});
