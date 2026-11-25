import { describe, expect, it } from "vitest";
import {
  buildMonthSpans,
  groupUpcoming,
  monthGridDates,
  packMonth,
} from "@/components/month-calendar/pack-spans";
import type { Activity } from "@/lib/data";

function activity(partial: Partial<Activity> & Pick<Activity, "name" | "startDate" | "type">): Activity {
  return partial;
}

describe("month grid", () => {
  it("starts weeks on Monday and always paints six weeks", () => {
    const weeks = monthGridDates("2026-11");
    expect(weeks).toHaveLength(6);
    expect(weeks[0][0]).toBe("2026-10-26");
    expect(weeks[0][6]).toBe("2026-11-01");
    expect(weeks[5][6]).toBe("2026-12-06");
  });
});

describe("packMonth", () => {
  const spans = buildMonthSpans(
    [
      activity({ name: "Lecture", type: "lecture", startDate: "2026-11-02", endDate: "2026-11-20" }),
      activity({ name: "Exam", type: "examination", startDate: "2026-11-02", endDate: "2026-11-06" }),
      activity({ name: "Break", type: "break", startDate: "2026-11-03", endDate: "2026-11-04" }),
      activity({ name: "Other", type: "other", startDate: "2026-11-04", endDate: "2026-11-04" }),
      activity({ name: "Lecture", type: "lecture", startDate: "2026-11-02", endDate: "2026-11-20" }),
    ],
    [
      {
        id: "ph-1",
        name: "Holiday",
        date: "2026-11-04",
        day: "Wednesday",
        states: ["kuala-lumpur"],
        isSubjectToChange: false,
      },
    ]
  );

  it("dedupes identical activities and keeps holidays", () => {
    expect(spans.filter((span) => span.title === "Lecture")).toHaveLength(1);
    expect(spans.some((span) => span.calendarId === "holiday")).toBe(true);
  });

  it("packs overlapping spans into lanes and folds the rest into +N more", () => {
    const week = packMonth(spans, "2026-11").find((row) => row.dates.includes("2026-11-04"));
    expect(week).toBeDefined();
    const visible = week!.lanes.filter((lane) => lane.start <= "2026-11-04" && lane.end >= "2026-11-04");
    expect(visible.length).toBeLessThanOrEqual(3);
    expect(week!.overflowByDate["2026-11-04"]).toBeGreaterThan(0);
    const lecture = week!.lanes.find((lane) => lane.span.title === "Lecture");
    expect(lecture?.continuesAfter).toBe(true);
  });

  it("anchors a span that started earlier on the first day of the month", () => {
    const groups = groupUpcoming(
      buildMonthSpans(
        [activity({ name: "Mid sem", type: "break", startDate: "2026-10-20", endDate: "2026-11-02" })],
        []
      ),
      "2026-11"
    );
    expect(groups[0]?.date).toBe("2026-11-01");
    expect(groups[0]?.spans[0]?.title).toBe("Mid sem");
  });
});
