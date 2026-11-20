"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Calendar04Icon,
  LeftToRightListBulletIcon,
  PanelLeftCloseIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SessionSubmenuItemLabel } from "@/components/session-submenu-item-label";
import { IconHint } from "@/components/ui/icon-hint";
import { CALENDAR_STYLE } from "@/components/month-calendar/calendar-style";
import { markMonthContentFade, monthType } from "@/components/month-calendar/month-typography";
import {
  CALENDAR_IDS,
  countSpansInMonth,
  type CalendarId,
  type MonthFilterState,
  type MonthSpan,
} from "@/components/month-calendar/pack-spans";
import { buildMonthHref, type MonthView } from "@/lib/month-routes";
import { getLabelForProgramValue, type ProgramValue } from "@/lib/route-utils";
import { sessionSubmenuItemClass } from "@/lib/session-submenu-item-class";
import { getGroupFromProgram } from "@/lib/session-memory";
import { KktShowSwitch } from "@/components/kkt-show-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import type { DefaultSessionMap, ProgramOptionRow, SessionOptionRow } from "@/lib/calendar-api";

interface MonthSidebarProps {
  program: ProgramValue;
  view: MonthView;
  month: string;
  sessionId: string;
  sessionOptions: SessionOptionRow[];
  programOptions: ProgramOptionRow[];
  defaultSession: DefaultSessionMap;
  today: string;
  spans: MonthSpan[];
  filter: MonthFilterState;
  onFilterChange: (filter: MonthFilterState) => void;
  onSessionChange: (sessionId: string) => void;
  onNavigate?: () => void;
  onClose?: () => void;
  showKKT: boolean;
  onShowKKTChange: (show: boolean) => void;
  hasRegionalDateRange: boolean;
}

