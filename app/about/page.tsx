'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BrandName } from '@/components/brand-name';
import { SITE_ORIGIN } from '@/lib/page-seo';

const POLICY_URL = `${SITE_ORIGIN}/policy`;

const programsText =
  'Foundation/Professional, Pre-Diploma, Diploma, Diploma (Part-Time), Bachelor, Bachelor (Part-Time), Master, and PhD.';

export default function AboutPage() {
  const router = useRouter();
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollTop = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentScrollTop = window.scrollY;
      if (currentScrollTop <= 10 || currentScrollTop < lastScrollTop.current) {
        setHeaderVisible(true);
      } else if (currentScrollTop > lastScrollTop.current) {
        setHeaderVisible(false);
      }
      lastScrollTop.current = currentScrollTop;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="chat-top-fade pointer-events-none absolute left-0 right-0 top-0 z-[9]" />

      <div
        className={`chat-header absolute left-0 right-0 top-0 z-10 px-4 md:px-0 ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <header className="mx-auto flex w-full max-w-[600px] items-center gap-3 pb-3 pt-8">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary hover:opacity-80"
            aria-label="Back To Home"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="h-5 w-5" />
          </button>
        </header>
      </div>

      <div className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-24 md:px-0">
        <article className="typeset typeset-article mx-auto w-full max-w-[600px]">
          <h1>
            About <BrandName />
          </h1>
          <p>
            A student-focused web app for checking UiTM academic calendar timelines — registration, lectures,
            examinations, and semester breaks — in one place.
          </p>

          <h2>What&apos;s included</h2>
          <p>Built for phones, tablets, and desktop — three tools students use most, in one place.</p>
          <h3>Programs</h3>
          <p>{programsText}</p>
          <h3>Academic calendar</h3>
          <p>
            Browse your semester in month or list view. Filter activities, switch Group A and Group B sessions,
            check KKT regional dates, and see a countdown to what comes next — with light and dark themes and
            optional PWA install.
          </p>
          <h3>AI Chat</h3>
          <p>
            Ask Bila about your calendar in plain language — class days, breaks, exams, and what&apos;s coming up
            — without digging through the grid yourself.
          </p>
          <h3>MCP Server</h3>
          <p>
            Connect Claude or other AI assistants to the <BrandName /> MCP server for read-only calendar and public
            holiday data. See the <Link href="/mcp">MCP setup guide</Link> for how to add it in Claude.
          </p>
          <h3>Internship portal</h3>
          <p>
            Find My Internship brings internship listings into one place so you can browse opportunities without
            jumping between scattered sources.
          </p>
          <p>
            For feedback, bug reports, or suggestions, send them through the{' '}
            <Link href="/feedback">feedback page</Link>.
          </p>

          <h2>Open source on GitHub</h2>
          <p>
            <BrandName /> is developed in the open. Explore the repositories, follow updates, and contribute on
            GitHub.
          </p>
          <div className="not-typeset mt-[var(--typeset-flow)]">
            <Button
              render={
                <a
                  href="https://github.com/bilauitmcuti"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              nativeButton={false}
              className="h-[38px] w-fit"
            >
              View on GitHub
            </Button>
          </div>
          <p>
            The organization hosts the calendar web app and related projects that power this experience for
            UiTM students.
          </p>

          <h2>Terms and conditions</h2>
          <p>
            Terms and Conditions and the Privacy Policy are published at{' '}
            <Link href={POLICY_URL}>bilauitmcuti.com/policy</Link>.
          </p>
          <p>
            By accessing or using <BrandName /> (the website, Progressive Web App, AI Chat, Find My Internship,
            feedback tools, and related pages), you agree to these terms. If you do not agree, please stop using the
            service.
          </p>

          <h3>Scope of the service</h3>
          <p>
            <BrandName /> provides student-oriented tools including an academic calendar (month and list views), AI
            Chat for calendar-related questions, an internship browsing portal (Find My Internship), optional PWA
            install, share links, and a feedback form. Features may change, move, or be temporarily unavailable as
            the project evolves.
          </p>

          <h3>Unofficial information</h3>
          <p>
            Calendar data, holiday information, AI Chat answers, and internship listings are unofficial and provided
            on a best-effort basis for educational and informational use only. We do not guarantee completeness,
            accuracy, timeliness, or uninterrupted availability.
          </p>
          <p>
            You are responsible for verifying any date, deadline, academic requirement, or opportunity with official
            UiTM channels or the relevant organisation before taking action. Do not treat this app as an official
            source for exams, registration, leave, or employment decisions.
          </p>

          <h3>AI Chat</h3>
          <p>
            AI Chat responses are generated automatically and may be incomplete, outdated, or incorrect. Use them as
            a convenience aid only. Always confirm important answers against the calendar views or official UiTM
            sources.
          </p>

          <h3>Internship portal</h3>
          <p>
            Find My Internship aggregates or surfaces internship-related information for browsing. Listings are not
            offers of employment from <BrandName /> or UiTM. Eligibility, application steps, and outcomes are between
            you and the posting organisation. We are not responsible for third-party content, links, or hiring
            decisions.
          </p>

          <h3>Feedback and attachments</h3>
          <p>
            Feedback you submit (including optional email and image attachments) may be reviewed to improve the
            product. Do not upload sensitive personal data, passwords, or content you are not allowed to share.
            Spam, abuse, or malicious uploads are not permitted.
          </p>

          <h3>Acceptable use</h3>
          <p>
            Use the service lawfully and reasonably. Do not attempt to disrupt, scrape excessively, reverse-engineer
            protected parts of the system, or misuse APIs and rate limits in ways that harm other users or the
            project.
          </p>

          <h3>Updates to these terms</h3>
          <p>
            We may update features, content, and these terms without prior notice to reflect the latest version of
            the project. Continued use after changes means you accept the revised terms. The current wording on this
            page is the version that applies.
          </p>

          <h3>Limitation of liability</h3>
          <p>
            To the fullest extent permitted by law, the app owner and contributors are not liable for direct or
            indirect loss arising from use of, or reliance on, this service — including missed deadlines, incorrect
            AI answers, unavailable features, or internship-related outcomes.
          </p>

          <h2>Disclaimer</h2>
          <div className="not-typeset mt-[var(--typeset-flow)]">
            <Badge variant="destructive">Not affiliated with UiTM</Badge>
          </div>
          <p>
            This app is not affiliated with, endorsed by, or operated by Universiti Teknologi MARA (UiTM). It is an
            independent, student-focused project for educational and informational purposes only. Please verify
            important dates and requirements directly with official UiTM sources.
          </p>
        </article>
      </div>
    </div>
  );
}
