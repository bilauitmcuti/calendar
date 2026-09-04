'use client';

import { Suspense, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { toast } from 'sonner';

import { PwaInstallOverlay } from '@/components/download/pwa-install-overlay';
import { ShareLinkGenerator } from '@/components/download/share-link-generator';
import { BrandName } from '@/components/brand-name';
import { Button } from '@/components/ui/button';
import {
  drawerPrimaryButtonClassName,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePwaInstalled } from '@/hooks/use-pwa-installed';
import { usePwaInstallPrompt } from '@/hooks/use-pwa-install-prompt';
import {
  getPwaSharedCaption,
  isIosSafari,
  usePwaInstallPlatform,
  type PwaInstallPlatform,
} from '@/lib/pwa-platform';
import { cn } from '@/lib/utils';

const pwaBenefits = [
  'Open the app from your home screen in one tap.',
  'Keep the UiTM academic calendar close at hand.',
  'Works offline-friendly after install — no app store required.',
];

const bookmarkBenefits = [
  'Open bilauitmcuti.com from your browser bookmarks in one click.',
  'Keep the UiTM academic calendar easy to find on any device.',
  'No install required — works in Safari, Chrome, Edge, Firefox, and more.',
];

const iosBookmarkSteps: ReactNode[] = [
  <>
    Open <strong>Safari</strong> and visit <strong>bilauitmcuti.com</strong>
  </>,
  <>
    Tap the <strong>Share</strong> button (square with arrow up)
  </>,
  <>
    Tap <strong>&ldquo;Add Bookmark&rdquo;</strong>
  </>,
  <>
    Choose a folder (e.g. <strong>Favorites</strong>) and tap <strong>Save</strong>
  </>,
];

const androidBookmarkSteps: ReactNode[] = [
  <>
    Open <strong>Chrome</strong> and visit <strong>bilauitmcuti.com</strong>
  </>,
  <>
    Tap the <strong>star</strong> icon in the address bar
  </>,
  <>Rename the bookmark if you like, then confirm</>,
  <>
    Tap <strong>Save</strong> or <strong>Done</strong>
  </>,
];

const desktopBookmarkSteps: ReactNode[] = [
  <>
    Press <kbd>Ctrl+D</kbd> (Windows) or <kbd>⌘D</kbd> (Mac), or click the <strong>star</strong> in
    the address bar, then save.
  </>,
  <>
    In Safari (macOS): Bookmarks menu → &ldquo;Add Bookmark&rdquo;, or press <kbd>⌘D</kbd>.
  </>,
  <>Add the bookmark to your bookmarks bar or Favorites for one-click access.</>,
];

function NumberedInstallList({ steps }: { steps: ReactNode[] }) {
  return (
    <ol>
      {steps.map((body, index) => (
        <li key={index}>{body}</li>
      ))}
    </ol>
  );
}

function platformCardMeta(platform: PwaInstallPlatform): {
  title: string;
  description: string;
  blurb: string;
} {
  if (platform === 'ios') {
    const safari = isIosSafari();
    return {
      title: 'iPhone & iPad',
      description: safari ? 'Safari' : 'Open in Safari to install',
      blurb: safari
        ? 'Install Bila UiTM Cuti to your Home Screen from Safari.'
        : 'Use Safari to add this app to your Home Screen.',
    };
  }
  if (platform === 'android') {
    return {
      title: 'Android',
      description: 'Chrome (recommended)',
      blurb: 'Install Bila UiTM Cuti to your Home screen for quicker access.',
    };
  }
  return {
    title: 'Desktop & laptop',
    description: 'Chrome or Edge',
    blurb: 'Install the app on your computer so it opens in its own window.',
  };
}

function PwaTabContent({
  isInstalled,
  platform,
  onInstallClick,
}: {
  isInstalled: boolean;
  platform: PwaInstallPlatform | null;
  onInstallClick: () => void;
}) {
  const caption = platform ? getPwaSharedCaption(platform) : getPwaSharedCaption('desktop');
  const meta = platform ? platformCardMeta(platform) : null;

  return (
    <article className="typeset typeset-article">
      <h1>
        Install <BrandName />
      </h1>
      <p>{caption}</p>

      <h2>Why install</h2>
      <ul>
        {pwaBenefits.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {isInstalled ? (
        <>
          <h2>Already installed</h2>
          <p>
            <BrandName /> is already installed on this device.
          </p>
        </>
      ) : meta ? (
        <>
          <h2>{meta.title}</h2>
          <p>{meta.description}</p>
          <p>{meta.blurb}</p>
          <div className="not-typeset mt-[var(--typeset-flow)]">
            <Button
              type="button"
              size="sm"
              variant="default"
              className={cn(drawerPrimaryButtonClassName, 'w-fit')}
              onClick={onInstallClick}
            >
              Install App
            </Button>
          </div>
        </>
      ) : null}
    </article>
  );
}

function BookmarkTabContent({ platform }: { platform: PwaInstallPlatform | null }) {
  const bookmarkCard =
    platform === 'ios'
      ? {
          title: 'iPhone & iPad',
          description: 'Safari',
          steps: iosBookmarkSteps,
        }
      : platform === 'android'
        ? {
            title: 'Android',
            description: 'Chrome (recommended)',
            steps: androidBookmarkSteps,
          }
        : platform === 'desktop'
          ? {
              title: 'Desktop & laptop',
              description: 'Chrome, Edge, Safari, or Firefox',
              steps: desktopBookmarkSteps,
            }
          : null;

  return (
    <article className="typeset typeset-article">
      <h1>
        Bookmark <BrandName />
      </h1>
      <p>
        Save this site in your browser bookmarks or favorites so you can return to the calendar
        without searching again.
      </p>

      <h2>Why bookmark</h2>
      <ul>
        {bookmarkBenefits.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      {bookmarkCard ? (
        <>
          <h2>{bookmarkCard.title}</h2>
          <p>{bookmarkCard.description}</p>
          <NumberedInstallList steps={bookmarkCard.steps} />
        </>
      ) : null}
    </article>
  );
}

const queryExamples: { url: string; meaning: string }[] = [
  {
    url: '/diploma?B-20264',
    meaning: 'Applies session B-20264 on Diploma, then the address bar cleans to /diploma.',
  },
  {
    url: '/diploma?B-20264&lecture&exam',
    meaning:
      'Same session, with only Lecture and Examination on; then redirects to the clean Diploma path.',
  },
  {
    url: '/?B-20264&B-20272&break&states',
    meaning:
      'Applies two sessions plus Break and Kedah/Kelantan/Terengganu holidays, then cleans the URL.',
  },
];

function QueryTabContent() {
  return (
    <article className="typeset typeset-article">
      <h1>Shareable calendar links</h1>
      <p>
        Pick a program, sessions, and Settings filters to build a link. Anyone who opens it gets those
        choices applied, then the address bar cleans to the normal page path.
      </p>

      <div className="not-typeset mt-[var(--typeset-flow)]">
        <ShareLinkGenerator />
      </div>

      <h2>Examples</h2>
      <p>
        Same format as the generator — path plus session and filter codes after <code>?</code>.
      </p>
      <div className="not-typeset mt-[var(--typeset-flow)] flex flex-col gap-3">
        {queryExamples.map((example) => (
          <div key={example.url} className="flex flex-col gap-1">
            <code className="text-xs break-all sm:text-sm">{example.url}</code>
            <p className="text-xs text-muted-foreground sm:text-sm">{example.meaning}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function AboutSponsorSection() {
  return (
    <article className="typeset typeset-article">
      <h2>
        About <BrandName />
      </h2>
      <p>Learn what this project covers, how the calendar works, and where to send feedback.</p>
      <div className="not-typeset mt-[var(--typeset-flow)]">
        <Button
          render={<Link href="/about" />}
          nativeButton={false}
          variant="default"
          className="h-[38px] w-fit"
        >
          About
        </Button>
      </div>

      <h2>Become Our Sponsors</h2>
      <p>Support the project and help keep the calendar free for everyone.</p>
      <div className="not-typeset mt-[var(--typeset-flow)] flex flex-row flex-wrap items-center gap-2">
        <Button
          render={
            <a href="https://shahrulestar.com/sponsor" target="_blank" rel="noopener noreferrer" />
          }
          nativeButton={false}
          className="h-[38px] w-fit"
        >
          Sponsor
        </Button>
        <Button
          variant="outline"
          render={
            <a
              href="https://github.com/sponsors/shahrulestar"
              target="_blank"
              rel="noopener noreferrer"
            />
          }
          nativeButton={false}
          className="h-[38px] w-fit"
        >
          Github Sponsor
        </Button>
      </div>
    </article>
  );
}

export default function DownloadPage() {
  return (
    <Suspense fallback={null}>
      <DownloadPageContent />
    </Suspense>
  );
}

type DownloadTab = 'pwa' | 'bookmark' | 'share-link';

const DOWNLOAD_TABS = new Set<string>(['pwa', 'bookmark', 'share-link']);

function parseDownloadTabValue(value: string): DownloadTab | null {
  if (DOWNLOAD_TABS.has(value)) return value as DownloadTab;
  return null;
}

function parseDownloadTab(searchParams: URLSearchParams): DownloadTab {
  if (searchParams.has('share-link')) return 'share-link';
  if (searchParams.has('bookmark')) return 'bookmark';
  if (searchParams.has('pwa')) return 'pwa';

  const legacy = searchParams.get('tab');
  if (legacy === 'bookmark') return 'bookmark';
  if (legacy === 'query' || legacy === 'share-link') return 'share-link';
  return 'pwa';
}

function hasDownloadTabParam(searchParams: URLSearchParams): boolean {
  return (
    searchParams.has('pwa') ||
    searchParams.has('bookmark') ||
    searchParams.has('share-link')
  );
}

function downloadTabHref(tab: DownloadTab): string {
  return `/download?${tab}`;
}

function downloadTabDocumentTitle(tab: DownloadTab): string {
  if (tab === 'bookmark') return 'Bookmark Bila UiTM Cuti';
  if (tab === 'share-link') return 'Share Bila UiTM Cuti';
  return 'Download Bila UiTM Cuti';
}

function DownloadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [headerVisible, setHeaderVisible] = useState(true);
  const [installOpen, setInstallOpen] = useState(false);
  const isInstalled = usePwaInstalled();
  const platform = usePwaInstallPlatform();
  const { promptInstall } = usePwaInstallPrompt();
  const lastScrollTop = useRef(0);

  const activeTab = parseDownloadTab(searchParams);

  useEffect(() => {
    if (hasDownloadTabParam(searchParams)) return;
    router.replace(downloadTabHref(activeTab), { scroll: false });
  }, [activeTab, router, searchParams]);

  useEffect(() => {
    document.title = downloadTabDocumentTitle(activeTab);
  }, [activeTab]);

  const handleTabChange = useCallback(
    (value: string | number | null) => {
      const tab = typeof value === 'string' ? parseDownloadTabValue(value) : null;
      if (!tab) return;
      router.replace(downloadTabHref(tab), { scroll: false });
    },
    [router]
  );

  const handleInstallClick = useCallback(async () => {
    // iOS has no beforeinstallprompt — show Share / Safari instructions drawer.
    if (platform === 'ios') {
      setInstallOpen(true);
      return;
    }

    // Windows + Android: native browser Install app dialog only (no custom dialog).
    const outcome = await promptInstall();
    if (outcome === 'unavailable') {
      toast.message('Install unavailable', {
        description:
          'Use your browser menu and choose Install app or Add to Home screen.',
      });
    }
  }, [platform, promptInstall]);

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
      <div className="chat-top-fade pointer-events-none absolute top-0 right-0 left-0 z-[9]" />

      <div
        className={`chat-header absolute top-0 right-0 left-0 z-10 px-4 md:px-0 ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <header className="mx-auto flex w-full max-w-[600px] items-center gap-3 pt-8 pb-3">
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

      <div className="px-4 pt-24 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] md:px-0">
        <div className="mx-auto flex w-full max-w-[600px] flex-col gap-12">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="flex flex-col gap-4"
          >
            <TabsList className="grid h-10 w-full grid-cols-3">
              <TabsTrigger value="pwa">PWA</TabsTrigger>
              <TabsTrigger value="bookmark">Bookmark</TabsTrigger>
              <TabsTrigger value="share-link">Share Link</TabsTrigger>
            </TabsList>

            <TabsContent value="pwa" className="mt-0">
              <PwaTabContent
                isInstalled={isInstalled}
                platform={platform}
                onInstallClick={handleInstallClick}
              />
            </TabsContent>

            <TabsContent value="bookmark" className="mt-0">
              <BookmarkTabContent platform={platform} />
            </TabsContent>

            <TabsContent value="share-link" className="mt-0">
              <QueryTabContent />
            </TabsContent>
          </Tabs>

          <AboutSponsorSection />
        </div>
      </div>

      {platform === 'ios' ? (
        <PwaInstallOverlay open={installOpen} onOpenChange={setInstallOpen} />
      ) : null}
    </div>
  );
}
