import Link from "next/link";
import { SITELINK_PROGRAM_SLUGS } from "@/lib/page-seo";
import { getProgramDisplayName } from "@/lib/route-utils";

interface CalendarSeoLinksProps {
  listHref?: string;
  gridHref?: string;
}

/** Text links for crawlers. Stays visually hidden; the calendar UI already has the view toggle. */
export function CalendarSeoLinks({ listHref, gridHref }: CalendarSeoLinksProps) {
  return (
    <nav aria-label="Program shortcuts" className="sr-only">
      <ul>
        {SITELINK_PROGRAM_SLUGS.map((slug) => (
          <li key={slug}>
            <Link href={`/${slug}`}>{getProgramDisplayName(slug)}</Link>
          </li>
        ))}
        <li>
          <Link href="/about">Tentang</Link>
        </li>
        {listHref ? (
          <li>
            <Link href={listHref}>Lihat senarai penuh tarikh</Link>
          </li>
        ) : null}
        {gridHref ? (
          <li>
            <Link href={gridHref}>Kalendar</Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
