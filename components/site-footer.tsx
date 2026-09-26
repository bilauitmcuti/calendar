import Link from "next/link";
import { SITE_ORIGIN } from "@/lib/page-seo";

const INTERNSHIP_URL = `${SITE_ORIGIN}/internship`;

export function SiteFooter() {
  return (
    <footer
      className="mt-8 border-t border-border pt-6 standalone:hidden"
      aria-label="Footer"
    >
      <p className="flex flex-wrap items-center justify-center gap-x-1 text-balance text-center text-sm font-medium text-foreground sm:flex-nowrap">
        <span>
          Find internships from many sources across Malaysia on Find My
          Internship.
        </span>
        <Link
          href={INTERNSHIP_URL}
          className="shrink-0 text-primary underline underline-offset-2 hover:underline"
        >
          Browse Now
        </Link>
      </p>
    </footer>
  );
}
