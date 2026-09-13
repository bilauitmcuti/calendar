import { describe, expect, it } from "vitest";
import { parsePublicHolidaysResponse, type PublicHolidayRow } from "./calendar-api";
import {
  academicDateRangeFromSessionIds,
  buildHolidaysByDateIndex,
  flattenHolidaysByYear,
  holidayVisibleForKKT,
  formatHolidayStates,
  holidayYearsForSessions,
  holidayYearsFromSessionIds,
  listMonthKeyFromIsoDate,
  sessionHolidayDateRange,
  yearsInclusiveFromRange,
} from "./public-holidays-for-view";

function holiday(partial: Partial<PublicHolidayRow> & Pick<PublicHolidayRow, "id" | "name" | "date">): PublicHolidayRow {
  return {
    day: "Monday",
    states: [],
    isSubjectToChange: false,
    ...partial,
  };
}

const nationwideStates = [
  "johor",
  "kedah",
  "kelantan",
  "melaka",
  "negeri-sembilan",
  "pahang",
  "perak",
  "perlis",
  "pulau-pinang",
  "sabah",
  "sarawak",
  "selangor",
  "terengganu",
  "kuala-lumpur",
  "labuan",
  "putrajaya",
];

const merdeka = holiday({
  id: "merdeka",
  name: "Hari Merdeka",
  date: "2026-08-31",
  states: nationwideStates,
});

const johorOnly = holiday({
  id: "johor-sultan",
  name: "Hari Keputeraan Sultan Johor",
  date: "2026-03-23",
  states: ["johor"],
});

const kedahOnly = holiday({
  id: "kedah-sultan",
  name: "Hari Keputeraan Sultan Kedah",
  date: "2026-06-15",
  states: ["kedah"],
});

describe("holidayVisibleForKKT", () => {
  it("shows every row when KKT is off", () => {
    expect(holidayVisibleForKKT(johorOnly, false)).toBe(true);
    expect(holidayVisibleForKKT(kedahOnly, false)).toBe(true);
    expect(holidayVisibleForKKT(merdeka, false)).toBe(true);
  });

  it("keeps nationwide and KKT state rows when KKT is on", () => {
    expect(holidayVisibleForKKT(merdeka, true)).toBe(true);
    expect(holidayVisibleForKKT(kedahOnly, true)).toBe(true);
  });

  it("hides non-KKT state-only rows when KKT is on", () => {
    expect(holidayVisibleForKKT(johorOnly, true)).toBe(false);
  });
});

describe("holidayYearsFromSessionIds", () => {
  it("returns academic-year calendar years for a session id", () => {
    expect(holidayYearsFromSessionIds(["B-20263"])).toEqual([2025, 2026]);
  });
});

describe("yearsInclusiveFromRange", () => {
  it("includes every calendar year a session spans", () => {
    expect(yearsInclusiveFromRange({ start: "2026-09-01", end: "2027-02-28" })).toEqual([
      2026, 2027,
    ]);
  });
});

describe("holidayYearsForSessions", () => {
  it("uses session labels so Sep 2026–Feb 2027 fetches 2026 and 2027", () => {
    expect(
      holidayYearsForSessions(["B-20264"], {
        sessionOptions: [{ id: "B-20264", label: "Sep 2026 - Feb 2027" }],
      })
    ).toEqual([2026, 2027]);
  });

  it("uses a single-year label without inventing extra years", () => {
    expect(
      holidayYearsForSessions(["B-20272"], {
        sessionOptions: [{ id: "B-20272", label: "Mar 2027 - Jul 2027" }],
      })
    ).toEqual([2027]);
  });

  it("clips to API yearOptions so unpublished years are not requested", () => {
    expect(
      holidayYearsForSessions(["B-20263"], {
        allowedYears: [2026, 2027],
      })
    ).toEqual([2026]);
  });
});

describe("academicDateRangeFromSessionIds", () => {
  it("uses Aug of Y-1 through Jul of Y", () => {
    expect(academicDateRangeFromSessionIds(["B-20263"])).toEqual({
      start: "2025-08-01",
      end: "2026-07-31",
    });
  });
});

describe("sessionHolidayDateRange", () => {
  it("clips to the session label window, not the full fetched years", () => {
    expect(
      sessionHolidayDateRange(["B-20264"], {
        sessionOptions: [{ id: "B-20264", label: "Sep 2026 - Feb 2027" }],
      })
    ).toEqual({
      start: "2026-09-01",
      end: "2027-02-28",
    });
  });
});

describe("formatHolidayStates", () => {
  it("summarizes nationwide rows and lists state names", () => {
    expect(formatHolidayStates(nationwideStates)).toBe("Nationwide");
    expect(formatHolidayStates(["kedah", "kelantan"])).toBe("Kedah, Kelantan");
  });
});

describe("buildHolidaysByDateIndex", () => {
  it("keeps only holidays inside Sep 2026–Feb 2027", () => {
    const index = buildHolidaysByDateIndex([merdeka, johorOnly, kedahOnly], {
      showKKT: false,
      range: { start: "2026-09-01", end: "2027-02-28" },
    });
    expect(index["2026-08-31"]).toBeUndefined();
    expect(index["2026-03-23"]).toBeUndefined();
    expect(index["2026-06-15"]).toBeUndefined();
  });

  it("clips rows to the session date range", () => {
    const index = buildHolidaysByDateIndex([merdeka, johorOnly, kedahOnly], {
      showKKT: false,
      range: { start: "2026-04-01", end: "2026-07-31" },
    });
    expect(Object.keys(index)).toEqual(["2026-06-15"]);
    expect(index["2026-06-15"]?.[0]?.id).toBe("kedah-sultan");
  });

  it("applies KKT filter after clipping", () => {
    const index = buildHolidaysByDateIndex([merdeka, johorOnly, kedahOnly], {
      showKKT: true,
      range: { start: "2026-01-01", end: "2026-12-31" },
    });
    expect(index["2026-03-23"]).toBeUndefined();
    expect(index["2026-08-31"]?.[0]?.id).toBe("merdeka");
    expect(index["2026-06-15"]?.[0]?.id).toBe("kedah-sultan");
  });
});

describe("flattenHolidaysByYear", () => {
  it("dedupes the same holiday across years", () => {
    const rows = flattenHolidaysByYear({
      2026: [merdeka],
      2025: [merdeka],
    });
    expect(rows).toHaveLength(1);
  });
});

describe("parsePublicHolidaysResponse yearOptions", () => {
  it("reads growing dataset years from the API payload", () => {
    const parsed = parsePublicHolidaysResponse({
      defaultYear: 2026,
      yearOptions: [
        { value: 2026, label: "2026" },
        { value: "2027", label: "2027" },
      ],
      holidays: [],
    });
    expect(parsed.yearOptions).toEqual([2026, 2027]);
  });
});

describe("listMonthKeyFromIsoDate", () => {
  it("matches list section month keys", () => {
    expect(listMonthKeyFromIsoDate("2026-03-23")).toBe("March 2026");
  });
});
