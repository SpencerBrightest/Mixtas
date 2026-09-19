import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Footer, Hero, ProductGrid, PromoMosaic, SiteHeader } from '@/components/store'

export default function HomePage() { return <><SiteHeader /><main><Hero /><section className="section arrivals"><div className="section-heading"><p className="eyebrow">Curated for now</p><h2>New arrivals</h2><div className="category-links"><Link href="/shop">Women</Link><Link href="/shop">Men</Link><Link href="/shop">Shoes</Link><Link href="/shop">Bags</Link><Link href="/shop">Accessories</Link></div></div><ProductGrid /></section><PromoMosaic /><section className="editorial-strip"><p className="eyebrow">Mixtas / Issue 08</p><h2>Less, but better.</h2><p>Thoughtful pieces, made to move with you.</p><Link href="/blog" className="text-link">Read the journal <ArrowRight size={14} /></Link></section></main><Footer /></> }
