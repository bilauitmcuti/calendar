import { describe, expect, it } from "vitest";
import { earliestActivityDate, monthForSessionChange, sessionContainsToday } from "@/components/month-calendar/session-focus";

describe("month session focus", () => {
  it("opens the current session on today's month", () => {
    expect(
      monthForSessionChange({
        sessionId: "A-20272",
        label: "Sep 2026 - Feb 2027",
        currentSessionId: "A-20272",
        today: "2026-11-20",
        fallbackMonth: "2026-03",
      })
    ).toBe("2026-11");
  });

  it("opens another session on the first month in its label", () => {
    expect(
      monthForSessionChange({
        sessionId: "A-20263",
        label: "Mar 2026 - Aug 2026",
        currentSessionId: "A-20272",
        today: "2026-11-20",
        fallbackMonth: "2026-11",
      })
    ).toBe("2026-03");
  });

  it("treats a session that contains today as the current month", () => {
    expect(
      monthForSessionChange({
        sessionId: "B-20264",
        label: "Oct 2026 - Feb 2027",
        currentSessionId: "A-20272",
        today: "2026-11-20",
        fallbackMonth: "2026-01",
      })
    ).toBe("2026-11");
  });

  it("uses the earliest activity date and detects today inside the span", () => {
    const activities = [
      { startDate: "2026-03-16", endDate: "2026-06-01" },
      { startDate: "2026-03-02", endDate: "2026-03-10" },
    ];
    expect(earliestActivityDate(activities)).toBe("2026-03-02");
    expect(sessionContainsToday(activities, "2026-04-01")).toBe(true);
    expect(sessionContainsToday(activities, "2026-11-20")).toBe(false);
  });
});