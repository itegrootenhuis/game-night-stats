import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gamenightstats.com'
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/settings/', '/share/', '/game-nights/', '/players/', '/games/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
