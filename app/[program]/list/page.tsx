export const runtime = 'edge';

import { CalendarWrapper } from '@/components/calendar-wrapper';
import { notFound } from 'next/navigation';
import { isValidProgramRoute, getProgramDisplayName } from '@/lib/route-utils';
import {
  getProgramListCanonicalUrl,
  getProgramListSeoDescription,
  getProgramPageTitle,
} from '@/lib/program-seo';
import { buildCalendarPageMetadata } from '@/lib/calendar-seo-metadata';
import { SITE_WEBSITE_JSON_LD_REF } from '@/lib/site-branding';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface ProgramListMetadataProps {
  params: Promise<{
    program: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface ProgramListPageProps {
  params: Promise<{
    program: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
  searchParams,
}: ProgramListMetadataProps): Promise<Metadata> {
  const { program } = await params;

  if (!isValidProgramRoute(program)) {
    return {};
  }

  const sp = await searchParams;
  return buildCalendarPageMetadata({
    pathname: `/${program}/list`,
    viewMode: 'list',
    programSlug: program,
    searchParams: sp,
  });
}

function ProgramListJsonLd({ program }: { program: string }) {
  const programName = getProgramDisplayName(program);
  const title = getProgramPageTitle(program);
  const description = getProgramListSeoDescription(program);
  const canonical = getProgramListCanonicalUrl(program);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://bilauitmcuti.com" },
                { "@type": "ListItem", "position": 2, "name": programName, "item": canonical },
              ],
            },
            {
              "@type": "WebPage",
              "name": title,
              "url": canonical,
              "description": description,
              "isPartOf": SITE_WEBSITE_JSON_LD_REF,
            },
          ],
        }),
      }}
    />
  );
}

export default async function ProgramListPage({
  params,
  searchParams,
}: ProgramListPageProps) {
  const { program } = await params;
  await searchParams;

  if (!isValidProgramRoute(program)) {
    notFound();
  }

  return (
    <>
      <ProgramListJsonLd program={program} />
      <CalendarWrapper viewMode="list" programFromRoute={program} />
    </>
  );
}
