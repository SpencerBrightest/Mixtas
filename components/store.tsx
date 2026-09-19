'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft, ArrowRight, Heart, Menu, Minus, Plus, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { categories, heroImage, initialCart, money, navItems, Product, products, type CartItem } from '@/lib/catalog'

type StoreContextValue = { cart: CartItem[]; wishlist: string[]; addToCart: (product: Product, size?: string) => void; removeFromCart: (id: string) => void; updateQuantity: (id: string, quantity: number) => void; toggleWishlist: (id: string) => void }
const StoreContext = createContext<StoreContextValue | null>(null)
export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(initialCart)
  const [wishlist, setWishlist] = useState<string[]>([])
  const addToCart = (product: Product, size?: string) => setCart((items) => { const found = items.find((item) => item.product.id === product.id && item.size === size); return found ? items.map((item) => item === found ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { product, size, quantity: 1 }] })
  const removeFromCart = (id: string) => setCart((items) => items.filter((item) => item.product.id !== id))
  const updateQuantity = (id: string, quantity: number) => setCart((items) => items.map((item) => item.product.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
  const toggleWishlist = (id: string) => setWishlist((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  return <StoreContext.Provider value={{ cart, wishlist, addToCart, removeFromCart, updateQuantity, toggleWishlist }}>{children}</StoreContext.Provider>
}
export function useStore() { const context = useContext(StoreContext); if (!context) throw new Error('useStore must be used inside StoreProvider'); return context }

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { cart, wishlist } = useStore()
  return <>
    <div className="announcement">Complimentary shipping on orders over $150 <span>•</span> Easy returns within 30 days</div>
    <header className="site-header">
      <button className="icon-button mobile-only" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={20} /></button>
      <nav className="desktop-nav">{navItems.map((item) => <Link key={item.href} href={item.href} className={pathname.startsWith(item.href) ? 'active' : ''}>{item.label}</Link>)}</nav>
      <Link href="/" className="wordmark">Mixtas</Link>
      <div className="header-actions"><Link href="/shop" aria-label="Search"><Search size={18} /></Link><Link href="/account" aria-label="Account"><UserRound size={18} /></Link><Link href="/wishlist" aria-label="Wishlist"><Heart size={18} /><sup>{wishlist.length}</sup></Link><Link href="/cart" className="bag-link" aria-label="Shopping bag"><ShoppingBag size={18} /><sup>{cart.reduce((sum, item) => sum + item.quantity, 0)}</sup></Link></div>
    </header>
    {open && <div className="mobile-menu"><div className="mobile-menu-top"><span className="wordmark">Mixtas</span><button className="icon-button" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button></div>{navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}<Link href="/contact" onClick={() => setOpen(false)}>Contact us</Link></div>}
  </>
}

export function Footer() { return <footer className="site-footer"><div><Link href="/" className="wordmark footer-mark">Mixtas</Link><p>Modern essentials for a life in motion.</p></div><div><p className="footer-heading">Explore</p><Link href="/shop">Shop all</Link><Link href="/blog">Journal</Link><Link href="/contact">About us</Link></div><div><p className="footer-heading">Help</p><Link href="/contact">Contact</Link><Link href="/account">Account</Link><Link href="/cart">Shipping & returns</Link></div><div className="newsletter"><p className="footer-heading">Stay in the loop</p><p>New arrivals, stories, and occasional good news.</p><div className="subscribe"><input aria-label="Email address" placeholder="Your email address" type="email" /><button aria-label="Subscribe"><ArrowRight size={16} /></button></div></div><div className="footer-bottom">© 2026 Mixtas Studio <span>Instagram &nbsp; Pinterest &nbsp; Terms</span></div></footer> }

export function ProductCard({ product }: { product: Product }) { const { wishlist, toggleWishlist } = useStore(); const liked = wishlist.includes(product.id); return <article className="product-card"><div className="product-image-wrap"><Link href={`/product/${product.id}`}><img src={product.image} alt={product.name} /></Link><button className={`wish-button ${liked ? 'liked' : ''}`} onClick={() => toggleWishlist(product.id)} aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}><Heart size={17} fill={liked ? 'currentColor' : 'none'} /></button>{product.badge && <span className="product-badge">{product.badge}</span>}</div><div className="product-info"><p className="eyebrow">{product.category}</p><Link href={`/product/${product.id}`} className="product-name">{product.name}</Link><p className="product-price">{money(product.price)}</p></div></article> }

export function ProductActions({ product }: { product: Product }) { const { addToCart, wishlist, toggleWishlist } = useStore(); const [size, setSize] = useState(product.sizes?.[0]); const liked = wishlist.includes(product.id); return <><div className="option"><label>Size <Link href="#size-guide">Size guide</Link></label><div className="size-grid">{product.sizes?.map((item) => <button key={item} className={size === item ? 'selected' : ''} onClick={() => setSize(item)}>{item}</button>)}</div></div><div className="detail-actions"><button className="button button-dark" onClick={() => addToCart(product, size)}>Add to bag <ArrowRight size={15} /></button><button className={`outline-button ${liked ? 'liked' : ''}`} onClick={() => toggleWishlist(product.id)} aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}><Heart size={17} fill={liked ? 'currentColor' : 'none'} /></button></div></> }

