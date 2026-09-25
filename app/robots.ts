// Dynamic robots.txt configuration file blocking administrative and checkout endpoints from web crawlers.

import type { MetadataRoute } from 'next'

/** Configures crawler indexing rules and sitemap location. */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mixtas-fashion.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/account',
          '/checkout',
          '/cart',
          '/api/*',
          '/login',
          '/signup',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
