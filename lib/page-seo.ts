import {
  getProgramCanonicalUrl,
  getProgramPageTitle,
  getProgramSeoDescription,
} from '@/lib/program-seo';

export const SITE_ORIGIN = 'https://bilauitmcuti.com';

export const HOMEPAGE_OG_IMAGE = `${SITE_ORIGIN}/og/main.png`;
export const HOMEPAGE_OG_IMAGE_ALT = 'Bila UiTM Cuti - Academic Calendar';

export const HOMEPAGE_SEO_TITLE = 'Bila UiTM Cuti - Kalendar Akademik';
export const HOMEPAGE_SEO_DESCRIPTION =
  'Kalendar akademik UiTM 2027 (Kumpulan A & B): tarikh kuliah, cuti pertengahan semester, peperiksaan akhir dan cuti semester. Dikemas kini mengikut takwim rasmi HEA UiTM.';

export const HOMEPAGE_LIST_SEO_TITLE = 'Bila UiTM Cuti - Senarai Kalendar Akademik';
export const HOMEPAGE_LIST_SEO_DESCRIPTION =
  'Senarai tarikh kalendar akademik UiTM 2027 untuk semua program — pendaftaran, kuliah, peperiksaan, dan cuti mengikut sesi.';

/** Crawlable H2s in the hidden SEO block. Year stays here, not in the page title. */
export const HOMEPAGE_SEO_SUBHEADINGS = [
  'Jadual Akademik UiTM 2027',
  'Takwim Cuti UiTM: Cuti Pertengahan Semester & Cuti Semester',
  'Kalendar Akademik Ikut Program',
] as const;

export const CHAT_SEO_TITLE = 'Chat';
export const CHAT_SEO_DESCRIPTION =
  'Tanya soalan kalendar akademik UiTM dengan pembantu AI. Semak tarikh cuti, pendaftaran, kuliah, dan peperiksaan.';

export const MCP_SEO_TITLE = 'MCP Server - Kalendar Akademik UiTM';
export const MCP_SEO_DESCRIPTION =
  'Connect Claude, Grok, Cursor, and other AI apps to read-only UiTM calendar and Malaysia public holiday dates. Allow access on first use.';

export const INTERNSHIP_SEO_TITLE = 'Find My Internship';
export const INTERNSHIP_SEO_DESCRIPTION =
  'Browse internship opportunities from multiple sources across Malaysia in one place.';

/** Primary program routes surfaced as sitelink targets (grid view, indexable). */
export const SITELINK_PROGRAM_SLUGS = [
  'foundation-professional',
  'pre-diploma',
  'diploma',
  'diploma-part-time',
  'bachelor',
  'bachelor-part-time',
  'master',
  'phd',
] as const;

/** WebPage entries in WebSite.hasPart — aligns sitelink snippets with meta descriptions. */
export function buildSiteNavigationSchemaElements() {
  const pages: Array<{
    '@type': 'WebPage';
    name: string;
    url: string;
    description: string;
  }> = [
    {
      '@type': 'WebPage',
      name: HOMEPAGE_SEO_TITLE,
      url: SITE_ORIGIN,
      description: HOMEPAGE_SEO_DESCRIPTION,
    },
    ...SITELINK_PROGRAM_SLUGS.map((slug) => ({
      '@type': 'WebPage' as const,
      name: getProgramPageTitle(slug),
      url: getProgramCanonicalUrl(slug),
      description: getProgramSeoDescription(slug),
    })),
    {
      '@type': 'WebPage',
      name: CHAT_SEO_TITLE,
      url: `${SITE_ORIGIN}/chat`,
      description: CHAT_SEO_DESCRIPTION,
    },
    {
      '@type': 'WebPage',
      name: MCP_SEO_TITLE,
      url: `${SITE_ORIGIN}/mcp`,
      description: MCP_SEO_DESCRIPTION,
    },
    {
      '@type': 'WebPage',
      name: INTERNSHIP_SEO_TITLE,
      url: `${SITE_ORIGIN}/internship`,
      description: INTERNSHIP_SEO_DESCRIPTION,
    },
  ];
  return pages;
}
