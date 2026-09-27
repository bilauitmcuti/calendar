import type { Metadata } from "next";

import { SITE_ORIGIN } from "@/lib/page-seo";

export const SITE_NAME = "Bila UiTM Cuti";
export const SITE_WEBSITE_ID = `${SITE_ORIGIN}/#website`;

/** Link child WebPage JSON-LD to the root WebSite entity. */
export const SITE_WEBSITE_JSON_LD_REF = {
  "@id": SITE_WEBSITE_ID,
} as const;

/** Shared site-name signals for Google site names and social previews. */
export const SITE_BRANDING_METADATA = {
  applicationName: SITE_NAME,
  other: {
    site_name: SITE_NAME,
  },
} satisfies Pick<Metadata, "applicationName" | "other">;

/** Google favicon guidance: square icon, at least 48×48. */
export const SITE_ICON_METADATA: Metadata["icons"] = {
  icon: [
    { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    { url: "/favicon.ico" },
  ],
  apple: "/apple-touch-icon.png",
  other: [
    { rel: "icon", url: "/android-chrome-192x192.png", sizes: "192x192" },
    { rel: "icon", url: "/favicon-16x16.png", sizes: "16x16" },
    { rel: "icon", url: "/favicon-32x32.png", sizes: "32x32" },
  ],
};
