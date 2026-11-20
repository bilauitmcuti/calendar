export const runtime = 'edge';

import { CalendarSeoLinks } from '@/components/calendar-seo-links';
import { CalendarWrapper } from '@/components/calendar-wrapper';
import { PageSeoBlock } from '@/components/page-seo-block';
import { notFound } from 'next/navigation';
import { isValidProgramRoute, getProgramDisplayName } from '@/lib/route-utils';
import {
  getProgramCanonicalUrl,
  getProgramListCanonicalUrl,
  getProgramListPageTitle,
  getProgramListSeoDescription,
} from '@/lib/program-seo';
import { SITE_ORIGIN } from '@/lib/page-seo';
import { buildCalendarPageMetadata } from '@/lib/calendar-seo-metadata';
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

function ProgramListSeo({ program }: { program: string }) {
  const programName = getProgramDisplayName(program);
  return (
    <>
      <PageSeoBlock
        heading={getProgramListPageTitle(program)}
        description={getProgramListSeoDescription(program)}
        url={getProgramListCanonicalUrl(program)}
        breadcrumbs={[
          { name: 'Laman Utama', item: SITE_ORIGIN },
          { name: programName, item: getProgramCanonicalUrl(program) },
          { name: 'Senarai tarikh', item: getProgramListCanonicalUrl(program) },
        ]}
      />
      <CalendarSeoLinks gridHref={`/${program}`} />
    </>
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
      <ProgramListSeo program={program} />
      <CalendarWrapper viewMode="list" programFromRoute={program} />
    </>
  );
}
