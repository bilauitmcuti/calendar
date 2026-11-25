'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BrandName } from '@/components/brand-name';
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
          <div className="not-typeset mt-[var(--typeset-flow)]">
            <Badge variant="destructive">Not affiliated with UiTM</Badge>
          </div>
          <p>
            <BrandName /> helps UiTM students see registration, lectures, exams, and semester breaks on phone,
            tablet, or desktop — without digging through scattered notices. It is an independent project: not
            affiliated with, endorsed by, or run by Universiti Teknologi MARA (UiTM). Treat everything here as
            unofficial and double-check dates and rules with official UiTM sources before you act.
          </p>

          <h2>What you get</h2>
          <p>Programs covered: {programsText}</p>
          <ul>
            <li>
              <strong>Academic calendar</strong> — month or list view, activity filters, Group A and B, KKT regional
              dates, countdown, light and dark themes, optional PWA install, and share links.
            </li>
            <li>
              <strong>AI Chat</strong> — ask in everyday language about class days, breaks, exams, and what&apos;s
              coming up.
            </li>
            <li>
              <strong>MCP server</strong> — read-only calendar and public holiday data for Claude and other AI
              tools. See the <Link href="/mcp">MCP setup guide</Link>.
            </li>
            <li>
              <strong>Find My Internship</strong> — browse internship listings in one place instead of scattered
              sources.
            </li>
          </ul>
          <p>
            Spotted a bug or have an idea? Use the <Link href="/feedback">feedback page</Link>. We build in the open
            on GitHub — the <code>bilauitmcuti</code> organisation hosts this app and related projects.
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

          <h2>Terms of use</h2>
          <p>
            By using <BrandName /> or any of the tools above (including the PWA and feedback form), you accept these
            terms. If you do not agree, stop using the service. We may change features, content, or this wording
            without advance notice; continued use means you accept what is on this page now.
          </p>

          <h3>Accuracy and third-party content</h3>
          <p>
            Calendar data, holidays, AI Chat replies, and internship listings are shared on a best-effort basis for
            learning and reference only. AI answers are generated automatically and can be wrong or outdated.
            Internship posts are not job offers from <BrandName /> or UiTM; applications and outcomes are between you
            and the posting organisation. We do not guarantee completeness, accuracy, uptime, or third-party content.
            Confirm anything important in the calendar views or official UiTM channels. Do not rely on this site
            alone for exams, registration, leave, or employment decisions.
          </p>

          <h3>Feedback and fair use</h3>
          <p>
            We may read feedback you send (including optional email and images) to improve the product. Do not send
            passwords, sensitive personal data, or anything you are not allowed to share. Use the service legally;
            no spam, abuse, malicious uploads, aggressive scraping, reverse-engineering protected parts, or API abuse
            that harms other users or the project.
          </p>

          <h3>Limitation of liability</h3>
          <p>
            Where the law allows, the app owner and contributors are not liable for direct or indirect loss from using
            or trusting this service, including missed deadlines, wrong AI answers, unavailable features, or
            internship-related outcomes.
          </p>
        </article>
      </div>
    </div>
  );
}
