export const runtime = 'edge';

import { CalendarSeoLinks } from '@/components/calendar-seo-links';
import { CalendarWrapper } from '@/components/calendar-wrapper';
import { PageSeoBlock } from '@/components/page-seo-block';
import { buildCalendarPageMetadata } from '@/lib/calendar-seo-metadata';
import {
  HOMEPAGE_LIST_SEO_DESCRIPTION,
  HOMEPAGE_LIST_SEO_TITLE,
  SITE_ORIGIN,
} from '@/lib/page-seo';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface ListMetadataProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: ListMetadataProps): Promise<Metadata> {
  const sp = await searchParams;
  return buildCalendarPageMetadata({
    pathname: '/list',
    viewMode: 'list',
    searchParams: sp,
  });
}

// All programs, List view
export default function ListPage() {
  return (
    <>
      <PageSeoBlock
        heading={HOMEPAGE_LIST_SEO_TITLE}
        description={HOMEPAGE_LIST_SEO_DESCRIPTION}
        url={`${SITE_ORIGIN}/list`}
      />
      <CalendarSeoLinks gridHref="/" />
      <CalendarWrapper viewMode="list" programFromRoute="All" />
    </>
  );
}
