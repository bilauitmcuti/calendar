'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon, ArrowDown01Icon, ArrowUp01Icon, Copy01Icon } from "@hugeicons/core-free-icons"
import { toast } from 'sonner';

import { SessionSubmenuItemLabel } from '@/components/session-submenu-item-label';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import {
  calendarProgramQueryForRoute,
  FALLBACK_DEFAULT_SESSION_MAP,
  fetchCalendarSession,
  fetchMetaCached,
  type MetaResponse,
  type SessionOptionRow,
} from '@/lib/calendar-api';
import { formatSessionLabelWithId, type Activity, type SessionId } from '@/lib/data';
import type { FilterQueryKey } from '@/lib/filter-query';
import {
  getGroupFromProgram,
  normalizeSessionsForGroup,
} from '@/lib/session-memory';
import { sessionSubmenuItemClass } from '@/lib/session-submenu-item-class';
import {
  activateSessionSubmenu,
  handleProgramDropdownRootOpenChange,
  handleSessionSubmenuOpenChange,
} from '@/lib/session-submenu-open-change';
import { buildCalendarUrlPath } from '@/lib/session-query';
import {
  getLabelForProgramValue,
  getRoutePath,
  type ProgramValue,
} from '@/lib/route-utils';
import { copyTextToClipboard } from '@/lib/web-share';
import { cn } from '@/lib/utils';
import { trackZarazEvent, ZARAZ_EVENTS } from '@/lib/zaraz';

const FALLBACK_META: MetaResponse = {
  defaultSession: { ...FALLBACK_DEFAULT_SESSION_MAP },
  sessionOptions: [],
  programOptions: [],
};

const FILTER_OPTION_ROWS: {
  key: FilterQueryKey;
  label: string;
  always?: boolean;
}[] = [
  { key: 'registration', label: 'Registration', always: true },
  { key: 'lecture', label: 'Lecture', always: true },
  { key: 'short-sem', label: 'Short Semester' },
  { key: 'intersession', label: 'Intersession Classes' },
  { key: 'exam', label: 'Examination', always: true },
  { key: 'other-exam', label: 'Others Exams' },
  { key: 'break', label: 'Breaks & Holidays', always: true },
  { key: 'states', label: 'Kedah, Kelantan & Terengganu' },
];

/** Local-only catalogue — never writes to the shared calendar store. */
function defaultSessionFromMeta(meta: MetaResponse, group: 'A' | 'B'): SessionId {
  const fromMap = meta.defaultSession[group];
  if (meta.sessionOptions.some((s) => s.id === fromMap && s.group === group)) {
    return fromMap;
  }
  const opt = meta.sessionOptions.find((s) => s.group === group);
  if (opt) return opt.id;
  return group === 'A' ? FALLBACK_DEFAULT_SESSION_MAP.A : FALLBACK_DEFAULT_SESSION_MAP.B;
}

function sessionsForGroup(meta: MetaResponse, group: 'A' | 'B'): SessionOptionRow[] {
  return meta.sessionOptions.filter((s) => s.group === group);
}

function groupASessionSummary(
  programValue: string,
  selectedProgram: string,
  selectedSessions: SessionId[],
  sessionOptions: SessionOptionRow[]
): string {
  if (selectedProgram !== programValue) return '';
  const labels = selectedSessions
    .filter((sessionId) => sessionId.startsWith('A-'))
    .map((sessionId) => {
      const session = sessionOptions.find((item) => item.id === sessionId);
      return session ? formatSessionLabelWithId(session) : sessionId;
    });
  if (labels.length === 0) return 'Select sessions';
  if (labels.length === 1) return labels[0] ?? 'Select sessions';
  return `${labels.length} Selected`;
}

function filterAvailability(activities: Activity[]) {
  return {
    hasSemesterPendek: activities.some(
      (a) =>
        a.type === 'lecture' &&
        (a.name.includes('Short Semester') || a.name.includes('Semester Pendek'))
    ),
    hasKuliahIntersesi: activities.some(
      (a) =>
        a.type === 'lecture' &&
        (a.name.includes('Intersession Classes') || a.name.includes('Intersesi'))
    ),
    hasOthersExams: activities.some(
      (a) => a.type === 'examination' && a.name.includes('Khas')
    ),
    hasRegionalDateRange: activities.some(
      (a) => Boolean(a.regionalStartDate || a.regionalEndDate)
    ),
  };
}

function isFilterVisible(
  key: FilterQueryKey,
  checks: ReturnType<typeof filterAvailability>
): boolean {
  if (key === 'short-sem') return checks.hasSemesterPendek;
  if (key === 'intersession') return checks.hasKuliahIntersesi;
  if (key === 'other-exam') return checks.hasOthersExams;
  if (key === 'states') return checks.hasRegionalDateRange;
  return true;
}

