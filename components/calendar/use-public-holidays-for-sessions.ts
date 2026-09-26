"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { fetchPublicHolidays } from "@/lib/calendar-api";
import type { PublicHolidayRow } from "@/lib/calendar-api";
import { getSessionOptions, type SessionId } from "@/lib/data";
import {
  buildHolidaysByDateIndex,
  flattenHolidaysByYear,
  holidayYearsForSessions,
  sessionHolidayDateRange,
  type PublicHolidaysByYear,
} from "@/lib/public-holidays-for-view";

export function usePublicHolidaysForSessions(
  sessionIds: SessionId[],
  showKKT: boolean,
  initialByYear: PublicHolidaysByYear | null | undefined,
  calendarDataVersion: number
): Record<string, PublicHolidayRow[]> {
  const [byYear, setByYear] = useState<PublicHolidaysByYear>(() => initialByYear ?? {});
  const [allowedYears, setAllowedYears] = useState<number[]>([]);
  const byYearRef = useRef(byYear);

  useEffect(() => {
    byYearRef.current = byYear;
  }, [byYear]);

  useEffect(() => {
    if (!initialByYear) return;
    setByYear((prev) => {
      const alreadyApplied = Object.keys(initialByYear).every(
        (year) => prev[Number(year)] === initialByYear[Number(year)]
      );
      if (alreadyApplied) return prev;
      return { ...initialByYear, ...prev };
    });
  }, [initialByYear]);

  const years = useMemo(() => {
    void calendarDataVersion;
    return holidayYearsForSessions(sessionIds, {
      allowedYears: allowedYears.length > 0 ? allowedYears : undefined,
      sessionOptions: getSessionOptions(),
    });
  }, [sessionIds, calendarDataVersion, allowedYears]);

  useEffect(() => {
    if (years.length === 0) return;
    const missing = years.filter((year) => byYearRef.current[year] == null);
    if (missing.length === 0) return;

    let cancelled = false;
    void Promise.all(
      missing.map((year) =>
        fetchPublicHolidays({ coverage: "all", year }).catch(() => ({
          holidays: [] as PublicHolidayRow[],
          yearOptions: [] as number[],
        }))
      )
    ).then((results) => {
      if (cancelled) return;
      const nextAllowed = new Set(allowedYears);
      for (const result of results) {
        for (const year of result.yearOptions ?? []) nextAllowed.add(year);
      }
      if (nextAllowed.size > 0) setAllowedYears([...nextAllowed].sort((a, b) => a - b));
      setByYear((prev) => {
        const next = { ...prev };
        for (let i = 0; i < missing.length; i++) {
          next[missing[i]!] = results[i]?.holidays ?? [];
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [years, allowedYears]);

  const range = useMemo(() => {
    void calendarDataVersion;
    return sessionHolidayDateRange(sessionIds, {
      sessionOptions: getSessionOptions(),
    });
  }, [sessionIds, calendarDataVersion]);

  return useMemo(
    () =>
      buildHolidaysByDateIndex(flattenHolidaysByYear(byYear), {
        showKKT,
        range,
      }),
    [byYear, showKKT, range]
  );
}
