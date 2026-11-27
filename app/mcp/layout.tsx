import type { Metadata } from 'next';

const MCP_PAGE_TITLE = 'MCP Server - Kalendar Akademik UiTM';
const MCP_PAGE_DESCRIPTION =
  'Connect Claude, Grok, Cursor, and other AI apps to read-only UiTM calendar and Malaysia public holiday dates. Allow access on first use.';

export const metadata: Metadata = {
  title: MCP_PAGE_TITLE,
  description: MCP_PAGE_DESCRIPTION,
  alternates: {
    canonical: 'https://bilauitmcuti.com/mcp',
  },
  openGraph: {
    siteName: 'Bila UiTM Cuti',
    title: MCP_PAGE_TITLE,
    description: MCP_PAGE_DESCRIPTION,
    type: 'website',
    url: 'https://bilauitmcuti.com/mcp',
    locale: 'ms_MY',
    images: [
      {
        url: 'https://bilauitmcuti.com/og/mcp-server.png',
        width: 1200,
        height: 630,
        alt: MCP_PAGE_TITLE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: MCP_PAGE_TITLE,
    description: MCP_PAGE_DESCRIPTION,
    images: ['https://bilauitmcuti.com/og/mcp-server.png'],
  },
};

const mcpBreadcrumbJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Laman Utama', item: 'https://bilauitmcuti.com' },
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
