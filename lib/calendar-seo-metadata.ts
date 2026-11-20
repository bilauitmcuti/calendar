import type { Metadata } from "next";
import {
  buildCalendarAbsoluteUrl,
  parseSessionIdsFromSearchParams,
} from "@/lib/session-query";
import { parseFilterKeysFromSearchParams } from "@/lib/filter-query";
import {
  getProgramCanonicalUrl,
  getProgramListCanonicalUrl,
  getProgramListPageTitle,
  getProgramListSeoDescription,
  getProgramPageTitle,
  getProgramSeoDescription,
} from "@/lib/program-seo";
import { isValidProgramRoute } from "@/lib/route-utils";
import { monthCalendarSeoFromPath } from "@/lib/month-routes";
import {
  HOMEPAGE_LIST_SEO_DESCRIPTION,
  HOMEPAGE_LIST_SEO_TITLE,
  HOMEPAGE_SEO_DESCRIPTION,
  HOMEPAGE_SEO_TITLE,
  SITE_ORIGIN,
} from "@/lib/page-seo";
const GRID_COVER = `${SITE_ORIGIN}/og/main.png`;
const LIST_COVER = `${SITE_ORIGIN}/og/list.png`;

type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | undefined;

function toURLSearchParams(input: SearchParamsInput): URLSearchParams {
  if (!input) return new URLSearchParams();
  if (input instanceof URLSearchParams) return input;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else {
      params.set(key, value);
    }
  }
  return params;
}

export interface CalendarSeoOptions {
  pathname: string;
  viewMode: "grid" | "list";
  programSlug?: string;
  searchParams?: SearchParamsInput;
}

export interface CalendarPageSeo {
  title: string;
  description: string;
  canonical: string;
  coverImage: string;
  viewMode: "grid" | "list";
}

/** Parse pathname into view mode and optional program slug (client history.replaceState safe). */
export function parseCalendarPathname(pathname: string): {
  viewMode: "grid" | "list";
  programSlug?: string;
} {
  const segments = pathname.split("/").filter(Boolean);
  const isList = segments[segments.length - 1] === "list";
  const viewMode = isList ? "list" : "grid";

  let programSlug: string | undefined;
  if (isList && segments.length >= 2) {
    programSlug = segments[0];
  } else if (!isList && segments.length >= 1 && segments[0] !== "list") {
    programSlug = segments[0];
  }

  return { viewMode, programSlug };
}

export function resolveCalendarSeoContent(
  viewMode: "grid" | "list",
  programSlug?: string
): CalendarPageSeo {
  const isList = viewMode === "list";
  const coverImage = isList ? LIST_COVER : GRID_COVER;

  if (programSlug && isValidProgramRoute(programSlug)) {
    return {
      title: isList ? getProgramListPageTitle(programSlug) : getProgramPageTitle(programSlug),
      description: isList
        ? getProgramListSeoDescription(programSlug)
        : getProgramSeoDescription(programSlug),
      canonical: isList
        ? getProgramListCanonicalUrl(programSlug)
        : getProgramCanonicalUrl(programSlug),
      coverImage,
      viewMode,
    };
  }

  if (isList) {
    return {
      title: HOMEPAGE_LIST_SEO_TITLE,
      description: HOMEPAGE_LIST_SEO_DESCRIPTION,
      canonical: `${SITE_ORIGIN}/list`,
      coverImage,
      viewMode,
    };
  }

  return {
    title: HOMEPAGE_SEO_TITLE,
    description: HOMEPAGE_SEO_DESCRIPTION,
    canonical: SITE_ORIGIN,
    coverImage,
    viewMode,
  };
}

export function resolveCalendarSeoFromPathname(pathname: string): CalendarPageSeo {
  const monthCalendar = monthCalendarSeoFromPath(pathname);
  if (monthCalendar) {
    return {
      title: monthCalendar.title,
      description: monthCalendar.description,
      canonical: monthCalendar.canonical,
      coverImage: monthCalendar.coverImage,
      viewMode: monthCalendar.view === "upcoming" ? "list" : "grid",
    };
  }
  const { viewMode, programSlug } = parseCalendarPathname(pathname);
  return resolveCalendarSeoContent(viewMode, programSlug);
}

export function buildCalendarPageMetadata(options: CalendarSeoOptions): Metadata {
  const { pathname, viewMode, programSlug } = options;
  const params = toURLSearchParams(options.searchParams);
  const sessionIds = parseSessionIdsFromSearchParams(params);
  const filterKeys = parseFilterKeysFromSearchParams(params);
  const seo = resolveCalendarSeoContent(viewMode, programSlug);
  const { title, description, canonical, coverImage } = seo;

  const ogUrl =
    sessionIds.length > 0 || filterKeys.length > 0
      ? buildCalendarAbsoluteUrl(pathname, sessionIds, filterKeys)
      : canonical;

  const metadata: Metadata = {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      siteName: "Bila UiTM Cuti",
      title,
      description,
      type: "website",
      url: ogUrl,
      locale: "ms_MY",
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [coverImage],
    },
  };

  return metadata;
}
