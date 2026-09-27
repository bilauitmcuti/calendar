import React, { Suspense } from "react"
import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeShortcut } from '@/components/theme-shortcut'
import { VersionBanner } from '@/components/version-banner'
import { EngagementPromptRoot } from '@/components/engagement-prompt'
import { TooltipProviderRoot } from '@/components/tooltip-provider-root'
import { ZarazPageView } from '@/components/zaraz-page-view'
import './globals.css'
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { cn } from "@/lib/utils"
import { buildSiteNavigationSchemaElements, HOMEPAGE_SEO_DESCRIPTION } from '@/lib/page-seo'
import { SITE_ICON_METADATA, SITE_NAME, SITE_WEBSITE_ID } from '@/lib/site-branding'

export const metadata: Metadata = {
  metadataBase: new URL('https://bilauitmcuti.com'),
  title: {
    default: 'Bila UiTM Cuti',
    template: '%s',
  },
  applicationName: SITE_NAME,
  other: {
    site_name: SITE_NAME,
  },
  description: HOMEPAGE_SEO_DESCRIPTION,
  keywords: ['UiTM', 'academic calendar', 'registration', 'examination', 'lectures', 'holidays', 'Malaysia', 'Universiti Teknologi MARA', 'UiTM student app', 'Bila UiTM Cuti', 'Cuti UiTM', 'Jadual UiTM', 'Kalendar UiTM', 'Kalendar Akademik UiTM', 'Academic Calendar UiTM', 'jadual akademik UiTM', 'cuti semester UiTM', 'tarikh peperiksaan UiTM', 'tarikh pendaftaran UiTM', 'kuliah UiTM', 'uitm cuti', 'uitm cuti bila', 'bila cuti uitm', 'cuti uitm 2026', 'cuti uitm 2027', 'kalendar cuti uitm'],
  generator: 'Next.js',
  manifest: '/manifest.json',
  authors: [
    {
      name: 'Bila UiTM Cuti',
      url: 'https://bilauitmcuti.com',
    },
  ],
  creator: 'Bila UiTM Cuti',
  category: 'education',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://bilauitmcuti.com',
  },
  openGraph: {
    siteName: SITE_NAME,
    title: 'Bila UiTM Cuti',
    description: HOMEPAGE_SEO_DESCRIPTION,
    type: 'website',
    url: 'https://bilauitmcuti.com',
    locale: 'ms_MY',
    images: [
      {
        url: 'https://bilauitmcuti.com/og/main.png',
        width: 1200,
        height: 630,
        alt: 'Bila UiTM Cuti - Academic Calendar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bila UiTM Cuti',
    description: HOMEPAGE_SEO_DESCRIPTION,
    images: ['https://bilauitmcuti.com/og/main.png'],
  },
  icons: SITE_ICON_METADATA,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  // Safari uses these media queries for chrome/status bar before JS runs
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn(GeistSans.variable, GeistMono.variable, "font-sans")} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1a1a1a" media="(prefers-color-scheme: dark)" />
        <meta name="application-name" content={SITE_NAME} />
        <meta property="og:site_name" content={SITE_NAME} />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Bila UiTM Cuti" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://bilauitmcuti.com/#organization',
                  name: 'Bila UiTM Cuti',
                  url: 'https://bilauitmcuti.com',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://bilauitmcuti.com/android-chrome-512x512.png',
                  },
                },
                {
                  '@type': 'WebSite',
                  '@id': SITE_WEBSITE_ID,
                  url: 'https://bilauitmcuti.com',
                  name: 'Bila UiTM Cuti',
                  alternateName: ['Bila UiTM Cuti', 'Cuti UiTM', 'Kalendar Akademik UiTM'],
                  publisher: {
                    '@id': 'https://bilauitmcuti.com/#organization',
                  },
                  inLanguage: ['ms-MY', 'en'],
                  hasPart: buildSiteNavigationSchemaElements(),
                },
              ],
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const isDev = ${process.env.NODE_ENV === 'development'};
                // Sync theme from localStorage / system preference before React hydration to prevent flash
                try {
                  let theme = 'system';
                  try {
                    theme = localStorage.getItem('theme') || 'system';
                  } catch (storageError) {
                    if (isDev) console.warn('localStorage access failed, using system theme:', storageError);
                  }

                  function resolveTheme(stored) {
                    if (stored === 'dark' || stored === 'light') return stored;
                    try {
                      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    } catch (mediaError) {
                      if (isDev) console.warn('matchMedia failed, falling back to light:', mediaError);
                      return 'light';
                    }
                  }

                  // Accept light/dark/system; anything else resolves via system preference
                  const resolvedTheme = resolveTheme(theme);

                  // Apply theme class - always remove both classes first to ensure clean state
                  document.documentElement.classList.remove('dark', 'light');
                  document.documentElement.classList.add(resolvedTheme);
                  document.documentElement.style.colorScheme = resolvedTheme;

                  // Update theme-color meta tags from resolved (not "system") theme
                  try {
                    const color = resolvedTheme === 'dark' ? '#1a1a1a' : '#ffffff';
                    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
                      meta.setAttribute('content', color);
                    });
                  } catch (metaError) {
                    if (isDev) console.warn('Failed to update theme-color meta tag:', metaError);
                  }
                } catch (e) {
                  // Comprehensive fallback - ensure light theme is always applied
                  if (isDev) console.warn('Theme sync failed, applying fallback:', e);
                  try {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
                    if (metaThemeColor) {
                      metaThemeColor.setAttribute('content', '#ffffff');
                    }
                  } catch (fallbackError) {
                    // Last resort - just add light class
                    document.documentElement.classList.add('light');
                  }
                }
                
                // Store filter states in data attributes for synchronous access
                // This prevents flicker when filters are applied - MUST run before React hydration
                // Default values from data.ts (single source of truth) - inlined to avoid import in script
                const DEFAULT_FILTER_STATES = {
                  showKKT: false,
                  showRegistration: true,
                  showLecture: true,
                  showSemesterPendek: false,
                  showKuliahIntersesi: false,
                  showExamination: true,
                  showOthersExams: false,
                  showBreak: true,
                };
                
                try {
                  // Properly check if localStorage keys exist using ?? (null coalescing)
                  // Only use defaults when localStorage key is null (doesn't exist)
                  const filterValues = {
                    showRegistration: JSON.parse(localStorage.getItem('showRegistration') ?? JSON.stringify(DEFAULT_FILTER_STATES.showRegistration)),
                    showLecture: JSON.parse(localStorage.getItem('showLecture') ?? JSON.stringify(DEFAULT_FILTER_STATES.showLecture)),
                    showSemesterPendek: JSON.parse(localStorage.getItem('showSemesterPendek') ?? JSON.stringify(DEFAULT_FILTER_STATES.showSemesterPendek)),
                    showKuliahIntersesi: JSON.parse(localStorage.getItem('showKuliahIntersesi') ?? JSON.stringify(DEFAULT_FILTER_STATES.showKuliahIntersesi)),
                    showExamination: JSON.parse(localStorage.getItem('showExamination') ?? JSON.stringify(DEFAULT_FILTER_STATES.showExamination)),
                    showOthersExams: JSON.parse(localStorage.getItem('showOthersExams') ?? JSON.stringify(DEFAULT_FILTER_STATES.showOthersExams)),
                    showBreak: JSON.parse(localStorage.getItem('showBreak') ?? JSON.stringify(DEFAULT_FILTER_STATES.showBreak)),
                    showKKT: JSON.parse(localStorage.getItem('showKKT') ?? JSON.stringify(DEFAULT_FILTER_STATES.showKKT)),
                  };
                  
                  // Sync to cookie for SSR consistency
                  try {
                    const cookieValue = encodeURIComponent(JSON.stringify(filterValues));
                    const expires = new Date();
                    expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
                    const securePart = ${process.env.NODE_ENV === 'production' ? '"; Secure"' : '""'};
                    document.cookie = 'calendar-filters=' + cookieValue + '; expires=' + expires.toUTCString() + '; path=/; SameSite=Lax' + securePart;
                  } catch (cookieError) {
                    if (isDev) console.warn('Failed to sync filters to cookie:', cookieError);
                  }
                  
                  // Store as data attribute for synchronous access during component initialization
                  const filters = {
                    showRegistration: JSON.stringify(filterValues.showRegistration),
                    showLecture: JSON.stringify(filterValues.showLecture),
                    showSemesterPendek: JSON.stringify(filterValues.showSemesterPendek),
                    showKuliahIntersesi: JSON.stringify(filterValues.showKuliahIntersesi),
                    showExamination: JSON.stringify(filterValues.showExamination),
                    showOthersExams: JSON.stringify(filterValues.showOthersExams),
                    showBreak: JSON.stringify(filterValues.showBreak),
                    showKKT: JSON.stringify(filterValues.showKKT),
                  };
                  document.documentElement.setAttribute('data-filters', JSON.stringify(filters));
                } catch (e) {
                  // Fallback: set default values if localStorage fails
                  const defaultFilters = {
                    showRegistration: JSON.stringify(DEFAULT_FILTER_STATES.showRegistration),
                    showLecture: JSON.stringify(DEFAULT_FILTER_STATES.showLecture),
                    showSemesterPendek: JSON.stringify(DEFAULT_FILTER_STATES.showSemesterPendek),
                    showKuliahIntersesi: JSON.stringify(DEFAULT_FILTER_STATES.showKuliahIntersesi),
                    showExamination: JSON.stringify(DEFAULT_FILTER_STATES.showExamination),
                    showOthersExams: JSON.stringify(DEFAULT_FILTER_STATES.showOthersExams),
                    showBreak: JSON.stringify(DEFAULT_FILTER_STATES.showBreak),
                    showKKT: JSON.stringify(DEFAULT_FILTER_STATES.showKKT),
                  };
                  document.documentElement.setAttribute('data-filters', JSON.stringify(defaultFilters));
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${GeistSans.className} antialiased`} suppressHydrationWarning>
        <VersionBanner />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          storageKey="theme"
          disableTransitionOnChange={true}
        >
          <ThemeShortcut />
          <TooltipProviderRoot>
            <EngagementPromptRoot>{children}</EngagementPromptRoot>
          </TooltipProviderRoot>
        </ThemeProvider>
        <Suspense fallback={null}>
          <ZarazPageView />
        </Suspense>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const isDev = ${process.env.NODE_ENV === 'development'};
                const buildId = ${JSON.stringify(process.env.NEXT_PUBLIC_BUILD_ID ?? "")};
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    const swUrl = buildId ? ('/sw.js?v=' + encodeURIComponent(buildId)) : '/sw.js';
                    navigator.serviceWorker.register(swUrl).catch(function(err) {
                      if (isDev) console.log('SW registration failed:', err);
                    });
                  });
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}
