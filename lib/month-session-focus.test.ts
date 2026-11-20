import { beforeEach, describe, expect, it } from "vitest";
import {
  earliestActivityDate,
  monthForSessionChange,
  planSessionArrival,
  readCarriedSessionFocus,
  sessionContainsToday,
  writeCarriedSessionFocus,
} from "@/components/month-calendar/session-focus";

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

describe("planSessionArrival", () => {
  beforeEach(() => {
    writeCarriedSessionFocus(null);
  });

  it("navigates to the first activity month and keeps the pending session", () => {
    expect(
      planSessionArrival({
        pendingSessionId: "B-20272",
        carried: null,
        sessionId: "B-20272",
        month: "2027-03",
        today: "2026-11-20",
        defaultSessionId: "B-20264",
        activities: [{ startDate: "2027-01-11", endDate: "2027-02-19" }],
        arrivalChanged: true,
      })
    ).toEqual({
      action: "navigate",
      month: "2027-01",
      carry: { sessionId: "B-20272", date: "2027-01-11" },
    });
  });

  it("selects the carried activity date when the pending id was already cleared", () => {
    expect(
      planSessionArrival({
        pendingSessionId: null,
        carried: { sessionId: "B-20272", date: "2027-01-11" },
        sessionId: "B-20272",
        month: "2027-01",
        today: "2026-11-20",
        defaultSessionId: "B-20264",
        activities: [{ startDate: "2027-01-11", endDate: "2027-02-19" }],
        arrivalChanged: true,
      })
    ).toEqual({ action: "select", date: "2027-01-11", clearPending: true });
  });

  it("keeps the selected day when the same month arrives again", () => {
    expect(
      planSessionArrival({
        pendingSessionId: null,
        carried: null,
        sessionId: "B-20272",
        month: "2027-01",
        today: "2026-11-20",
        defaultSessionId: "B-20264",
        activities: [{ startDate: "2027-01-11", endDate: "2027-02-19" }],
        arrivalChanged: false,
      })
    ).toEqual({ action: "keep" });
  });

  it("selects today and does not navigate when the session already contains today", () => {
    expect(
      planSessionArrival({
        pendingSessionId: "B-20264",
        carried: null,
        sessionId: "B-20264",
        month: "2026-11",
        today: "2026-11-20",
        defaultSessionId: "B-20264",
        activities: [{ startDate: "2026-05-23", endDate: "2027-02-28" }],
        arrivalChanged: true,
      })
    ).toEqual({ action: "select", date: "2026-11-20", clearPending: true });
    expect(readCarriedSessionFocus()).toBeNull();
  });
});