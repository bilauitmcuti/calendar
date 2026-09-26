export function SiteFooter() {
  return (
    <footer
      className="mt-8 border-t border-border pt-6 standalone:hidden"
      aria-label="Footer"
    >
      <p className="flex flex-wrap items-center justify-center gap-x-1 text-balance text-center text-sm font-medium text-foreground sm:flex-nowrap">
        <span>
          Find internships from multiple sources across Malaysia on Find My
          Internship.
        </span>
        <a
          href="/internship"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-primary underline underline-offset-2 hover:underline"
        >
          Browse Now
          <span className="sr-only"> (opens in new tab)</span>
        </a>
      </p>
    </footer>
  );
}
