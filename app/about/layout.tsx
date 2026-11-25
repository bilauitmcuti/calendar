import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Bila UiTM Cuti',
  description:
    'What Bila UiTM Cuti is, what it includes, open-source repos, terms, and the not-affiliated-with-UiTM disclaimer.',
  alternates: {
    canonical: 'https://bilauitmcuti.com/about',
  },
  openGraph: {
    siteName: 'Bila UiTM Cuti',
    title: 'About Bila UiTM Cuti',
    description:
      'Calendar, chat, MCP, internships, GitHub, terms, and disclaimer — the about page for Bila UiTM Cuti.',
    type: 'website',
    url: 'https://bilauitmcuti.com/about',
    locale: 'ms_MY',
    images: [
      {
        url: 'https://bilauitmcuti.com/og/main.png',
        width: 1200,
        height: 630,
        alt: 'About Bila UiTM Cuti',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Bila UiTM Cuti',
    description:
      'Calendar, chat, MCP, internships, GitHub, terms, and disclaimer — the about page for Bila UiTM Cuti.',
    images: ['https://bilauitmcuti.com/og/main.png'],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
