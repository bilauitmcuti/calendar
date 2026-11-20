"use client";

import { cn } from "@/lib/utils";
import { CALENDAR_STYLE, formatDayHeading, weekdayInitials } from "@/components/month-calendar/calendar-style";
import { monthType } from "@/components/month-calendar/month-typography";
import {
  addDays,
  spansOnDate,
  type MonthSpan,
  type WeekLaneSpan,
  type WeekLayout,
} from "@/components/month-calendar/pack-spans";

interface MonthGridProps {
  month: string;
  today: string;
  selectedDate: string;
  weeks: WeekLayout[];
  spans: MonthSpan[];
  lectureWeekByDate: Record<string, number>;
  onSelectDate: (date: string) => void;
}

const WEEKDAYS = weekdayInitials();

export function MonthGrid({
  month,
  today,
  selectedDate,
  weeks,
  spans,
  lectureWeekByDate,
  onSelectDate,
}: MonthGridProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col" role="grid" aria-label="Calendar">
      <div className="grid shrink-0 grid-cols-7 border-b border-border" role="row">
        {WEEKDAYS.map((label, index) => (
          <div
            key={`${label}-${index}`}
            role="columnheader"
            className={cn("border-l border-border px-1 py-2 text-center", monthType.gridWeekday)}
          >
            <span className="min-[560px]:hidden">{label.slice(0, 1)}</span>
            <span className="hidden min-[560px]:inline">{label}</span>
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-rows-[repeat(6,minmax(3.25rem,auto))] min-[560px]:grid-rows-6">
        {weeks.map((week) => (
          <div key={week.dates[0]} className="relative min-h-0 border-b border-border" role="row">
            <div className="grid h-full grid-cols-7">
              {week.dates.map((date) => {
                const inMonth = date.startsWith(month);
                const isToday = date === today;
                const isSelected = date === selectedDate;
                const daySpans = spansOnDate(spans, date);
                const ticks = uniqueTicks(daySpans);
                const dayNumber = Number(date.slice(8));
                return (
                  <button
                    key={date}
                    type="button"
                    role="gridcell"
                    tabIndex={isSelected ? 0 : -1}
                    aria-selected={isSelected}
                    aria-current={isToday ? "date" : undefined}
                    aria-label={dayLabel(date, isToday, daySpans.length)}
                    data-month-date={date}
                    onClick={() => onSelectDate(date)}
                    className={cn(
                      "flex h-full min-h-13 flex-col items-center border-l border-border px-0.5 pt-1 text-center min-[560px]:items-stretch min-[560px]:px-1",
                      isSelected && "bg-muted/70"
                    )}
                  >
                    <span
                      className={cn(
                        "mx-auto inline-flex size-6 items-center justify-center rounded-full min-[560px]:size-7",
                        monthType.gridDayNumber,
                        isToday && "bg-foreground text-background",
                        !isToday && inMonth && "text-foreground",
                        !isToday && !inMonth && "text-muted-foreground"
                      )}
                    >
                      {dayNumber}
                    </span>
                    <span className="mt-1 flex items-center justify-center gap-0.5 min-[560px]:hidden" aria-hidden>
                      {ticks.map((calendarId) => (
                        <span key={calendarId} className={cn("size-1.5 rounded-full", CALENDAR_STYLE[calendarId].dot)} />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-8 bottom-5 hidden content-start gap-y-0.5 overflow-hidden grid-cols-7 grid-auto-rows-[1.25rem] min-[560px]:grid min-[900px]:top-9 min-[900px]:grid-auto-rows-[1.5rem]">
              {week.lanes.map((lane) => {
                const style = CALENDAR_STYLE[lane.span.calendarId];
                const weekNum = lane.span.calendarId === "lecture" ? lectureWeekForLane(lane, lectureWeekByDate) : undefined;
                return (
                  <button
                    key={`${lane.span.id}-${lane.start}`}
                    type="button"
                    tabIndex={-1}
                    onClick={() => onSelectDate(lane.start)}
                    className={cn(
                      "pointer-events-auto flex h-5 w-full items-center rounded-md px-1.5 text-left min-[900px]:h-6",
                      monthType.gridBar,
                      style.bar,
                      style.text,
                      lane.continuesBefore ? "rounded-l-none" : "",
                      lane.continuesAfter ? "rounded-r-none" : ""
                    )}
                    style={{
                      gridColumn: `${lane.column} / span ${lane.spanDays}`,
                      gridRow: lane.lane + 1,
                    }}
                  >
                    {weekNum != null ? (
                      <span className="mr-1.5 hidden shrink-0 min-[560px]:inline">Week {weekNum}</span>
                    ) : null}
                    <span className="min-w-0 truncate">{lane.span.title}</span>
                  </button>
                );
              })}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0.5 hidden grid-cols-7 min-[560px]:grid">
              {week.dates.map((date, index) => {
                const extra = week.overflowByDate[date] ?? 0;
                return (
                  <div key={date} style={{ gridColumn: index + 1 }}>
                    {extra > 0 ? (
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => onSelectDate(date)}
                        className={cn(
                          "pointer-events-auto px-1 hover:text-foreground",
                          monthType.gridOverflow
                        )}
                      >
                        +{extra} more
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function lectureWeekForLane(lane: WeekLaneSpan, lectureWeekByDate: Record<string, number>): number | undefined {
  let date = lane.start;
  while (date <= lane.end) {
    const week = lectureWeekByDate[date];
    if (week != null) return week;
    date = addDays(date, 1);
  }
  return undefined;
}

function uniqueTicks(spans: MonthSpan[]) {
  const ids: MonthSpan["calendarId"][] = [];
  for (const span of spans) {
    if (ids.includes(span.calendarId)) continue;
    ids.push(span.calendarId);
    if (ids.length === 4) break;
  }
  return ids;
}

function dayLabel(date: string, isToday: boolean, count: number): string {
  const today = isToday ? ", today" : "";
  const events = count === 1 ? ", 1 event" : `, ${count} events`;
  return `${formatDayHeading(date)}${today}${events}`;
}