export function ShareLinkGenerator() {
  const [meta, setLocalMeta] = useState<MetaResponse>(FALLBACK_META);
  const [sessionActivities, setSessionActivities] = useState<Record<string, Activity[]>>(
    {}
  );
  const [metaReady, setMetaReady] = useState(false);

  const [selectedProgram, setSelectedProgram] = useState<ProgramValue>('All');
  const [selectedSessions, setSelectedSessions] = useState<SessionId[]>([
    FALLBACK_DEFAULT_SESSION_MAP.B,
  ]);
  const [selectedFilterKeys, setSelectedFilterKeys] = useState<FilterQueryKey[]>([]);
  const [copied, setCopied] = useState(false);

  const [programMenuOpen, setProgramMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const keepDropdownOpenRef = useRef(false);
  const submenuSwitchingRef = useRef(false);

  const programOptions = meta.programOptions;
  const groupAOptions = useMemo(
    () => programOptions.filter((p) => p.group === 'A'),
    [programOptions]
  );
  const groupBOptions = useMemo(
    () => programOptions.filter((p) => p.group === 'B'),
    [programOptions]
  );
  const groupASessions = useMemo(() => sessionsForGroup(meta, 'A'), [meta]);
  const groupBSessions = useMemo(() => sessionsForGroup(meta, 'B'), [meta]);

  const groupBProgramForSessions = groupBOptions.some((p) => p.value === selectedProgram)
    ? selectedProgram
    : ('All' as ProgramValue);

  const activityChecks = useMemo(() => {
    const activities = selectedSessions.flatMap((sid) => sessionActivities[sid] ?? []);
    return filterAvailability(activities);
  }, [selectedSessions, sessionActivities]);

  const visibleFilterRows = useMemo(
    () =>
      FILTER_OPTION_ROWS.filter(
        (row) => row.always || isFilterVisible(row.key, activityChecks)
      ),
    [activityChecks]
  );

  useEffect(() => {
    const allowed = new Set(visibleFilterRows.map((row) => row.key));
    setSelectedFilterKeys((prev) => {
      const next = prev.filter((key) => allowed.has(key));
      return next.length === prev.length ? prev : next;
    });
  }, [visibleFilterRows]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let nextMeta = FALLBACK_META;
      try {
        const fetched = await fetchMetaCached({ entire: true });
        if (fetched.sessionOptions.length > 0) nextMeta = fetched;
      } catch {
        /* keep fallback */
      }
      if (cancelled) return;
      setLocalMeta(nextMeta);
      setSelectedSessions((prev) => {
        if (prev.length === 1 && prev[0] === FALLBACK_DEFAULT_SESSION_MAP.B) {
          return [defaultSessionFromMeta(nextMeta, 'B')];
        }
        return prev;
      });
      setMetaReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!metaReady || selectedSessions.length === 0) return;

    let cancelled = false;
    const group = getGroupFromProgram(selectedProgram);
    const programQ = calendarProgramQueryForRoute(selectedProgram);
    const targets = normalizeSessionsForGroup(selectedSessions, group);
    /** Cache key includes program for Group B (same session id, different program payload). */
    const cacheKeyFor = (sid: SessionId) =>
      group === 'B' ? `${sid}|${programQ ?? 'All'}` : sid;

    void (async () => {
      const merges: Record<string, Activity[]> = {};
      await Promise.all(
        targets.map(async (sid) => {
          const key = cacheKeyFor(sid);
          if ((sessionActivities[key] ?? sessionActivities[sid])?.length) return;
          try {
            const result = await fetchCalendarSession({
              sessionId: sid,
              group,
              program: group === 'B' ? (programQ ?? 'All') : undefined,
            });
            if (cancelled) return;
            merges[key] = result.activities;
            merges[sid] = result.activities;
          } catch {
            /* leave empty — conditional filters stay hidden */
          }
        })
      );
      if (!cancelled && Object.keys(merges).length > 0) {
        setSessionActivities((prev) => ({ ...prev, ...merges }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [metaReady, selectedProgram, selectedSessions, sessionActivities]);

  const currentProgramLabel = useMemo(() => {
    const fromApi = programOptions.find((p) => p.value === selectedProgram)?.label;
    return fromApi ?? getLabelForProgramValue(selectedProgram);
  }, [selectedProgram, programOptions]);

  const groupBSessionLabel = useMemo(() => {
    const isGroupASelected = groupAOptions.some((option) => option.value === selectedProgram);
    if (isGroupASelected) return '';
    const labels = selectedSessions
      .filter((sessionId) => sessionId.startsWith('B-'))
      .map((sessionId) => {
        const session = groupBSessions.find((item) => item.id === sessionId);
        return session ? formatSessionLabelWithId(session) : sessionId;
      });
    if (labels.length === 0) return 'Select sessions';
    if (labels.length === 1) return labels[0];
    return `${labels.length} Selected`;
  }, [groupAOptions, groupBSessions, selectedProgram, selectedSessions]);

  const filterTriggerLabel = useMemo(() => {
    if (selectedFilterKeys.length === 0) return 'All settings (default)';
    if (selectedFilterKeys.length === 1) {
      const row = FILTER_OPTION_ROWS.find((r) => r.key === selectedFilterKeys[0]);
      return row?.label ?? selectedFilterKeys[0];
    }
    return `${selectedFilterKeys.length} filters`;
  }, [selectedFilterKeys]);

  const sharePath = useMemo(() => {
    const path = getRoutePath(selectedProgram, 'grid');
    const group = getGroupFromProgram(selectedProgram);
    const sessions = normalizeSessionsForGroup(selectedSessions, group);
    return buildCalendarUrlPath(path, sessions, selectedFilterKeys);
  }, [selectedProgram, selectedSessions, selectedFilterKeys]);

  const handleSessionToggle = useCallback(
    (programValue: ProgramValue, sessionId: SessionId, group: 'A' | 'B') => {
      setSelectedProgram(programValue);
      setSelectedSessions((prev) => {
        const inGroup = prev.filter((id) => id.startsWith(`${group}-`));
        const isSelected = inGroup.includes(sessionId);
        if (isSelected && inGroup.length > 1) {
          return inGroup.filter((id) => id !== sessionId);
        }
        if (!isSelected) return [...inGroup, sessionId];
        return inGroup;
      });
    },
    []
  );

  const handleProgramSelect = useCallback(
    (program: ProgramValue) => {
      setActiveSubmenu(null);
      setProgramMenuOpen(false);
      setSelectedProgram(program);
      const group = getGroupFromProgram(program);
      setSelectedSessions([defaultSessionFromMeta(meta, group)]);
    },
    [meta]
  );

  const handleFilterToggle = useCallback((key: FilterQueryKey) => {
    setSelectedFilterKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const handleCopy = useCallback(async () => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://bilauitmcuti.com';
    const absoluteUrl = sharePath === '/' ? origin : `${origin}${sharePath}`;
    const ok = await copyTextToClipboard(absoluteUrl);
    if (ok) {
      setCopied(true);
      toast.success('Link copied');
      trackZarazEvent(ZARAZ_EVENTS.copyShareLink, {
        program: selectedProgram,
        calendar_session_ids: selectedSessions.join(','),
        path: sharePath,
      });
      window.setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Could not copy link');
    }
  }, [sharePath, selectedProgram, selectedSessions]);

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card p-4 text-sm text-card-foreground shadow-xs ring-1 ring-border">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="flex w-fit flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Program</span>
          <DropdownMenu
            open={programMenuOpen}
            onOpenChange={(open, details) =>
              handleProgramDropdownRootOpenChange(open, details, {
                activeSubmenu,
                keepDropdownOpenRef,
                setDropdownOpen: setProgramMenuOpen,
                setActiveSubmenu,
              })
            }
          >
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="h-9 w-fit justify-between gap-2 font-medium"
                disabled={!metaReady && programOptions.length === 0}
              />
            }
          >
            <span className="truncate">{currentProgramLabel}</span>
            {programMenuOpen ? (
              <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-4 shrink-0" aria-hidden />
            ) : (
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4 shrink-0" aria-hidden />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[260px] min-w-[260px] overflow-visible bg-popover pt-4 pb-4 pl-3 pr-3 dark:bg-[#2A2A2A]"
            align="start"
          >
            <div className="-mx-1 px-1">
              <div className="mb-2">
                <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                  GROUP A
                </div>
                {groupAOptions.map((option) => {
                  const groupASessionSummaryLabel = groupASessionSummary(
                    option.value,
                    selectedProgram,
                    selectedSessions,
                    groupASessions
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
                            className={cn(
                              'min-w-0 truncate text-sm font-medium',
                              option.value === selectedProgram
                                ? 'text-primary'
                                : 'text-foreground'
                            )}
                          >
                            {option.label}
                          </span>
                          {groupASessionSummaryLabel ? (
                            <span className="min-w-0 truncate whitespace-nowrap text-xs leading-snug text-muted-foreground">
                              {groupASessionSummaryLabel}
                            </span>
                          ) : null}
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent
                          collisionPadding={{ top: 8, right: 28, bottom: 8, left: 8 }}
                          className="min-w-[200px] bg-popover dark:bg-[#2A2A2A]"
                        >
                          {groupASessions.map((sess) => {
                            const isSelected = selectedSessions.includes(sess.id);
                            return (
                              <DropdownMenuItem
                                key={sess.id}
                                closeOnClick={false}
                                className={sessionSubmenuItemClass(isSelected)}
                                onClick={() =>
                                  handleSessionToggle(
                                    option.value as ProgramValue,
                                    sess.id,
                                    'A'
                                  )
                                }
                              >
                                <span
                                  className={cn(
                                    'pointer-events-none absolute top-1/2 left-2 flex size-3 shrink-0 -translate-y-1/2 items-center justify-center rounded-full border',
                                    isSelected
                                      ? 'border-primary bg-primary'
                                      : 'border-muted-foreground'
                                  )}
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
            <div className="my-2 -mx-3 h-px w-[calc(100%+1.5rem)] bg-border" />
            <div className="-mx-1 px-1">
              <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                GROUP B
              </div>
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
                  <div className="flex min-w-0 flex-1 flex-col gap-1 pr-1 text-left">
                    <span className="text-sm font-medium">Sessions</span>
                    <span className="min-w-0 text-xs leading-snug text-balance text-muted-foreground">
                      {groupBSessionLabel}
                    </span>
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent
                    collisionPadding={{ top: 8, right: 28, bottom: 8, left: 8 }}
                    className="min-w-[220px] bg-popover dark:bg-[#2A2A2A]"
                  >
                    {groupBSessions.map((sess) => {
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
                            className={cn(
                              'pointer-events-none absolute top-1/2 left-2 flex size-3 shrink-0 -translate-y-1/2 items-center justify-center rounded-full border',
                              isSelected
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground'
                            )}
                            aria-hidden
                          />
                          <SessionSubmenuItemLabel session={sess} />
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              {groupBOptions.map((option, index) => (
                <DropdownMenuItem
                  key={option.value}
                  className={cn(
                    'relative cursor-pointer pr-8 text-sm font-medium',
                    index === 0 ? 'mt-2' : '',
                    option.value === selectedProgram ? 'text-primary' : ''
                  )}
                  onClick={() => handleProgramSelect(option.value as ProgramValue)}
                >
                  {option.label}
                  {option.value === selectedProgram ? (
                    <span
                      className="pointer-events-none absolute top-1/2 right-2 flex size-3 shrink-0 -translate-y-1/2 items-center justify-center rounded-full border border-primary bg-primary"
                      aria-hidden
                    />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex w-fit flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Settings</span>
          <DropdownMenu open={filterMenuOpen} onOpenChange={setFilterMenuOpen}>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="h-9 w-fit justify-between gap-2 font-medium"
              />
            }
          >
            <span className="truncate">{filterTriggerLabel}</span>
            {filterMenuOpen ? (
              <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-4 shrink-0" aria-hidden />
            ) : (
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-4 shrink-0" aria-hidden />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[260px] min-w-[260px] bg-popover pt-3 pb-3 pl-2 pr-2 dark:bg-[#2A2A2A]"
            align="start"
          >
            {visibleFilterRows.map((row) => {
              const isSelected = selectedFilterKeys.includes(row.key);
              return (
                <DropdownMenuItem
                  key={row.key}
                  closeOnClick={false}
                  className={sessionSubmenuItemClass(isSelected)}
                  onClick={() => handleFilterToggle(row.key)}
                >
                  <span
                    className={cn(
                      'pointer-events-none absolute top-1/2 left-2 flex size-3 shrink-0 -translate-y-1/2 items-center justify-center rounded-full border',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 text-sm font-medium">{row.label}</span>
                  <code className="ml-2 shrink-0 text-xs text-muted-foreground">{row.key}</code>
                </DropdownMenuItem>
              );
            })}
            {visibleFilterRows.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No filters available for this selection.
              </div>
            ) : null}
          </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative">
        <Input
          readOnly
          value={sharePath}
          aria-label="Shareable calendar path and query"
          className="pr-11 font-mono text-xs sm:text-sm"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={copied ? 'Copied' : 'Copy link'}
          className="absolute top-1/2 right-0.5 -translate-y-1/2 text-muted-foreground"
          onClick={() => void handleCopy()}
        >
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} strokeWidth={2} className="size-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {selectedFilterKeys.length > 0
          ? 'Only the selected Settings toggles are turned on when the link opens.'
          : 'No filter codes — session is applied; Settings stay as saved on that device.'}{' '}
        After open, the address bar cleans to the page path.
      </p>
    </div>
  );
}
