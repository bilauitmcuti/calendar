import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadMonthCalendar } from "@/lib/month-calendar-load";
import type { MonthView } from "@/lib/month-routes";
import { monthCalendarSeo, monthProgramFromSlug, parseMonthSearch } from "@/lib/month-routes";
import { HOMEPAGE_OG_IMAGE_ALT } from "@/lib/page-seo";
import { MonthPage } from "@/components/month-calendar/month-page";

interface MonthRouteProps {
  programSlug?: string;
  view: MonthView;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export async function monthRouteMetadata({
  programSlug,
  view,
}: {
  programSlug?: string;
  view: MonthView;
}): Promise<Metadata> {
  const program = monthProgramFromSlug(programSlug);
  if (programSlug && !program) return {};
  const seo = monthCalendarSeo(program ?? "All", view);
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      siteName: "Bila UiTM Cuti",
      title: seo.title,
      description: seo.description,
      type: "website",
      url: seo.canonical,
      locale: "ms_MY",
      images: [{ url: seo.coverImage, width: 1200, height: 630, alt: HOMEPAGE_OG_IMAGE_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [seo.coverImage],
    },
  };
}

export async function MonthRoute({ programSlug, view, searchParams }: MonthRouteProps) {
  const program = monthProgramFromSlug(programSlug);
  if (!program) notFound();
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) query.append(key, item);
  }
  const parsed = parseMonthSearch(query);
  const payload = await loadMonthCalendar({
    program,
    view,
    monthParam: parsed.month,
    sessionParam: parsed.sessionId,
    dateParam: firstParam(params.date),
  });
  return <MonthPage payload={payload} />;
}
