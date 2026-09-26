import type { MetadataRoute } from 'next'

export const runtime = 'edge'

const baseUrl = 'https://bilauitmcuti.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
