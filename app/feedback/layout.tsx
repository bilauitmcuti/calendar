import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Send Feedback',
  description:
    'Send feedback, bug reports, and suggestions for Bila UiTM Cuti — the interactive UiTM academic calendar.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: 'https://bilauitmcuti.com/feedback',
  },
  openGraph: {
    siteName: 'Bila UiTM Cuti',
    title: 'Send Feedback',
    description:
      'Share feedback and suggestions to help improve the UiTM academic calendar on bilauitmcuti.com.',
    type: 'website',
    url: 'https://bilauitmcuti.com/feedback',
    locale: 'ms_MY',
    images: [{ url: 'https://bilauitmcuti.com/og/main.png', width: 1200, height: 630, alt: 'Bila UiTM Cuti' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Send Feedback',
    description:
      'Share feedback and suggestions to help improve the UiTM academic calendar on bilauitmcuti.com.',
    images: ['https://bilauitmcuti.com/og/main.png'],
  },
};

const feedbackBreadcrumbJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Laman Utama', item: 'https://bilauitmcuti.com' },
    { '@type': 'ListItem', position: 2, name: 'Send Feedback', item: 'https://bilauitmcuti.com/feedback' },
  ],
});

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: feedbackBreadcrumbJsonLd }} />
      {children}
    </>
  );
}
