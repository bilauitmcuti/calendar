import { resolveCalendarSeoFromPathname } from "@/lib/calendar-seo-metadata";
import { SITE_NAME } from "@/lib/site-branding";
import { hasFilterQueryParams } from "@/lib/filter-query";
import { hasSessionQueryParams } from "@/lib/session-query";

const SITE_ORIGIN = "https://bilauitmcuti.com";

function getPathnameOnly(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname || "/";
}

function getSiteOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return SITE_ORIGIN;
}

function buildAbsoluteFromPathname(pathname: string): string {
  const origin = getSiteOrigin();
  if (pathname === "/") return origin;
  return `${origin}${pathname}`;
}

/** Path-only URL for sharing and canonical (no session/filter query). */
export function getPageShareUrl(): string {
  if (typeof window === "undefined") return SITE_ORIGIN;
  return buildAbsoluteFromPathname(getPathnameOnly());
}

/**
 * og:url for client sync: matches the address bar when it has session or filter query keys;
 * otherwise path-only (same as share URL).
 */
export function getPageOpenGraphUrl(): string {
  if (typeof window === "undefined") return SITE_ORIGIN;
  const pathname = getPathnameOnly();
  const base = buildAbsoluteFromPathname(pathname);
  const search = window.location.search;
  if (!search) return base;
  const params = new URLSearchParams(search);
  if (!hasSessionQueryParams(params) && !hasFilterQueryParams(params)) return base;
  return `${base}${search}`;
}

function upsertMetaContent(
  selector: string,
  create: () => HTMLElement,
  content: string
): void {
  let el = document.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Keep document title and core meta tags aligned after client-side URL changes. */
export function syncPageDocumentSeo(pathname?: string): void {
  if (typeof document === "undefined") return;

  const path =
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const { title, description, coverImage } = resolveCalendarSeoFromPathname(path);

  document.title = title;

  upsertMetaContent(
    'meta[name="description"]',
    () => {
      const meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      return meta;
    },
    description
  );

  for (const property of ["og:site_name", "og:title", "og:description", "og:image"] as const) {
    const content =
      property === "og:site_name"
        ? SITE_NAME
        : property === "og:title"
          ? title
          : property === "og:description"
            ? description
            : coverImage;
    upsertMetaContent(
      `meta[property="${property}"]`,
      () => {
        const meta = document.createElement("meta");
        meta.setAttribute("property", property);
        return meta;
      },
      content
    );
  }

  for (const name of ["twitter:title", "twitter:description", "twitter:image"] as const) {
    const content =
      name === "twitter:title"
        ? title
        : name === "twitter:description"
          ? description
          : coverImage;
    upsertMetaContent(
      `meta[name="${name}"]`,
      () => {
        const meta = document.createElement("meta");
        meta.setAttribute("name", name);
        return meta;
      },
      content
    );
  }
}

/** Canonical and share stay clean; og:url includes session/filter query when present in the URL. */
export function syncPageShareUrl(): void {
  if (typeof document === "undefined") return;

  const canonicalUrl = getPageShareUrl();
  const ogUrl = getPageOpenGraphUrl();

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", canonicalUrl);

  let ogUrlMeta = document.querySelector('meta[property="og:url"]');
  if (!ogUrlMeta) {
    ogUrlMeta = document.createElement("meta");
    ogUrlMeta.setAttribute("property", "og:url");
    document.head.appendChild(ogUrlMeta);
  }
  ogUrlMeta.setAttribute("content", ogUrl);

  syncPageDocumentSeo();
}

/** Replace address bar with a clean path (no session/filter query). */
export function replaceCalendarHistoryUrl(path: string): void {
  if (typeof window === "undefined") return;
  window.history.replaceState(null, "", path);
  syncPageShareUrl();
}
