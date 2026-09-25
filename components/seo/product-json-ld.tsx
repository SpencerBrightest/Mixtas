// Schema.org JSON-LD structured data generator for product SEO indexing.

import React from 'react'

interface ProductJsonLdProps {
  name: string
  description: string
  images: string[]
  price: number
  inStock: boolean
  url: string
  currency?: string
}

/** Renders JSON-LD structured product metadata for search engines. */
export function ProductJsonLd({
  name,
  description,
  images,
  price,
  inStock,
  url,
  currency = 'XAF',
}: ProductJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: images,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: currency,
      price,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
