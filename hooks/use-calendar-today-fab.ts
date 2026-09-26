"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ViewMode } from "@/app/page";
import { listMonthKeyFromIsoDate } from "@/lib/public-holidays-for-view";
import { trackZarazEvent, ZARAZ_EVENTS } from "@/lib/zaraz";

const SCROLL_SETTLE_MS = 150;
const IDLE_HIDE_MS = 5000;
const PROGRAMMATIC_SCROLL_MS = 800;

interface UseCalendarTodayFabOptions {
  viewMode: ViewMode;
  todayStr: string;
  todayInRange: boolean;
  /** List view only: row key the list marks with data-list-today-anchor. */
  listTodayAnchorKey?: string | null;
  program: string;
  sessionIds: string[];
  /** Bumps when calendar data or filters change so the observer rebinds. */
  anchorVersion: number | string;
}

function findTodayAnchor(viewMode: ViewMode, todayStr: string): Element | null {
  const root = document.querySelector(`[data-calendar-view="${viewMode}"]`);
  if (!root) return null;

  if (viewMode === "list") {
    return root.querySelector("[data-list-today-anchor]");
  }

  const dateEl = root.querySelector(`[data-calendar-date="${todayStr}"]`);
  if (dateEl) return dateEl;

  const monthKey = listMonthKeyFromIsoDate(todayStr);
  for (const el of root.querySelectorAll("[data-calendar-month]")) {
    if (el.getAttribute("data-calendar-month") === monthKey) return el;
  }
  return null;
}

export function useCalendarTodayFab({
  viewMode,
  todayStr,
  todayInRange,
  listTodayAnchorKey = null,
  program,
  sessionIds,
  anchorVersion,
}: UseCalendarTodayFabOptions) {
  const [isTodayInView, setIsTodayInView] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [idleHidden, setIdleHidden] = useState(false);
  const programmaticScrollRef = useRef(false);

  useEffect(() => {
    const canTarget = viewMode === "list" ? Boolean(listTodayAnchorKey) : todayInRange && Boolean(todayStr);
    if (!canTarget) {
      setIsTodayInView(true);
      return;
    }

    let cancelled = false;
    let observer: IntersectionObserver | null = null;

    const attach = () => {
      observer?.disconnect();
      observer = null;
      const el = findTodayAnchor(viewMode, todayStr);
      if (!el) {
        // List row may not be committed yet. Leave visibility unchanged so the FAB
        // does not stick open while waiting for data-list-today-anchor.
        if (viewMode !== "list" && !cancelled) setIsTodayInView(false);
        return;
      }
      observer = new IntersectionObserver(
        ([entry]) => {
          if (cancelled || !entry) return;
          setIsTodayInView(entry.isIntersecting && entry.intersectionRatio >= 0.35);
        },
        {
          threshold: [0, 0.35, 0.6, 1],
          rootMargin: "-96px 0px -120px 0px",
        }
      );
      observer.observe(el);
    };

    attach();
    const frame = requestAnimationFrame(attach);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [viewMode, todayStr, todayInRange, listTodayAnchorKey, anchorVersion]);

  useEffect(() => {
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const clearTimers = () => {
      if (settleTimer) clearTimeout(settleTimer);
      if (idleTimer) clearTimeout(idleTimer);
      settleTimer = null;
      idleTimer = null;
    };

    const onActivity = () => {
      if (programmaticScrollRef.current) return;
      setIsScrolling(true);
      setIdleHidden(false);
      clearTimers();
      settleTimer = setTimeout(() => {
        setIsScrolling(false);
        idleTimer = setTimeout(() => setIdleHidden(true), IDLE_HIDE_MS);
      }, SCROLL_SETTLE_MS);
    };

    const opts: AddEventListenerOptions = { passive: true, capture: true };
    window.addEventListener("scroll", onActivity, opts);
    window.addEventListener("wheel", onActivity, opts);
    window.addEventListener("touchmove", onActivity, opts);

    return () => {
      window.removeEventListener("scroll", onActivity, opts);
      window.removeEventListener("wheel", onActivity, opts);
      window.removeEventListener("touchmove", onActivity, opts);
      clearTimers();
    };
  }, []);

  const scrollToToday = useCallback(() => {
    if (!todayStr) return;
    const el = findTodayAnchor(viewMode, todayStr);
    if (!el) return;

    programmaticScrollRef.current = true;
    setIdleHidden(true);
    setIsScrolling(false);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      programmaticScrollRef.current = false;
    }, PROGRAMMATIC_SCROLL_MS);

    trackZarazEvent(ZARAZ_EVENTS.goToToday, {
      view: viewMode,
      program,
      calendar_session_ids: sessionIds.join(","),
      date: todayStr,
    });
  }, [viewMode, todayStr, program, sessionIds]);

  const canShow = viewMode === "list" ? Boolean(listTodayAnchorKey) : todayInRange;
  const shouldShow = canShow && !isTodayInView && !isScrolling && !idleHidden;

  return { shouldShow, scrollToToday };
}
