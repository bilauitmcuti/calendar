import { formatDateRange, getProgramBadgeConfig, getProgramBadgesConfig, type Activity } from "@/lib/data";
import { formatHolidayStates } from "@/lib/public-holidays-for-view";
import { cn } from "@/lib/utils";
import type { ProgramValue } from "@/lib/route-utils";
import { Badge } from "@/components/ui/badge";
import { CALENDAR_STYLE } from "@/components/month-calendar/calendar-style";
import { monthType } from "@/components/month-calendar/month-typography";
import type { MonthSpan } from "@/components/month-calendar/pack-spans";

interface MonthEventDetailsProps {
  span: MonthSpan;
  program: ProgramValue;
  className?: string;
  badgesClassName?: string;
  titleAs?: "h3" | "h4";
}

export function MonthEventDetails({ span, program, className, badgesClassName, titleAs = "h3" }: MonthEventDetailsProps) {
  const style = CALENDAR_STYLE[span.calendarId];
  const range = formatDateRange(span.start, span.end === span.start ? undefined : span.end);
  const states = span.states?.length ? formatHolidayStates(span.states) : "";
  const subjectToChange = span.details === "Subject to change";
  const title = subjectToChange ? `${span.title} *` : span.title;
  const badges = span.calendarId === "holiday" ? [] : badgesFor(span, program);
  const Title = titleAs === "h4" ? "h4" : "h3";

  return (
    <div className={cn("flex min-w-0 flex-1 flex-col gap-1", className)}>
      {badges.length > 0 ? (
        <div className={cn("flex w-fit flex-wrap gap-2", badgesClassName)}>
          {badges.map((badge) => (
            <Badge
              key={badge.label}
              variant="secondary"
              className={cn("h-auto rounded-full px-3 py-1", badge.bgClass, badge.textClass)}
            >
              {badge.label}
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="flex items-start gap-2">
        <div className="flex h-[1lh] shrink-0 items-center">
          <span className={cn("size-2 shrink-0 rounded-full", style.dot)} />
        </div>
        <Title className={monthType.eventTitle}>{title}</Title>
      </div>
      <p className={monthType.eventMeta}>{range}</p>
      {span.duration ? <p className={monthType.eventMeta}>{span.duration}</p> : null}
      {span.details && !subjectToChange ? <p className={monthType.eventMeta}>{span.details}</p> : null}
      {states ? <p className={monthType.eventMeta}>{states}</p> : null}
    </div>
  );
}

function badgesFor(span: MonthSpan, program: ProgramValue) {
  const activity = {
    name: span.title,
    startDate: span.start,
    endDate: span.end,
    type: span.calendarId === "holiday" ? "other" : span.calendarId,
    programType: span.programType,
    programTypes: span.programTypes,
    allStudents: span.allStudents,
    general: span.general,
  } as Activity;
  const many = getProgramBadgesConfig(activity, program);
  if (many.length > 0) return many;
  const single = getProgramBadgeConfig(activity);
  return single ? [single] : [];
}
