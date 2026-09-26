import { describe, expect, it } from "vitest";
import {
  getListActivityRowKey,
  getUniqueListActivities,
  resolveListTodayAnchorKey,
  type Activity,
} from "./data";

function activity(partial: Partial<Activity> & Pick<Activity, "name" | "startDate">): Activity {
  return {
    type: "lecture",
    group: "B",
    ...partial,
  };
}

describe("resolveListTodayAnchorKey", () => {
  it("anchors an activity that covers today, even when the row starts earlier", () => {
    const ongoing = activity({
      name: "Persetujuan Menerima Tawaran",
      startDate: "2026-09-04",
      endDate: "2026-09-18",
      programType: "Diploma",
    });
    const later = activity({
      name: "Kuliah",
      startDate: "2026-09-21",
      endDate: "2026-10-02",
    });

    const result = resolveListTodayAnchorKey([ongoing, later], {}, "2026-09-10", false);

    expect(result).toEqual({
      rowKey: getListActivityRowKey(ongoing),
      kind: "active",
    });
  });

  it("uses the first list row when two activities start today", () => {
    const first = activity({ name: "Alpha", startDate: "2026-09-10", endDate: "2026-09-12" });
    const second = activity({ name: "Beta", startDate: "2026-09-10", endDate: "2026-09-12" });
    const unique = getUniqueListActivities([second, first], false);

    const result = resolveListTodayAnchorKey(unique, {}, "2026-09-10", false);

    expect(result).toEqual({
      rowKey: getListActivityRowKey(first),
      kind: "active",
    });
  });

  it("falls back to today's holiday when no activity covers today", () => {
    const past = activity({
      name: "Ended",
      startDate: "2026-09-01",
      endDate: "2026-09-03",
    });
    const holiday = { id: "ph-1", date: "2026-09-16" };

    const result = resolveListTodayAnchorKey([past], { "2026-09-16": [holiday] }, "2026-09-16", false);

    expect(result).toEqual({
      rowKey: "ph-1|2026-09-16",
      kind: "holiday",
    });
  });

  it("falls back to the nearest upcoming activity when today has no row", () => {
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

    const result = resolveListTodayAnchorKey([past, upcoming], {}, "2026-09-26", false);

    expect(result).toEqual({
      rowKey: getListActivityRowKey(upcoming),
      kind: "upcoming",
    });
  });

  it("returns null when the list has no activities or holidays", () => {
    expect(resolveListTodayAnchorKey([], {}, "2026-09-26", false)).toEqual({
      rowKey: null,
      kind: null,
    });
  });
});
