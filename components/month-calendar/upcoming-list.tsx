"use client";

import { useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Layers01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { formatMonthTitle } from "@/components/month-calendar/calendar-style";
import { MonthEventDetails } from "@/components/month-calendar/month-event-details";
import { monthType } from "@/components/month-calendar/month-typography";
import { groupUpcoming, type MonthSpan } from "@/components/month-calendar/pack-spans";
import type { ProgramValue } from "@/lib/route-utils";

interface UpcomingListProps {
  month: string;
  today: string;
  program: ProgramValue;
  selectedDate: string;
  spans: MonthSpan[];
  onSelectDate: (date: string) => void;
}

export function UpcomingList({ month, today, program, selectedDate, spans, onSelectDate }: UpcomingListProps) {
  const groups = groupUpcoming(spans, month);
  const anchorDate =
    groups.find((group) => group.date >= today)?.date ?? groups[groups.length - 1]?.date;
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const scrolled = useRef(false);
  const isCurrentMonth = month === today.slice(0, 7);

  useEffect(() => {
    scrolled.current = false;
  }, [month]);

  useEffect(() => {
    if (scrolled.current) return;
    scrolled.current = true;
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    if (!isCurrentMonth) {
      scrollEl.scrollTop = 0;
      return;
    }
    todayRef.current?.scrollIntoView({ block: "start" });
  }, [anchorDate, isCurrentMonth, month]);

  return (
    <div ref={scrollRef} className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-card">
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1000px] flex-col gap-6 px-4 py-3 sm:px-6 lg:px-4",
          groups.length === 0 && "min-h-full flex-1"
        )}
      >
        {groups.length === 0 ? (
          <Empty className="min-h-48 flex-1 border-0 bg-transparent py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Layers01Icon} strokeWidth={2} className="size-6" />
              </EmptyMedia>
              <EmptyTitle className={monthType.emptyTitle}>No activities match your filters</EmptyTitle>
              <EmptyDescription className={monthType.emptyBody}>
                Turn on more calendar types in the menu, or switch program or session to see upcoming dates this month.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="-mx-3 scroll-mt-28 pt-1 pb-2">
              <h3 className={cn("px-3 text-left", monthType.upcomingMonth)}>{formatMonthTitle(month)}</h3>
            </div>
            {groups.map((group) => (
              <div
                key={group.date}
                ref={group.date === anchorDate ? todayRef : undefined}
                className="flex flex-col gap-2 md:gap-4"
              >
                <button type="button" onClick={() => onSelectDate(group.date)} className="md:hidden">
                  <DateColumn date={group.date} />
                </button>
                <div className="flex flex-col gap-4">
                  {group.spans.map((span, index) => (
                    <button
                      key={span.id}
                      type="button"
                      onClick={() => onSelectDate(group.date)}
                      className={cn(
                        "flex w-full gap-4 rounded-lg px-0 py-3 text-left",
                        selectedDate === group.date && index === 0 && "scroll-mt-28"
                      )}
                    >
                      <DateColumn date={group.date} className="hidden md:flex" />
                      <MonthEventDetails span={span} program={program} badgesClassName="md:pl-4" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DateColumn({ date, className }: { date: string; className?: string }) {
  const formatted = formatListDate(date);
  return (
    <div className={cn(monthType.dateColumn, className)}>
      <div>{formatted.dayName}</div>
      <div className={monthType.dateColumnNum}>
        {formatted.dayNum} {formatted.monthShort}
      </div>
    </div>
  );
}

function formatListDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  return {
    dayName: value.toLocaleString("en-US", { weekday: "short", timeZone: "UTC" }),
    dayNum: String(value.getUTCDate()),
    monthShort: value.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
  };
}
