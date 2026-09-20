// Dynamic sitemap generator for search engine indexing.

import type { MetadataRoute } from 'next'
import { supabasePublic } from '@/lib/supabase/public'

export const revalidate = 3600

/** Generates the XML sitemap for public storefront routes. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mixtas-fashion.com'

  let productRoutes: MetadataRoute.Sitemap = []

  try {
    const { data: products } = await supabasePublic
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true)

    if (products) {
      productRoutes = products.map((p) => ({
        url: `${siteUrl}/product/${p.slug}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('Sitemap fetch error:', error)
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  return [...staticRoutes, ...productRoutes]
}
