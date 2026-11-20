import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar04Icon, PanelRightCloseIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { ProgramValue } from "@/lib/route-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { IconHint } from "@/components/ui/icon-hint";
import { formatDayHeading } from "@/components/month-calendar/calendar-style";
import { MonthEventDetails } from "@/components/month-calendar/month-event-details";
import { monthType } from "@/components/month-calendar/month-typography";
import type { MonthSpan } from "@/components/month-calendar/pack-spans";

interface DayPanelProps {
  date: string;
  today: string;
  program: ProgramValue;
  spans: MonthSpan[];
  lectureWeek?: number;
  className?: string;
  onClose?: () => void;
}

export function DayPanel({ date, today, program, spans, lectureWeek, className, onClose }: DayPanelProps) {
  const isToday = date === today;
  const eventCount = spans.length === 1 ? "1 event" : `${spans.length} events`;
  return (
    <section className={cn("flex min-h-0 flex-col", className)} aria-label="Selected day">
      <header className="flex shrink-0 items-start gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={cn(monthType.dayHeading, "text-foreground")}>{formatDayHeading(date)}</h2>
            {isToday ? <Badge variant="secondary">Today</Badge> : null}
          </div>
          <p className={monthType.daySummary}>
            {eventCount}
            {lectureWeek != null ? ` · Lecture week ${lectureWeek}` : ""}
          </p>
        </div>
        {onClose ? (
          <IconHint
            label="Close day"
            hintOnTouch={false}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close day"
                onClick={onClose}
              />
            }
          >
            <HugeiconsIcon icon={PanelRightCloseIcon} strokeWidth={2} data-icon="inline-start" />
          </IconHint>
        ) : null}
      </header>
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3",
          spans.length > 0 && "scroll-fade scrollbar-thin",
          spans.length === 0 && "flex flex-col"
        )}
      >
        {spans.length === 0 ? (
          <Empty className="min-h-48 flex-1 border-0 bg-transparent py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Calendar04Icon} strokeWidth={2} className="size-6" />
              </EmptyMedia>
              <EmptyTitle className={monthType.emptyTitle}>Nothing on this day</EmptyTitle>
              <EmptyDescription className={monthType.emptyBody}>
                No activities are scheduled. Try another date or turn on more calendar types in the menu.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="flex flex-col gap-4">
            {spans.map((span) => (
              <li key={span.id}>
                <MonthEventDetails span={span} program={program} titleAs="h4" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
