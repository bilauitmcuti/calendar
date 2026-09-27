import { describe, expect, it } from "vitest";
import { getUniqueListActivities, resolveListTodayAnchorKey, type Activity } from "./data";

function activity(partial: Partial<Activity> & Pick<Activity, "name" | "startDate">): Activity {
  return {
    type: "lecture",
    group: "B",
    ...partial,
  };
}

describe("resolveListTodayAnchorKey", () => {
  it("uses the closest displayed start date, not a range that still covers today", () => {
    const spanning = activity({
      name: "Pendaftaran Pelajar Baharu",
      startDate: "2026-09-07",
      endDate: "2026-09-27",
    });
    const nearer = activity({
      name: "Tempoh Permohonan",
      startDate: "2026-09-24",
      endDate: "2026-10-18",
    });

    expect(resolveListTodayAnchorKey([spanning, nearer], {}, "2026-09-26", false)).toEqual({
      rowKey: "2026-09-24",
      kind: "past",
    });
  });

  it("prefers an exact displayed date over a nearer-looking range", () => {
    const earlier = activity({ name: "Alpha", startDate: "2026-09-10", endDate: "2026-09-12" });
    const later = activity({ name: "Beta", startDate: "2026-09-21", endDate: "2026-10-02" });

    expect(resolveListTodayAnchorKey([earlier, later], {}, "2026-09-10", false)).toEqual({
      rowKey: "2026-09-10",
      kind: "today",
    });
  });

  it("keeps the first list order only as a display date, when two rows share today", () => {
    const first = activity({ name: "Alpha", startDate: "2026-09-10", endDate: "2026-09-12" });
    const second = activity({ name: "Beta", startDate: "2026-09-10", endDate: "2026-09-12" });
    const unique = getUniqueListActivities([second, first], false);

    expect(resolveListTodayAnchorKey(unique, {}, "2026-09-10", false)).toEqual({
      rowKey: "2026-09-10",
      kind: "today",
    });
  });

  it("treats a holiday date as a displayed date", () => {
    const past = activity({
      name: "Ended",
      startDate: "2026-09-01",
      endDate: "2026-09-03",
    });

    expect(
      resolveListTodayAnchorKey([past], { "2026-09-16": [{ id: "ph-1", date: "2026-09-16" }] }, "2026-09-16", false)
    ).toEqual({
      rowKey: "2026-09-16",
      kind: "today",
    });
  });

  it("picks the closest upcoming display date when that is nearer than a past date", () => {
    const past = activity({
      name: "Ended",
      startDate: "2026-09-04",
      endDate: "2026-09-18",
    });
    const upcoming = activity({
      name: "Next",
      startDate: "2026-10-01",
      endDate: "2026-10-10",
    });

    expect(resolveListTodayAnchorKey([past, upcoming], {}, "2026-09-26", false)).toEqual({
      rowKey: "2026-10-01",
      kind: "upcoming",
    });
  });

  it("prefers the past display date when past and upcoming are equally close", () => {
    const past = activity({ name: "Thu", startDate: "2026-09-24", endDate: "2026-10-18" });
    const upcoming = activity({ name: "Mon", startDate: "2026-09-28", endDate: "2026-12-20" });

    expect(resolveListTodayAnchorKey([past, upcoming], {}, "2026-09-26", false)).toEqual({
      rowKey: "2026-09-24",
      kind: "past",
    });
  });

  it("returns null when the list has no activities or holidays", () => {
    expect(resolveListTodayAnchorKey([], {}, "2026-09-26", false)).toEqual({
      rowKey: null,
      kind: null,
    });
  });
});
