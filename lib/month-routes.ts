import { HOMEPAGE_OG_IMAGE, SITE_ORIGIN } from "@/lib/page-seo";
import { isSessionIdQueryKey } from "@/lib/session-query";
import {
  getLabelForProgramValue,
  getProgramFromRoute,
  getRouteFromProgram,
  isValidProgramRoute,
  type ProgramValue,
} from "@/lib/route-utils";

export type MonthView = "grid" | "upcoming";

export const MONTH_PROGRAMS: ProgramValue[] = [
  "All",
  "Foundation/Professional",
  "PreDiploma",
  "Diploma",
  "DiplomaPartTime",
  "Bachelor",
  "BachelorPartTime",
  "Master",
  "PhD",
];

export function getMonthRoutePath(program: ProgramValue, view: MonthView): string {
  const segment = getRouteFromProgram(program);
  const base = program === "All" || segment === "" ? "/calendar" : `/calendar/${segment}`;
  return view === "upcoming" ? `${base}/list` : base;
}

const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface MonthHrefOptions {
  today?: string;
  defaultSessionId?: string;
}

/** Bare keys only, and only when they are not the default. `/calendar?2026-12&B-20263` */
export function buildMonthHref(
  program: ProgramValue,
  view: MonthView,
  month: string,
  sessionId: string,
  options: MonthHrefOptions = {}
): string {
  const path = getMonthRoutePath(program, view);
  const parts: string[] = [];
  const currentMonth = options.today?.slice(0, 7);
  if (!currentMonth || month !== currentMonth) parts.push(month);
  if (isSessionIdQueryKey(sessionId) && sessionId !== options.defaultSessionId) parts.push(sessionId);
  if (parts.length === 0) return path;
  return `${path}?${parts.join("&")}`;
}

/** Reads the clean keys, and the older `month` / `session` params. */
export function parseMonthSearch(params: URLSearchParams): { month?: string; sessionId?: string } {
  let month = params.get("month") ?? undefined;
  let sessionId = params.get("session") ?? undefined;
  for (const key of params.keys()) {
    if (MONTH_KEY.test(key)) month = key;
    else if (isSessionIdQueryKey(key)) sessionId = key;
  }
  return { month, sessionId };
}

export function monthProgramFromSlug(slug: string | undefined): ProgramValue | null {
  if (!slug) return "All";
  if (!isValidProgramRoute(slug)) return null;
  const program = getProgramFromRoute(slug);
  return program === "All" ? null : program;
}

export function monthProgramLabel(program: ProgramValue): string {
  if (program === "All") return "All";
  return getLabelForProgramValue(program);
}

export interface MonthCalendarSeo {
  title: string;
  description: string;
  pathname: string;
  canonical: string;
  coverImage: string;
  view: MonthView;
  program: ProgramValue;
}

export function monthCalendarSeo(program: ProgramValue, view: MonthView): MonthCalendarSeo {
  const label = monthProgramLabel(program);
  const pathname = getMonthRoutePath(program, view);
  const audience = program === "All" ? "semua program" : label;
  const title =
    view === "upcoming"
      ? program === "All"
        ? "Bila UiTM Cuti - Senarai Kalendar"
        : `${label} - Senarai Kalendar`
      : program === "All"
        ? "Bila UiTM Cuti - Calendar"
        : `${label} - Calendar`;
  const description =
    view === "upcoming"
      ? program === "All"
        ? "Senarai tarikh kalendar akademik UiTM 2027 untuk semua program — pendaftaran, kuliah, peperiksaan, dan cuti mengikut sesi."
        : `Senarai tarikh kalendar akademik UiTM 2027 untuk ${audience}. Semak pendaftaran, kuliah, peperiksaan, dan cuti mengikut sesi.`
      : program === "All"
        ? "Paparan bulan kalendar akademik UiTM 2027 (Kumpulan A & B): tarikh kuliah, cuti pertengahan semester, peperiksaan akhir, dan cuti umum. Dikemas kini mengikut takwim rasmi HEA UiTM."
        : `Paparan bulan kalendar akademik UiTM 2027 untuk ${audience}. Semak tarikh kuliah, cuti pertengahan semester, peperiksaan, pendaftaran, dan cuti umum.`;
  return {
    title,
    description,
    pathname,
    canonical: `${SITE_ORIGIN}${pathname}`,
    coverImage: HOMEPAGE_OG_IMAGE,
    view,
    program,
  };
}

/** `/calendar`, `/calendar/list`, `/calendar/diploma`, `/calendar/diploma/list`. */
export function monthCalendarSeoFromPath(pathname: string): MonthCalendarSeo | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "calendar") return null;
  const rest = segments.slice(1);
  const isList = rest[rest.length - 1] === "list";
  const slug = isList ? rest[0] : rest[0];
  if (isList && rest.length > 2) return null;
  if (!isList && rest.length > 1) return null;
  const program = monthProgramFromSlug(isList && rest.length === 1 ? undefined : slug);
  if (!program) return null;
  return monthCalendarSeo(program, isList ? "upcoming" : "grid");
}
