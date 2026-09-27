import type { Metadata } from 'next';

import { SITE_BRANDING_METADATA, SITE_NAME } from '@/lib/site-branding';

export const metadata: Metadata = {
  ...SITE_BRANDING_METADATA,
  title: 'MCP Server — Bila UiTM Cuti',
  description:
    'Connect Claude and other AI assistants to the Bila UiTM Cuti MCP server — read-only UiTM academic calendar and Malaysia public holidays.',
  alternates: {
    canonical: 'https://bilauitmcuti.com/mcp',
  },
  openGraph: {
    siteName: SITE_NAME,
    title: 'MCP Server — Bila UiTM Cuti',
    description:
      'Use the Bila UiTM Cuti MCP server with Claude to ask about UiTM academic calendar dates and Malaysia public holidays.',
    type: 'website',
    url: 'https://bilauitmcuti.com/mcp',
    locale: 'ms_MY',
    images: [
      {
        url: 'https://bilauitmcuti.com/og/mcp-server.png',
        width: 1200,
        height: 630,
        alt: 'MCP Server — Bila UiTM Cuti',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MCP Server — Bila UiTM Cuti',
    description:
      'Use the Bila UiTM Cuti MCP server with Claude to ask about UiTM academic calendar dates and Malaysia public holidays.',
    images: ['https://bilauitmcuti.com/og/mcp-server.png'],
  },
};

const mcpBreadcrumbJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://bilauitmcuti.com' },
    { '@type': 'ListItem', position: 2, name: 'MCP', item: 'https://bilauitmcuti.com/mcp' },
  ],
});

export default function McpLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: mcpBreadcrumbJsonLd }} />
      {children}
    </>
  );
}
