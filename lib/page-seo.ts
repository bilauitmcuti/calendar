import {
  getProgramCanonicalUrl,
  getProgramPageTitle,
  getProgramSeoDescription,
} from '@/lib/program-seo';

export const SITE_ORIGIN = 'https://bilauitmcuti.com';

export const HOMEPAGE_SEO_TITLE = 'Bila UiTM Cuti - Kalendar Akademik';
export const HOMEPAGE_SEO_DESCRIPTION =
  'Kalendar akademik UiTM interaktif. Lihat jadual pendaftaran, kuliah, peperiksaan, dan cuti semester.';

export const HOMEPAGE_LIST_SEO_DESCRIPTION =
  'Paparan senarai kalendar akademik UiTM untuk semua program. Semak tarikh pendaftaran, kuliah, peperiksaan, dan cuti mengikut sesi.';

export const CHAT_SEO_TITLE = 'Chat';
export const CHAT_SEO_DESCRIPTION =
  'Tanya soalan kalendar akademik UiTM dengan pembantu AI. Semak tarikh cuti, pendaftaran, kuliah, dan peperiksaan.';

export const MCP_SEO_TITLE = 'MCP Server';
export const MCP_SEO_DESCRIPTION =
  'Connect Claude and other AI assistants to the Bila UiTM Cuti MCP server for UiTM academic calendar dates and Malaysia public holidays.';

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
