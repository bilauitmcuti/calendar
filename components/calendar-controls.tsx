'use client';

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LeftToRightListBulletIcon,
  Settings01Icon,
  Calendar04Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Message01Icon,
} from "@hugeicons/core-free-icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  formatGroupASessionTriggerLabel,
  formatSessionLabelWithId,
  getProgramOptions,
  getActivitiesForSession,
  getSessionOptionsForGroup,
} from '@/lib/data';
import { useCalendarHydrationVersion } from '@/components/calendar-hydration-context';
import { getSnapshot, subscribe } from '@/lib/calendar-store';
import type { SessionId } from '@/lib/data';
import { getLabelForProgramValue, getRoutePath } from '@/lib/route-utils';
import { replaceCalendarHistoryUrl } from '@/lib/share-url';
import type { ViewMode } from '@/app/page';
import type { ProgramValue } from '@/lib/route-utils';
import { sessionSubmenuItemClass } from '@/lib/session-submenu-item-class';
import {
  activateSessionSubmenu,
  handleProgramDropdownRootOpenChange,
  handleSessionSubmenuOpenChange,
} from '@/lib/session-submenu-open-change';

import { SessionSubmenuItemLabel } from '@/components/session-submenu-item-label';
import { useEngagementPrompt } from '@/components/engagement-prompt';
import { usePwaInstalled } from '@/hooks/use-pwa-installed';
import { SettingsSwitchRow } from '@/components/ui/settings-switch-row';
import { SettingsMoreMenu } from '@/components/calendar/settings-more-menu';
import { drawerPrimaryButtonClassName } from '@/components/ui/drawer';

const KKT_FLAG_IMAGES = [
  { src: '/flags/kedah.webp', alt: 'Kedah' },
  { src: '/flags/kelantan.webp', alt: 'Kelantan' },
  { src: '/flags/terengganu.webp', alt: 'Terengganu' },
] as const;
interface CalendarControlsProps {
  selectedProgram: string;
  selectedSessions: SessionId[];
  onProgramSessionChange?: (program: ProgramValue, sessionIds: SessionId[]) => void;
  viewMode: ViewMode;
  isHomepage?: boolean;
  /** When true, use fixed positioning so controls appear at top from first paint (scroll restore) */
  forceFixed?: boolean;
  /** When provided, view mode switch uses client state instead of router navigation (no appear effect) */
  onViewModeChange?: (mode: ViewMode) => void;
  showKKT: boolean;
  onShowKKTChange: (show: boolean) => void;
  showRegistration: boolean;
  onShowRegistrationChange: (show: boolean) => void;
  showLecture: boolean;
  onShowLectureChange: (show: boolean) => void;
  showExamination: boolean;
  onShowExaminationChange: (show: boolean) => void;
  showOthersExams: boolean;
  onShowOthersExamsChange: (show: boolean) => void;
  showBreak: boolean;
  onShowBreakChange: (show: boolean) => void;
  showSemesterPendek: boolean;
  onShowSemesterPendekChange: (show: boolean) => void;
  showKuliahIntersesi: boolean;
  onShowKuliahIntersesiChange: (show: boolean) => void;
  currentMonth?: string;
}

