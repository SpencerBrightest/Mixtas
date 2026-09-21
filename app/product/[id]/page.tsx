// Product detail page rendering item specifications, image gallery, size options, and related recommendations.

import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Star } from 'lucide-react'
import { Breadcrumbs, Footer, ProductActions, ProductGrid, SiteHeader } from '@/components/store'
import { getProduct as getCatalogProduct, money, relatedProducts, products as staticProducts, Product } from '@/lib/catalog'
import { supabasePublic } from '@/lib/supabase/public'
import { ProductJsonLd } from '@/components/seo/product-json-ld'

/** Fetches product details from Supabase or catalog fallback. */
async function fetchProduct(idOrSlug: string): Promise<Product | null> {
  // 1. Check local catalog products first
  const staticFound = staticProducts.find(
    (p) => p.id === idOrSlug || p.name.toLowerCase().replace(/\s+/g, '-') === idOrSlug
  )
  if (staticFound) return staticFound

  // 2. Query Supabase database
  try {
    const isUuid = idOrSlug.length === 36 && idOrSlug.includes('-')
    const query = supabasePublic
      .from('products')
      .select('*, categories(name), product_images(url, is_primary)')
      .eq('is_active', true)

    const { data } = isUuid
      ? await query.eq('id', idOrSlug).maybeSingle()
      : await query.eq('slug', idOrSlug).maybeSingle()

    if (data) {
      const primaryImage = data.product_images?.find((img: any) => img.is_primary)?.url || data.product_images?.[0]?.url || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85'
      return {
        id: data.id,
        name: data.name,
        category: data.categories?.name || 'Collection',
        price: data.price,
        oldPrice: data.compare_at_price ?? undefined,
        image: primaryImage,
        description: data.description || 'Thoughtfully cut essential piece for everyday wear.',
        colors: ['Default'],
        sizes: ['S', 'M', 'L', 'XL'],
      }
    }
  } catch (error) {
    console.warn('Supabase product query notice:', error)
  }

  // Fallback to first static catalog product if valid fallback
  return getCatalogProduct(idOrSlug)
}

/** Renders the product detail view. */
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await fetchProduct(id)

  if (!product) {
    notFound()
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mixtas-fashion.com'

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <ProductJsonLd
          name={product.name}
          description={product.description}
          images={[product.image]}
          price={product.price}
          inStock={true}
          url={`${siteUrl}/product/${product.id}`}
        />

        <Breadcrumbs current={product.name} />

        <section className="product-detail">
          <div className="gallery">
            <div className="gallery-main">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image} alt={product.name} />
            </div>
            <div className="gallery-note">Designed in New York / Made for everywhere</div>
          </div>

          <div className="product-detail-copy">
            <p className="eyebrow">{product.category}</p>
            <h1>{product.name}</h1>

            <div className="rating">
              <span>
                <Star size={13} fill="currentColor" />
                <Star size={13} fill="currentColor" />
                <Star size={13} fill="currentColor" />
                <Star size={13} fill="currentColor" />
                <Star size={13} />
              </span>{' '}
              4.8 / 5
            </div>

            <p className="detail-price">{money(product.price)}</p>

            <p className="detail-description">
              {product.description} Cut for an easy silhouette and finished with the small details that make a piece feel like yours.
            </p>

            {product.colors && product.colors.length > 0 && (
              <div className="option">
                <label>Color</label>
                <div className="swatches">
                  {product.colors.map((color) => (
                    <button key={color} aria-label={color} className="swatch">
                      <span />
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ProductActions product={product} />

            <div className="accordions">
              <details open>
                <summary>Details & fit</summary>
                <p>Relaxed fit. Please choose your usual size. Model is 5&apos;11&quot; and wears a size M.</p>
              </details>
              <details>
                <summary>Shipping & returns</summary>
                <p>Complimentary shipping over 50 000 FCFA. Returns accepted within 30 days.</p>
              </details>
            </div>
          </div>
        </section>

        <section className="related section">
          <div className="section-heading left">
            <p className="eyebrow">You may also like</p>
            <h2>Complete the look</h2>
          </div>
          <ProductGrid items={relatedProducts(product.id)} />
        </section>
      </main>
      <Footer />
    </>
  )
}
