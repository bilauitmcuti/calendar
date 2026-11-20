export const runtime = 'edge';
import type { Metadata } from 'next';
import { buildCalendarPageMetadata } from '@/lib/calendar-seo-metadata';

// Export types for use in other components
export type ViewMode = 'list' | 'grid';


import { CalendarWrapper } from '@/components/calendar-wrapper';
import { CalendarSeoLinks } from '@/components/calendar-seo-links';
import { PageSeoBlock } from '@/components/page-seo-block';
import {
  HOMEPAGE_SEO_DESCRIPTION,
  HOMEPAGE_SEO_SUBHEADINGS,
  HOMEPAGE_SEO_TITLE,
  SITE_ORIGIN,
} from '@/lib/page-seo';

interface HomeMetadataProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: HomeMetadataProps): Promise<Metadata> {
  const sp = await searchParams;
  return buildCalendarPageMetadata({
    pathname: '/',
    viewMode: 'grid',
    searchParams: sp,
  });
}

// Homepage: All programs, Grid view (default)
export default function Page() {
  return (
    <>
      <PageSeoBlock
        heading={HOMEPAGE_SEO_TITLE}
        description={HOMEPAGE_SEO_DESCRIPTION}
        url={SITE_ORIGIN}
        subheadings={HOMEPAGE_SEO_SUBHEADINGS}
      />
      <CalendarSeoLinks listHref="/list" />
      <CalendarWrapper viewMode="grid" programFromRoute="All" />
    </>
  );
}