export function CalendarControls({
  selectedProgram,
  selectedSessions,
  onProgramSessionChange,
  viewMode,
  isHomepage = false,
  forceFixed = false,
  onViewModeChange,
  showKKT,
  onShowKKTChange,
  showRegistration,
  onShowRegistrationChange,
  showLecture,
  onShowLectureChange,
  showExamination,
  onShowExaminationChange,
  showOthersExams,
  onShowOthersExamsChange,
  showBreak,
  onShowBreakChange,
  showSemesterPendek,
  onShowSemesterPendekChange,
  showKuliahIntersesi,
  onShowKuliahIntersesiChange,
  currentMonth = 'Academic Calendar',
}: CalendarControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const keepDropdownOpenRef = useRef(false);
  const submenuSwitchingRef = useRef(false);
  const overlayOpenScrollYRef = useRef(0);
  const chatPrefetchedRef = useRef(false);
  const isPWAInstalled = usePwaInstalled();
  const { recordEngagementAction } = useEngagementPrompt();

  const prefetchChatDocument = useCallback(() => {
    if (chatPrefetchedRef.current) return;
    chatPrefetchedRef.current = true;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/chat';
    link.as = 'document';
    document.head.appendChild(link);
  }, []);

  const onFilterToggle = useCallback(
    (checked: boolean, handler: (value: boolean) => void) => {
      handler(checked);
      recordEngagementAction('filter_toggle');
    },
    [recordEngagementAction]
  );

  const hydrationServerVersion = useCalendarHydrationVersion();
  const calendarDataVersion = useSyncExternalStore(
    subscribe,
    () => getSnapshot().version,
    () => hydrationServerVersion
  );
  const programOptions = useMemo(() => {
    void calendarDataVersion;
    return getProgramOptions();
  }, [calendarDataVersion]);

  // Optimized prefetch strategy - delay prefetch until user interaction
  useEffect(() => {
    // Delay prefetch to not block initial render
    const timeoutId = setTimeout(() => {
      // Only prefetch adjacent routes for faster switching
      programOptions.slice(0, 3).forEach((option) => {
        const currentPath = getRoutePath(option.value as ProgramValue, viewMode);
        router.prefetch(currentPath);
      });
    }, 1000); // Delay 1 second after mount
    
    return () => clearTimeout(timeoutId);
  }, [router, viewMode, programOptions]);

  // Toggle session in multi-select; keep at least one selected
  const handleSessionToggle = useCallback((programValue: ProgramValue, sessionId: SessionId, group: 'A' | 'B') => {
    const inGroup = selectedSessions.filter((id) => id.startsWith(`${group}-`));
    const isSelected = inGroup.includes(sessionId);
    let next: SessionId[];
    if (isSelected && inGroup.length > 1) {
      next = inGroup.filter((id) => id !== sessionId);
    } else if (!isSelected) {
      next = [...inGroup, sessionId];
    } else {
      next = inGroup;
    }
    if (onProgramSessionChange) {
      onProgramSessionChange(programValue, next);
    } else {
      const newPath = getRoutePath(programValue, viewMode);
      if (newPath !== pathname) {
        replaceCalendarHistoryUrl(newPath);
      }
    }
    recordEngagementAction('session_change');
  }, [onProgramSessionChange, selectedSessions, pathname, viewMode, recordEngagementAction]);

  // Switch program only (parent resolves sessions from sessionsByProgram)
  const handleProgramSelect = useCallback((program: ProgramValue) => {
    if (onProgramSessionChange) {
      onProgramSessionChange(program, []);
    } else {
      const newPath = getRoutePath(program, viewMode);
      if (newPath !== pathname) {
        replaceCalendarHistoryUrl(newPath);
      }
    }
    recordEngagementAction('program_change');
  }, [onProgramSessionChange, pathname, viewMode, recordEngagementAction]);

  // Handle view mode change - use callback if provided (client state, no appear effect), else router
  const handleViewModeChange = useCallback(
    (newViewMode: ViewMode) => {
      if (onViewModeChange) {
        onViewModeChange(newViewMode);
      } else {
        const programValue = selectedProgram as ProgramValue;
        const newPath = getRoutePath(programValue, newViewMode);
        router.replace(newPath, { scroll: false });
      }
      recordEngagementAction('view_mode_change');
    },
    [onViewModeChange, router, selectedProgram, recordEngagementAction]
  );

  // Memoize filtered program options to avoid recalculation
  const groupAOptions = useMemo(() => programOptions.filter(p => p.group === 'A'), [programOptions]);
  const groupBOptions = useMemo(() => programOptions.filter(p => p.group === 'B'), [programOptions]);
  const groupBProgramForSessions = groupBOptions.some((p) => p.value === selectedProgram)
    ? (selectedProgram as ProgramValue)
    : ('All' as ProgramValue);
  const groupBSessionLabel = useMemo(() => {
    const isGroupASelected = groupAOptions.some((option) => option.value === selectedProgram);
    if (isGroupASelected) return '';
    const labels = selectedSessions
      .filter((sessionId) => sessionId.startsWith('B-'))
      .map((sessionId) => {
        const session = getSessionOptionsForGroup('B').find((item) => item.id === sessionId);
        return session ? formatSessionLabelWithId(session) : sessionId;
      });
    if (labels.length === 0) return 'Select sessions';
    if (labels.length === 1) return labels[0];
    return `${labels.length} Selected`;
  }, [groupAOptions, selectedProgram, selectedSessions]);

  // Memoize current program and session labels
  const currentProgramLabel = useMemo(() => {
    if (selectedProgram === 'All') return 'All';
    const fromApi = programOptions.find((p) => p.value === selectedProgram)?.label;
    if (fromApi) return fromApi;
    return getLabelForProgramValue(selectedProgram as ProgramValue);
  }, [selectedProgram, programOptions]);
  
  // Theme-aware classes
  const bgClass = 'bg-background';
  /** Shared chrome for program selector + icon toolbar — single source of truth (matches right button group). */
  const calendarControlClusterSurface =
    'rounded-lg border border-border bg-secondary dark:bg-[#2A2A2A] shadow-none transition-none';
  const textClass = 'text-foreground';
  const iconInactiveClass = 'text-muted-foreground [&_svg]:text-muted-foreground';
  const iconActiveClass = 'text-foreground [&_svg]:text-foreground';
  const iconBaseClass = 'nav-icon-btn bg-transparent hover:!bg-transparent dark:hover:!bg-transparent transition-none !h-[38px] !w-[38px] !min-h-[38px] !max-h-[38px] !p-0 flex items-center justify-center hover:!h-[38px] hover:!min-h-[38px] hover:!max-h-[38px] hover:!p-0 active:!h-[38px] active:!min-h-[38px] active:!max-h-[38px] active:!p-0 [&:hover]:!h-[38px] [&:hover]:!bg-transparent [&:active]:!h-[38px]';

  // Memoize activity type checks from all selected sessions
  const sessionActivities = useMemo(() => {
    void calendarDataVersion;
    return selectedSessions.flatMap((sid) => getActivitiesForSession(sid));
  }, [selectedSessions, calendarDataVersion]);
  const activityChecks = useMemo(() => ({
    hasSemesterPendek: sessionActivities.some(
      a => a.type === 'lecture' && (a.name.includes('Short Semester') || a.name.includes('Semester Pendek'))
    ),
    hasKuliahIntersesi: sessionActivities.some(
      a => a.type === 'lecture' && (a.name.includes('Intersession Classes') || a.name.includes('Intersesi'))
    ),
    hasOthersExams: sessionActivities.some(
      a => a.type === 'examination' && a.name.includes('Khas')
    ),
    hasRegionalDateRange: sessionActivities.some(
      a => Boolean(a.regionalStartDate || a.regionalEndDate)
    ),
  }), [sessionActivities]);
  
  const { hasSemesterPendek, hasKuliahIntersesi, hasOthersExams, hasRegionalDateRange } = activityChecks;

  useEffect(() => {
    if (!hasRegionalDateRange && showKKT) onShowKKTChange(false);
  }, [hasRegionalDateRange, showKKT, onShowKKTChange]);

  // Warm the flag cache before Settings opens so AvatarFallback never flashes.
  useEffect(() => {
    if (!hasRegionalDateRange) return;
    for (const { src } of KKT_FLAG_IMAGES) {
      const img = new Image();
      img.src = src;
    }
  }, [hasRegionalDateRange]);

  useEffect(() => {
    if (!isOpen && !dropdownOpen) return;
    overlayOpenScrollYRef.current = window.scrollY;
  }, [isOpen, dropdownOpen]);

  useEffect(() => {
    const handleScroll = () => {
      if (!isOpen && !dropdownOpen) return;
      const hasMeaningfulScroll = Math.abs(window.scrollY - overlayOpenScrollYRef.current) > 8;
      if (!hasMeaningfulScroll) return;

      if (isOpen) setIsOpen(false);
      if (dropdownOpen) {
        setDropdownOpen(false);
        setActiveSubmenu(null);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOpen, dropdownOpen]);

  const positionClass = forceFixed
    ? 'fixed top-0 left-1/2 -translate-x-1/2 z-[60] w-full max-w-[1000px]'
    : 'sticky top-0 z-40';
  const stabilityClass = forceFixed ? 'calendar-controls-fixed' : 'calendar-controls-sticky';

  return (
      <div 
        className={`${positionClass} -mx-4 sm:-mx-6 lg:-mx-4 px-4 sm:px-6 lg:px-4 transition-none relative overflow-visible ${stabilityClass}`} 
        suppressHydrationWarning
      >
        <div 
          className={`flex flex-row items-center justify-between gap-4 pt-8 w-full px-0 min-h-14 pb-6 -mb-6 scroll-fade-b scroll-fade-6 calendar-controls-scroll-fade ${bgClass} transition-none`} 
          suppressHydrationWarning
          style={{ transition: 'none' }}
        >
        {/* Program + Session selector - Left */}
        <div className="px-0">
          <div className="inline-flex -m-1 p-1">
            <DropdownMenu
            open={dropdownOpen}
            onOpenChange={(open, details) =>
              handleProgramDropdownRootOpenChange(open, details, {
                activeSubmenu,
                keepDropdownOpenRef,
                setDropdownOpen,
                setActiveSubmenu,
              })
            }
          >
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className={`inline-flex shrink-0 cursor-pointer items-center justify-between gap-1.5 px-2.5 text-sm font-medium whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${calendarControlClusterSurface} h-[38px] w-fit min-w-0 max-w-[180px] sm:max-w-[260px] md:max-w-[300px] ${textClass}`}
                  suppressHydrationWarning
                />
              }
            >
                <span className="block min-w-0 flex-1 truncate text-left font-medium text-sm">
                  {currentProgramLabel}
                </span>
                {dropdownOpen ? (
                  <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-4 shrink-0" aria-hidden />
                ) : (
                  <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4 shrink-0" aria-hidden />
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[260px] overflow-visible pt-4 pb-4 pl-3 pr-3 bg-popover dark:bg-[#2A2A2A]" align="start">
              <div className="-mx-1 px-1">
                {/* Group A */}
                <div className="mb-2">
                  <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">GROUP A</div>
                  {groupAOptions.map((option) => {
                    const groupASessionSummary = formatGroupASessionTriggerLabel(
                      option.value,
                      selectedProgram,
                      selectedSessions
                    );
                    return (
                    <DropdownMenuSub
                      key={option.value}
                      open={activeSubmenu === option.value}
                      onOpenChange={(open, details) =>
                        handleSessionSubmenuOpenChange(
                          option.value,
                          setActiveSubmenu,
                          open,
                          details,
                          submenuSwitchingRef
                        )
                      }
                    >
                      <DropdownMenuSubTrigger
                        className="relative w-full max-w-full min-w-0 cursor-pointer items-center justify-between gap-0 rounded-md px-2 py-1.5"
                        onPointerDown={() =>
                          activateSessionSubmenu(
                            option.value,
                            setActiveSubmenu,
                            keepDropdownOpenRef,
                            submenuSwitchingRef
                          )
                        }
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                          <span
                            className={`min-w-0 truncate font-medium text-sm ${
                              option.value === selectedProgram ? 'text-primary' : textClass
                            }`}
                          >
                            {option.label}
                          </span>
                          {groupASessionSummary ? (
                            <span className="min-w-0 truncate text-xs text-muted-foreground leading-snug whitespace-nowrap">
                              {groupASessionSummary}
                            </span>
                          ) : null}
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent
                          collisionPadding={{ top: 8, right: 28, bottom: 8, left: 8 }}
                          className="min-w-[200px] bg-popover dark:bg-[#2A2A2A]"
                        >
                          {getSessionOptionsForGroup('A').map((sess) => {
                            const isSelected = selectedSessions.includes(sess.id);
                            return (
                              <DropdownMenuItem
                                key={sess.id}
                                closeOnClick={false}
                                className={sessionSubmenuItemClass(isSelected)}
                                onClick={() =>
                                  handleSessionToggle(option.value as ProgramValue, sess.id, 'A')
                                }
                              >
                                <span
                                  className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 flex size-3 shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}
                                  aria-hidden
                                />
                                <SessionSubmenuItemLabel session={sess} />
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    );
                  })}
                </div>
              </div>
              <div className="my-2 h-px bg-border -mx-3 w-[calc(100%+1.5rem)]" />
              <div className="-mx-1 px-1">
                {/* Group B: Session list, separator, program list */}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">GROUP B</div>
                  <DropdownMenuSub
                    open={activeSubmenu === 'group-b-sessions'}
                    onOpenChange={(open, details) =>
                      handleSessionSubmenuOpenChange(
                        'group-b-sessions',
                        setActiveSubmenu,
                        open,
                        details,
                        submenuSwitchingRef
                      )
                    }
                  >
                    <DropdownMenuSubTrigger
                      className="cursor-pointer items-start"
                      onPointerDown={() =>
                        activateSessionSubmenu(
                          'group-b-sessions',
                          setActiveSubmenu,
                          keepDropdownOpenRef,
                          submenuSwitchingRef
                        )
                      }
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1 text-left pr-1">
                        <span className="font-medium text-sm">Sessions</span>
                        <span className="min-w-0 text-xs text-muted-foreground text-balance leading-snug">
                          {groupBSessionLabel}
                        </span>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent
                        collisionPadding={{ top: 8, right: 28, bottom: 8, left: 8 }}
                        className="min-w-[220px] bg-popover dark:bg-[#2A2A2A]"
                      >
                        {getSessionOptionsForGroup('B').map((sess) => {
                          const isSelected = selectedSessions.includes(sess.id);
                          return (
                            <DropdownMenuItem
                              key={sess.id}
                              closeOnClick={false}
                              className={sessionSubmenuItemClass(isSelected)}
                              onClick={() =>
                                handleSessionToggle(groupBProgramForSessions, sess.id, 'B')
                              }
                            >
                              <span
                                className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 flex size-3 shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}
                                aria-hidden
                              />
                              <SessionSubmenuItemLabel session={sess} />
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                    </DropdownMenuSub>
                  {/* Program list - direct click */}
                  {groupBOptions.map((option, index) => (
                    <DropdownMenuItem
                      key={option.value}
                      className={`relative cursor-pointer pr-8 font-medium text-sm ${index === 0 ? 'mt-2' : ''} ${option.value === selectedProgram ? 'text-primary' : ''}`}
                      onClick={() => {
                        setActiveSubmenu(null);
                        setDropdownOpen(false);
                        handleProgramSelect(option.value as ProgramValue);
                      }}
                    >
                      {option.label}
                      {option.value === selectedProgram ? (
                        <span
                          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex size-3 shrink-0 items-center justify-center rounded-full border border-primary bg-primary"
                          aria-hidden
                        />
                      ) : null}
                    </DropdownMenuItem>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
        {/* View controls and Settings combined - Right */}
        <div className="px-0 flex items-center justify-center">
          <div 
            className={`flex items-center justify-center gap-0 p-1 w-fit h-[38px] ${calendarControlClusterSurface}`}
            suppressHydrationWarning
            style={{ transition: 'none' }}
          >
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => handleViewModeChange('grid')}
              className={`${iconBaseClass} ${viewMode === 'grid' ? iconActiveClass : iconInactiveClass}`}
              title="Grid View"
              suppressHydrationWarning
            >
              <HugeiconsIcon icon={Calendar04Icon} strokeWidth={2} className="h-6 w-6" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => handleViewModeChange('list')}
              className={`${iconBaseClass} ${viewMode === 'list' ? iconActiveClass : iconInactiveClass}`}
              title="List View"
              suppressHydrationWarning
            >
              <HugeiconsIcon icon={LeftToRightListBulletIcon} strokeWidth={2} className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              render={<a href="/chat" />}
              nativeButton={false}
              onPointerEnter={prefetchChatDocument}
              onFocus={prefetchChatDocument}
              className={`${iconBaseClass} ${iconInactiveClass}`}
              title="Chat"
              suppressHydrationWarning
            >
              <HugeiconsIcon icon={Message01Icon} strokeWidth={2} className="h-6 w-6" />
            </Button>
            <Popover open={isOpen} onOpenChange={(open) => {
              setIsOpen(open);
              if (open) recordEngagementAction('settings_open');
            }}>
              <PopoverTrigger
                render={
                  <Button
                    variant={isOpen ? 'secondary' : 'ghost'}
                    size="icon"
                    className={`${iconBaseClass} ${isOpen ? iconActiveClass : iconInactiveClass}`}
                    title="Settings"
                    suppressHydrationWarning
                  />
                }
              >
                <HugeiconsIcon icon={Settings01Icon} strokeWidth={2} className="h-6 w-6" />
              </PopoverTrigger>
              <PopoverContent 
                className="h-auto w-[260px] sm:w-[300px] gap-3 pt-4 pb-4 pl-3 pr-3 z-50 bg-popover dark:bg-[#2A2A2A] transition-none"
                side="bottom"
                align="end"
                sideOffset={4}
                alignOffset={-5}
              >
                <div className="space-y-3 transition-none">
                  {/* Activity Type Toggles */}
                  <div className="space-y-2 transition-none">
                    <SettingsSwitchRow
                      label="Registration"
                      checked={showRegistration}
                      onChange={(checked) => onFilterToggle(checked, onShowRegistrationChange)}
                      ariaLabel="Toggle registration events"
                    />

                    <SettingsSwitchRow
                      label="Lecture"
                      checked={showLecture}
                      onChange={(checked) => onFilterToggle(checked, onShowLectureChange)}
                      ariaLabel="Toggle lecture events"
                    />

                    {hasSemesterPendek && (
                    <SettingsSwitchRow
                      label="Short Semester"
                      checked={showSemesterPendek}
                      onChange={(checked) => onFilterToggle(checked, onShowSemesterPendekChange)}
                      nested
                      ariaLabel="Toggle Short Semester events"
                    />
                    )}

                    {hasKuliahIntersesi && (
                    <SettingsSwitchRow
                      label="Intersession Classes"
                      checked={showKuliahIntersesi}
                      onChange={(checked) => onFilterToggle(checked, onShowKuliahIntersesiChange)}
                      nested
                      ariaLabel="Toggle Intersession Classes events"
                    />
                    )}

                    <SettingsSwitchRow
                      label="Examination"
                      checked={showExamination}
                      onChange={(checked) => onFilterToggle(checked, onShowExaminationChange)}
                      ariaLabel="Toggle examination events"
                    />

                    {hasOthersExams && (
                    <SettingsSwitchRow
                      label="Others Exams"
                      checked={showOthersExams}
                      onChange={(checked) => onFilterToggle(checked, onShowOthersExamsChange)}
                      nested
                      ariaLabel="Toggle others exams events"
                    />
                    )}

                    <SettingsSwitchRow
                      label="Breaks & Holidays"
                      checked={showBreak}
                      onChange={(checked) => onFilterToggle(checked, onShowBreakChange)}
                      ariaLabel="Toggle break events"
                    />
                  </div>

                  {hasRegionalDateRange && (
                  <SettingsSwitchRow
                    label={
                      <>
                        <span className="text-sm font-medium text-foreground">Show</span>
                        <div className="flex gap-1 pointer-events-none select-none">
                          {KKT_FLAG_IMAGES.map((flag) => (
                            <img
                              key={flag.src}
                              src={flag.src}
                              alt={flag.alt}
                              width={20}
                              height={20}
                              draggable={false}
                              decoding="async"
                              className="size-5 rounded-full object-cover"
                            />
                          ))}
                        </div>
                      </>
                    }
                    checked={showKKT}
                    onChange={(checked) => onFilterToggle(checked, onShowKKTChange)}
                    ariaLabel="Toggle Kedah, Kelantan, and Terengganu regional holidays"
                  />
                  )}

                  {/* Theme Toggle */}
                  <ThemeToggle />

                  <div className="flex flex-col gap-2">
                    <Button
                      size="default"
                      variant="default"
                      className={drawerPrimaryButtonClassName}
                      onClick={() => {
                        setIsOpen(false);
                        setMoreMenuOpen(true);
                      }}
                    >
                      More
                    </Button>
                    <p className="text-left text-xs text-muted-foreground">
                      Not affiliated with UiTM
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <SettingsMoreMenu
        open={moreMenuOpen}
        onOpenChange={setMoreMenuOpen}
        hideDownload={isPWAInstalled}
      />
    </div>
  );
}
