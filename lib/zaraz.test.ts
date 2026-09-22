import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isZarazAvailable,
  trackZarazEvent,
  trackZarazPageView,
  ZARAZ_EVENTS,
} from "@/lib/zaraz";

describe("zaraz", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { zaraz: undefined });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("no-ops when zaraz is unavailable", () => {
    expect(isZarazAvailable()).toBe(false);
    expect(() => trackZarazEvent("test_event")).not.toThrow();
  });

  it("forwards events to window.zaraz.track", () => {
    const track = vi.fn().mockResolvedValue(undefined);
    window.zaraz = { track };

    trackZarazEvent(ZARAZ_EVENTS.engagementRating, {
      rating: 5,
    });

    expect(track).toHaveBeenCalledWith("engagement_rating", {
      rating: 5,
    });
  });

  it("drops undefined properties", () => {
    const track = vi.fn().mockResolvedValue(undefined);
    window.zaraz = { track };

    trackZarazEvent(ZARAZ_EVENTS.engagementShare, {
      method: "copy",
      correlationId: undefined,
    });

    expect(track).toHaveBeenCalledWith("engagement_share", { method: "copy" });
  });

  it("tracks virtual pageviews for client navigations", () => {
    const track = vi.fn().mockResolvedValue(undefined);
    window.zaraz = { track };

    trackZarazPageView("/about");

    expect(track).toHaveBeenCalledWith("Pageview", { path: "/about" });
  });

  it("forwards calendar program selection events", () => {
    const track = vi.fn().mockResolvedValue(undefined);
    window.zaraz = { track };

    trackZarazEvent(ZARAZ_EVENTS.selectProgram, {
      program: "Degree",
      program_group: "B",
    });

    expect(track).toHaveBeenCalledWith("select_program", {
      program: "Degree",
      program_group: "B",
    });
  });

  it("forwards calendar date view events", () => {
    const track = vi.fn().mockResolvedValue(undefined);
    window.zaraz = { track };

    trackZarazEvent(ZARAZ_EVENTS.viewCalendarDate, {
      date: "2026-03-15",
      program: "Degree",
      calendar_session_ids: "B-20262,B-20264",
      view: "grid",
    });

    expect(track).toHaveBeenCalledWith("view_calendar_date", {
      date: "2026-03-15",
      program: "Degree",
      calendar_session_ids: "B-20262,B-20264",
      view: "grid",
    });
  });
});
