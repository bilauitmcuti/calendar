"use client";

import { useState, type Ref } from "react";
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
import { IconHint } from "@/components/ui/icon-hint";
import { Input } from "@/components/ui/input";
import { CALENDAR_STYLE } from "@/components/month-calendar/calendar-style";
import { markMonthContentFade, monthType } from "@/components/month-calendar/month-typography";
import {
  CALENDAR_IDS,
  countSpansInMonth,
  type CalendarId,
  type MonthFilterState,
  type MonthSpan,
} from "@/components/month-calendar/pack-spans";
import {
  MONTH_PROGRAMS,
  buildMonthHref,
  monthProgramLabel,
  type MonthView,
} from "@/lib/month-routes";
import { getGroupFromProgram } from "@/lib/session-memory";
import type { DefaultSessionMap, SessionOptionRow } from "@/lib/calendar-api";
import type { ProgramValue } from "@/lib/route-utils";

interface MonthSidebarProps {
  program: ProgramValue;
  view: MonthView;
  month: string;
  sessionId: string;
  sessionOptions: SessionOptionRow[];
  defaultSession: DefaultSessionMap;
  today: string;
  spans: MonthSpan[];
  filter: MonthFilterState;
  onFilterChange: (filter: MonthFilterState) => void;
  onSessionChange: (sessionId: string) => void;
  filterInputId: string;
  filterRef?: Ref<HTMLInputElement>;
  onNavigate?: () => void;
  onClose?: () => void;
}

export function MonthSidebar({
  program,
  view,
  month,
  sessionId,
  sessionOptions,
  defaultSession,
  today,
  spans,
  filter,
  onFilterChange,
  onSessionChange,
  filterInputId,
  filterRef,
  onNavigate,
  onClose,
}: MonthSidebarProps) {
  const router = useRouter();
  const [sessionOpen, setSessionOpen] = useState(false);
  const [programOpen, setProgramOpen] = useState(false);
  const group = getGroupFromProgram(program);
  const groupSessions = sessionOptions.filter((option) => option.group === group);
  const sessions =
    groupSessions.some((option) => option.id === sessionId) || sessionId === ""
      ? groupSessions
      : [{ id: sessionId, label: sessionId, group }, ...groupSessions];

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

  const sessionLabel = sessions.find((option) => option.id === sessionId)?.label || sessionId;

  function monthHref(nextProgram: ProgramValue, nextView: MonthView, nextSession: string) {
    return buildMonthHref(nextProgram, nextView, month, nextSession, {
      today,
      defaultSessionId: defaultSession[getGroupFromProgram(nextProgram)],
    });
  }

  function selectProgram(next: ProgramValue) {
    onNavigate?.();
    router.push(monthHref(next, view, sessionFor(next)));
  }

  return (
    <div className={cn("flex h-full min-h-0 w-full flex-col", onClose ? "responsive-shell-bg" : "bg-muted")}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
        <Link href="/" aria-label="Bila UiTM Cuti" className="inline-flex size-8 shrink-0">
          <img
            src="/android-chrome-192x192.png"
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-[4px]"
          />
        </Link>
        <div className="flex items-center gap-1">
          <label htmlFor={filterInputId} className="sr-only">
            Search
          </label>
          <Input
            id={filterInputId}
            ref={filterRef}
            value={filter.query}
            placeholder="Search"
            className="min-w-0 flex-1 bg-white dark:bg-[#2A2A2A]"
            onChange={(event) => onFilterChange({ ...filter, query: event.target.value })}
          />
          {onClose ? (
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
          ) : null}
        </div>
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
                  {monthProgramLabel(program)}
                </span>
                <HugeiconsIcon icon={programOpen ? ArrowUp01Icon : ArrowDown01Icon} strokeWidth={2} className="size-4 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="bottom"
                sideOffset={4}
                className={menuContentClass}
              >
                {MONTH_PROGRAMS.map((item) => (
                  <DropdownMenuItem
                    key={item}
                    className={cn(
                      "relative cursor-pointer pr-8",
                      monthType.menuItem,
                      item === program && "text-primary"
                    )}
                    onClick={() => selectProgram(item)}
                  >
                    {monthProgramLabel(item)}
                    {item === program ? <SelectedMark /> : null}
                  </DropdownMenuItem>
                ))}
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
                <span className={cn("block min-w-0 flex-1 truncate text-left", monthType.nav)}>{sessionLabel}</span>
                <HugeiconsIcon icon={sessionOpen ? ArrowUp01Icon : ArrowDown01Icon} strokeWidth={2} className="size-4 shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="bottom"
                sideOffset={4}
                className={menuContentClass}
              >
                {sessions.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    className={cn(
                      "relative cursor-pointer pr-8",
                      monthType.menuItem,
                      option.id === sessionId && "text-primary"
                    )}
                    onClick={() => onSessionChange(option.id)}
                  >
                    {option.label || option.id}
                    {option.id === sessionId ? <SelectedMark /> : null}
                  </DropdownMenuItem>
                ))}
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
            const count = countSpansInMonth(spans, month, calendarId, filter.query);
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
    </div>
  );
}

const menuTriggerClass =
  "inline-flex h-[38px] w-full cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-border bg-white px-2.5 text-sm font-medium whitespace-nowrap text-foreground shadow-none outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-[#2A2A2A]";

const menuContentClass = "bg-popover py-2 dark:bg-[#2A2A2A]";

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