export function MonthSidebar({
  program,
  view,
  month,
  sessionId,
  sessionOptions,
  programOptions,
  defaultSession,
  today,
  spans,
  filter,
  onFilterChange,
  onSessionChange,
  onNavigate,
  onClose,
  showKKT,
  onShowKKTChange,
  hasRegionalDateRange,
}: MonthSidebarProps) {
  const router = useRouter();
  const [programOpen, setProgramOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);

  const groupAOptions = useMemo(() => programOptions.filter((option) => option.group === "A"), [programOptions]);
  const groupBOptions = useMemo(() => programOptions.filter((option) => option.group === "B"), [programOptions]);

  const currentProgramLabel = useMemo(() => {
    if (program === "All") return "All";
    const fromApi = programOptions.find((item) => item.value === program)?.label;
    if (fromApi) return fromApi;
    return getLabelForProgramValue(program);
  }, [program, programOptions]);

  const group = getGroupFromProgram(program);
  const groupSessions = sessionOptions.filter((option) => option.group === group);
  const sessions =
    groupSessions.some((option) => option.id === sessionId) || sessionId === ""
      ? groupSessions
      : [{ id: sessionId, label: sessionId, group }, ...groupSessions];
  const sessionLabel = sessions.find((option) => option.id === sessionId)?.label || sessionId;

  function sessionFor(nextProgram: ProgramValue): string {
    const nextGroup = getGroupFromProgram(nextProgram);
    if (sessionId.startsWith(`${nextGroup}-`)) return sessionId;
    return defaultSession[nextGroup];
  }

  function setOnly(calendarId: CalendarId) {
    onFilterChange({
      ...filter,
      only: filter.only === calendarId ? null : calendarId,
    });
  }

  function toggleCalendar(calendarId: CalendarId) {
    onFilterChange({
      ...filter,
      only: null,
      enabled: { ...filter.enabled, [calendarId]: !filter.enabled[calendarId] },
    });
  }

  function monthHref(nextProgram: ProgramValue, nextView: MonthView, nextSession: string) {
    return buildMonthHref(nextProgram, nextView, month, nextSession, {
      today,
      defaultSessionId: defaultSession[getGroupFromProgram(nextProgram)],
    });
  }

  function selectProgram(next: ProgramValue) {
    onNavigate?.();
    markMonthContentFade();
    router.push(monthHref(next, view, sessionFor(next)));
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col",
        onClose ? "responsive-shell-bg px-3" : "bg-muted"
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        {onClose ? (
          <div className="flex items-center justify-between gap-2">
            <Link href="/" aria-label="Bila UiTM Cuti" className="inline-flex size-8 shrink-0">
              <img
                src="/android-chrome-192x192.png"
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-[4px]"
              />
            </Link>
            <IconHint
              label="Close sidebar"
              hintOnTouch={false}
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close sidebar"
                  onClick={onClose}
                />
              }
            >
              <HugeiconsIcon icon={PanelLeftCloseIcon} strokeWidth={2} data-icon="inline-start" />
            </IconHint>
          </div>
        ) : (
          <Link href="/" aria-label="Bila UiTM Cuti" className="inline-flex size-8 shrink-0">
            <img
              src="/android-chrome-192x192.png"
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-[4px]"
            />
          </Link>
        )}
        <nav className="flex flex-col gap-0.5" aria-label="Calendar views">
          <ViewLink
            href={monthHref(program, "grid", sessionId)}
            active={view === "grid"}
            label="Calendar"
            icon={Calendar04Icon}
            onNavigate={onNavigate}
          />
          <ViewLink
            href={monthHref(program, "upcoming", sessionId)}
            active={view === "upcoming"}
            label="Upcoming"
            icon={LeftToRightListBulletIcon}
            onNavigate={onNavigate}
          />
        </nav>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <p className={monthType.sectionLabel}>Program</p>
            <DropdownMenu open={programOpen} onOpenChange={setProgramOpen}>
              <DropdownMenuTrigger
                render={
                  <button type="button" className={menuTriggerClass} />
                }
              >
                <span className={cn("block min-w-0 flex-1 truncate text-left", monthType.nav)}>
                  {currentProgramLabel}
                </span>
                <HugeiconsIcon icon={programOpen ? ArrowUp01Icon : ArrowDown01Icon} strokeWidth={2} className="size-4 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="bottom"
                sideOffset={4}
                className={programMenuContentClass}
              >
                <div className="-mx-1 px-1">
                  <div className="mb-2">
                    <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">GROUP A</div>
                    {groupAOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        className={cn(
                          "relative cursor-pointer pr-8 text-sm font-medium",
                          monthType.menuItem,
                          option.value === program && "text-primary"
                        )}
                        onClick={() => {
                          setProgramOpen(false);
                          selectProgram(option.value as ProgramValue);
                        }}
                      >
                        {option.label}
                        {option.value === program ? <SelectedMark /> : null}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>
                <div className="my-2 -mx-3 h-px w-[calc(100%+1.5rem)] bg-border" />
                <div className="-mx-1 px-1">
                  <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground">GROUP B</div>
                  {groupBOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      className={cn(
                        "relative cursor-pointer pr-8 text-sm font-medium",
                        monthType.menuItem,
                        option.value === program && "text-primary"
                      )}
                      onClick={() => {
                        setProgramOpen(false);
                        selectProgram(option.value as ProgramValue);
                      }}
                    >
                      {option.label}
                      {option.value === program ? <SelectedMark /> : null}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className={monthType.sectionLabel}>Session</p>
            <DropdownMenu open={sessionOpen} onOpenChange={setSessionOpen}>
              <DropdownMenuTrigger
                render={
                  <button type="button" className={menuTriggerClass} />
                }
              >
                <span className={cn("block min-w-0 flex-1 truncate text-left", monthType.nav)}>
                  {sessionLabel}
                </span>
                <HugeiconsIcon icon={sessionOpen ? ArrowUp01Icon : ArrowDown01Icon} strokeWidth={2} className="size-4 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="bottom"
                sideOffset={4}
                className={sessionMenuContentClass}
              >
                {sessions.map((option) => {
                  const isSelected = option.id === sessionId;
                  return (
                    <DropdownMenuItem
                      key={option.id}
                      className={sessionSubmenuItemClass(isSelected)}
                      onClick={() => {
                        setSessionOpen(false);
                        onSessionChange(option.id);
                      }}
                    >
                      <span
                        className={cn(
                          "pointer-events-none absolute top-1/2 left-2 flex size-3 shrink-0 -translate-y-1/2 items-center justify-center rounded-full border",
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                        )}
                        aria-hidden
                      />
                      <SessionSubmenuItemLabel session={option} />
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className={monthType.sectionLabel}>Calendars</p>
          <ul className="flex flex-col gap-0.5">
          {CALENDAR_IDS.map((calendarId) => {
            const style = CALENDAR_STYLE[calendarId];
            const pressed = filter.only ? filter.only === calendarId : filter.enabled[calendarId];
            const count = countSpansInMonth(spans, month, calendarId);
            return (
              <li key={calendarId} className="group relative">
                <button
                  type="button"
                  aria-pressed={pressed}
                  onClick={() => toggleCalendar(calendarId)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 pr-12 text-left",
                    monthType.calendarRow,
                    pressed ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <HugeiconsIcon
                    icon={style.icon}
                    strokeWidth={2}
                    className={cn("size-4 shrink-0", pressed ? style.text : "text-muted-foreground")}
                  />
                  <span className="min-w-0 flex-1 truncate">{style.label}</span>
                  <span className={monthType.calendarCount}>{count}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOnly(calendarId)}
                  className={cn(
                    "absolute top-1/2 right-1 -translate-y-1/2 rounded px-1.5 py-1 opacity-0 hover:bg-muted hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100",
                    monthType.onlyChip
                  )}
                >
                  {filter.only === calendarId ? "All" : "Only"}
                </button>
              </li>
            );
          })}
          </ul>
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-2">
        <KktShowSwitch
          checked={showKKT}
          onChange={onShowKKTChange}
          hasRegionalDateRange={hasRegionalDateRange}
        />
        <ThemeToggle />
      </div>
    </div>
  );
}

const menuTriggerClass =
  "inline-flex h-[38px] w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-border bg-white px-2.5 text-sm font-medium whitespace-nowrap text-foreground shadow-none outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-[#2A2A2A]";

const programMenuContentClass =
  "min-w-[260px] overflow-visible bg-popover py-4 pr-3 pl-3 dark:bg-[#2A2A2A]";
const sessionMenuContentClass = "min-w-[220px] bg-popover py-2 dark:bg-[#2A2A2A]";

function SelectedMark() {
  return (
    <span
      className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 rounded-full border border-primary bg-primary"
      aria-hidden
    />
  );
}

function ViewLink({
  href,
  active,
  label,
  icon,
  onNavigate,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: typeof Calendar04Icon;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={() => {
        if (!active) markMonthContentFade();
        onNavigate?.();
      }}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5",
        monthType.nav,
        active ? "bg-secondary text-foreground dark:bg-[#2A2A2A]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4 shrink-0" />
      {label}
    </Link>
  );
}