export function ProductGrid({ items = products }: { items?: Product[] }) { return <div className="product-grid">{items.map((product) => <ProductCard key={product.id} product={product} />)}</div> }

export function Hero() { const [slide, setSlide] = useState(0); const slides = [{ title: 'Jackets for the modern man', kicker: 'Urban edge', image: heroImage }, { title: 'A softer side of summer', kicker: 'New season', image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1800&q=90' }]; const current = slides[slide]; return <section className="hero"><img src={current.image} alt="Mixtas seasonal fashion campaign" /><div className="hero-shade" /><div className="hero-content"><p className="eyebrow">{current.kicker}</p><h1>{current.title}</h1><Link href="/shop" className="button button-light">Discover now <ArrowRight size={15} /></Link></div><button className="hero-arrow hero-prev" onClick={() => setSlide((slide - 1 + slides.length) % slides.length)} aria-label="Previous slide"><ArrowLeft size={16} /></button><button className="hero-arrow hero-next" onClick={() => setSlide((slide + 1) % slides.length)} aria-label="Next slide"><ArrowRight size={16} /></button><div className="hero-dots">{slides.map((_, i) => <button key={i} className={slide === i ? 'current' : ''} onClick={() => setSlide(i)} aria-label={`Go to slide ${i + 1}`} />)}</div></section> }

export function PromoMosaic() { return <section className="promo-mosaic"><div className="promo promo-large"><img src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1100&q=85" alt="White hoodie" /><div><p className="eyebrow">Ethereal elegance</p><h3>Where dreams<br />meet couture</h3><Link href="/shop" className="text-link">Shop now <ArrowRight size={14} /></Link></div></div><div className="promo promo-wide"><img src="https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1100&q=85" alt="Woman in navy" /><div><p className="eyebrow">Radiant reverie</p><h3>Enchanting styles<br />for every woman</h3><Link href="/shop" className="text-link">Shop now <ArrowRight size={14} /></Link></div></div><div className="promo promo-small"><img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=85" alt="White sneakers" /><div><p className="eyebrow">Urban strides</p><h3>Chic footwear for city living</h3><Link href="/shop" className="text-link">Shop now <ArrowRight size={14} /></Link></div></div><div className="promo promo-blue"><p className="eyebrow">Limited offer</p><h3>Trendsetting bags<br />for her</h3><strong>50<span>%</span></strong><Link href="/shop" className="button button-light">Shop now</Link></div></section> }

export function Quantity({ value, onChange }: { value: number; onChange: (v: number) => void }) { return <div className="quantity"><button onClick={() => onChange(Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus size={13} /></button><span>{value}</span><button onClick={() => onChange(value + 1)} aria-label="Increase quantity"><Plus size={13} /></button></div> }

export function FilterBar({ active, setActive }: { active: string; setActive: (v: string) => void }) { return <div className="filter-bar"><div className="category-tabs">{['All', ...categories].map((category) => <button className={active === category ? 'active' : ''} onClick={() => setActive(category)} key={category}>{category}</button>)}</div><span className="filter-count">{active === 'All' ? products.length : products.filter((p) => p.category === active).length} pieces</span></div> }

export function Breadcrumbs({ current }: { current: string }) { return <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>{current}</span></div> }

export function ShopClient() { const [active, setActive] = useState('All'); const filtered = useMemo(() => active === 'All' ? products : products.filter((p) => p.category === active), [active]); return <><FilterBar active={active} setActive={setActive} /><ProductGrid items={filtered} /></> }
