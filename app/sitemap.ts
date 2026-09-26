import type { MetadataRoute } from 'next'
import { SITELINK_PROGRAM_SLUGS, SITE_ORIGIN } from '@/lib/page-seo'

export const runtime = 'edge'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_ORIGIN, lastModified, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_ORIGIN}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_ORIGIN}/mcp`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_ORIGIN}/chat`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_ORIGIN}/internship`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
  ]

  const programPages: MetadataRoute.Sitemap = SITELINK_PROGRAM_SLUGS.map((slug) => ({
    url: `${SITE_ORIGIN}/${slug}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...programPages]
}
