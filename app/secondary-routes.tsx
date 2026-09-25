// Secondary storefront pages including shopping cart, checkout, wishlist, account, journal, and contact.

'use client'

import Link from 'next/link'
import React, { useState } from 'react'
import { ArrowRight, Check, Mail, Heart, Trash2, ShieldCheck, CheckCircle2, Phone, Smartphone, ShoppingBag } from 'lucide-react'
import { Footer, ProductGrid, SiteHeader, Quantity, useStore } from '@/components/store'
import { blogPosts, money, products } from '@/lib/catalog'
import { placeOrder } from '@/app/checkout/actions'
import { startNotchPayment } from '@/app/checkout/notchpay-actions'
import { useAdminStore } from '@/lib/admin-store'

/** Renders the shopping bag view with item quantity management and subtotal calculations. */
export function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useStore()
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shippingFee = subtotal >= 50000 || subtotal === 0 ? 0 : 2500

  return (
    <>
      <SiteHeader />
      <main className="page-shell narrow">
        <div className="page-intro left">
          <p className="eyebrow">Your selection</p>
          <h1>Shopping bag</h1>
          <p>{cart.length} items &middot; Complimentary shipping over 50 000 FCFA</p>
        </div>

        <div className="cart-layout">
          {cart.length ? (
            <div className="cart-list">
              {cart.map(({ product, quantity, size }) => (
                <div className="cart-row" key={`${product.id}-${size || 'default'}`}>
                  <img src={product.image} alt={product.name} />
                  <div className="cart-row-copy">
                    <p className="eyebrow">{product.category}</p>
                    <h3>{product.name}</h3>
                    <p>Size {size || 'Standard'}</p>
                    <div className="cart-row-bottom">
                      <span>{money(product.price * quantity)}</span>
                      <Quantity value={quantity} onChange={(value) => updateQuantity(product.id, value)} />
                    </div>
                  </div>
                  <button className="remove" onClick={() => removeFromCart(product.id)} aria-label={`Remove ${product.name}`}>
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>Your bag is quiet.</h2>
              <p>Discover something considered for the season.</p>
              <Link href="/shop" className="button button-dark">
                Shop new arrivals <ArrowRight size={15} />
              </Link>
            </div>
          )}

          <aside className="summary">
            <h3>Summary</h3>
            <div>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div>
              <span>Shipping</span>
              <strong>{shippingFee === 0 ? 'Free' : money(shippingFee)}</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>{money(subtotal + shippingFee)}</strong>
            </div>
            <Link href={cart.length ? '/checkout' : '/shop'} className="button button-dark full">
              {cart.length ? 'Proceed to Checkout' : 'Continue shopping'} <ArrowRight size={15} />
            </Link>
            <p className="secure-note">Instant Mobile Money &middot; MTN MoMo &middot; Orange Money</p>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}

/** Renders the checkout form with contact, shipping address, Mobile Money authorization, and automated order placement. */
export function CheckoutPage() {
  const { cart, clearCart } = useStore()

  const [method, setMethod] = useState<'mtn_momo' | 'orange_money'>('mtn_momo')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [phone, setPhone] = useState('')
  const [momoNumber, setMomoNumber] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shippingFee = subtotal >= 50000 || subtotal === 0 ? 0 : 2500
  const total = subtotal + shippingFee

  // Handles order placement and initiates Notch Pay Mobile Money transaction
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cart.length || isSubmitting) return

    setIsSubmitting(true)
    setCheckoutError(null)

    const customerFullName = `${firstName} ${lastName}`.trim()
    const fullAddress = `${address}, ${city}, ${state} ${zip}`.trim()
    const activePhone = momoNumber || phone

    try {
      const result = await placeOrder({
        idempotencyKey: crypto.randomUUID(),
        customerName: customerFullName,
        customerEmail: email,
        customerPhone: activePhone,
        customerAddress: fullAddress,
        city,
        provider: 'notchpay',
        paymentMethod: method === 'orange_money' ? 'Orange Money' : 'MTN Mobile Money',
        momoNumber: activePhone,
        items: cart.map((c) => ({
          productId: c.product.id,
          name: c.product.name,
          price: c.product.price,
          quantity: c.quantity,
          size: c.size,
        })),
        total,
      })

      if (!result.ok) {
        setCheckoutError(result.error || 'Could not place your order. Please try again.')
        setIsSubmitting(false)
        return
      }

      if (!result.paymentId) {
        setCheckoutError('Payment record could not be created. Please try again.')
        setIsSubmitting(false)
        return
      }

      // Initialize Notch Pay transaction and retrieve the authorization URL
      const started = await startNotchPayment(result.paymentId)
      if (!started.ok) {
        setCheckoutError(started.error || 'Could not initialize Mobile Money payment. Please check your phone number and try again.')
        setIsSubmitting(false)
        return
      }

      // Clear cart and redirect customer to the Notch Pay Mobile Money prompt page
      clearCart()
      window.location.href = started.url
    } catch (err: any) {
      console.error('Checkout error:', err)
      setCheckoutError(err?.message || 'An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="page-shell narrow">
        <div className="page-intro left">
          <p className="eyebrow">Almost there</p>
          <h1>Checkout</h1>
        </div>

        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handlePlaceOrder}>
            {/* Contact Information */}
            <div className="checkout-section">
              <h3>Contact information</h3>
              <input
                placeholder="Email address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                placeholder="Mobile phone number"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <label className="checkbox">
                <input type="checkbox" defaultChecked /> Email me with order updates and receipts
              </label>
            </div>

            {/* Shipping Address */}
            <div className="checkout-section">
              <h3>Shipping address</h3>
              <div className="input-grid">
                <input
                  placeholder="First name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                  placeholder="Last name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <input
                placeholder="Street address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <div className="input-grid three">
                <input
                  placeholder="City"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <input
                  placeholder="State / Region"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
                <input
                  placeholder="ZIP / Postal code"
                  required
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Selection */}
            <div className="checkout-section">
              <h3>Payment method</h3>
              <div className="payment-methods">
                <button
                  type="button"
                  className={method === 'mtn_momo' ? 'payment-option active' : 'payment-option'}
                  onClick={() => setMethod('mtn_momo')}
                >
                  <span className="payment-logo bg-amber-400 text-black font-bold">M</span>
                  <span>
                    <strong>MTN Mobile Money</strong>
                    <small>Instant PIN prompt on your phone</small>
                  </span>
                  <span className="payment-radio" />
                </button>

                <button
                  type="button"
                  className={method === 'orange_money' ? 'payment-option active' : 'payment-option'}
                  onClick={() => setMethod('orange_money')}
                >
                  <span className="payment-logo bg-orange-500 text-white font-bold">O</span>
                  <span>
                    <strong>Orange Money</strong>
                    <small>Instant PIN prompt on your phone</small>
                  </span>
                  <span className="payment-radio" />
                </button>
              </div>

              <div className="mobile-money-fields">
                <label>
                  Mobile Money Phone Number
                  <input
                    placeholder="e.g. 677 000 000"
                    type="tel"
                    required
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value)}
                  />
                </label>
                <p className="text-[11px] text-[#727677]">
                  An automated payment notification will be dispatched to this phone. Simply enter your Mobile Money PIN to approve.
                </p>
              </div>
            </div>

            <button
              className="button button-dark full flex items-center justify-center gap-2"
              type="submit"
              disabled={isSubmitting || !cart.length}
            >
              {isSubmitting ? 'Connecting to Mobile Money...' : `Pay ${money(total)}`} <ArrowRight size={15} />
            </button>

            {/* Show payment/order error to user */}
            {checkoutError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-2">
                {checkoutError}
              </p>
            )}
          </form>

          {/* Order Summary Sidebar */}
          <div className="checkout-order">
            <h3>Order summary</h3>
            {cart.map(({ product, quantity, size }) => (
              <div className="mini-order" key={`${product.id}-${size || 'default'}`}>
                <img src={product.image} alt="" />
                <div>
                  <span className="block font-medium">{product.name} &times; {quantity}</span>
                  {size && <span className="text-[10px] text-[#727677]">Size {size}</span>}
                </div>
                <strong>{money(product.price * quantity)}</strong>
              </div>
            ))}
            <div className="border-t border-[#dedfdd] pt-3 mt-3 space-y-1 text-xs">
              <div className="flex justify-between text-[#727677]">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#727677]">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? 'Free' : money(shippingFee)}</span>
              </div>
            </div>
            <div className="summary-total border-t border-[#dedfdd] pt-3 mt-2">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

/** Renders the wishlist saved items view. */
export function WishlistPage() {
  const { wishlist } = useStore()
  const saved = products.filter((product) => wishlist.includes(product.id))

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <div className="page-intro">
          <p className="eyebrow">Saved for later</p>
          <h1>Wishlist</h1>
          <p>{saved.length ? 'Your considered edit of pieces to come back to.' : 'Tap the heart on any piece to save it here.'}</p>
        </div>
        {saved.length ? (
          <ProductGrid items={saved} />
        ) : (
          <div className="empty-state centered">
            <HeartIcon />
            <Link href="/shop" className="button button-dark">
              Explore the collection <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}

function HeartIcon() {
  return <span className="empty-heart">&#9825;</span>
}

/** Renders the customer account dashboard, authentication modal, and personal order history. */
export function AccountPage() {
  const [tab, setTab] = useState<'signin' | 'register'>('signin')
  const [userEmail, setUserEmail] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { orders } = useAdminStore()

  // Simulate authentication for storefront customer view
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (userEmail) {
      setIsLoggedIn(true)
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="page-shell narrow account-page">
        <div className="page-intro">
          <p className="eyebrow">{isLoggedIn ? 'Member Portal' : 'Welcome back'}</p>
          <h1>{isLoggedIn ? `Account (${userEmail})` : 'My Account'}</h1>
          <p>
            {isLoggedIn
              ? 'View your recent orders, track shipments, and manage preferences.'
              : 'Sign in to view orders, save wishlist pieces, and manage details.'}
          </p>
        </div>

        {isLoggedIn ? (
          <div className="space-y-8 bg-white p-6 sm:p-8 rounded-xl border border-[#dedfdd] shadow-xs">
            <div className="flex items-center justify-between border-b border-[#dedfdd] pb-4">
              <div>
                <h2 className="font-serif text-xl text-[#182938]">Recent Purchases</h2>
                <p className="text-xs text-[#727677]">Your order history with Mixtas Studio</p>
              </div>
              <button
                onClick={() => setIsLoggedIn(false)}
                className="text-xs text-rose-600 hover:underline uppercase tracking-wider font-semibold"
              >
                Sign out
              </button>
            </div>

            {orders.length > 0 ? (
              <div className="divide-y divide-[#dedfdd] text-xs">
                {orders.slice(0, 5).map((ord) => (
                  <div key={ord.id} className="py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#182938]">Order #{ord.orderNumber}</span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#727677] mt-1">{ord.customerAddress}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-serif font-bold text-[#182938]">{money(ord.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[#727677]">
                No previous orders found for this account.
              </div>
            )}
          </div>
        ) : (
          <form className="auth-card" onSubmit={handleAuth}>
            <div className="flex gap-2 border-b border-[#dedfdd] pb-3 mb-2">
              <button
                type="button"
                className={`text-xs uppercase tracking-wider font-semibold pb-1 ${
                  tab === 'signin' ? 'text-[#182938] border-b-2 border-[#182938]' : 'text-[#727677]'
                }`}
                onClick={() => setTab('signin')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`text-xs uppercase tracking-wider font-semibold pb-1 ml-4 ${
                  tab === 'register' ? 'text-[#182938] border-b-2 border-[#182938]' : 'text-[#727677]'
                }`}
                onClick={() => setTab('register')}
              >
                Create Account
              </button>
            </div>

            <input
              type="email"
              placeholder="Email address"
              required
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
            <input type="password" placeholder="Password" required />

            <button className="button button-dark full" type="submit">
              {tab === 'signin' ? 'Sign in' : 'Register Account'} <ArrowRight size={15} />
            </button>

            {tab === 'signin' && (
              <Link href="#" className="center-link text-xs text-[#727677]">
                Forgot password?
              </Link>
            )}
          </form>
        )}
      </main>
      <Footer />
    </>
  )
}

/** Renders the brand editorial and journal blog posts with in-depth item breakdowns and direct shop links. */
export function BlogPage() {
  const featuredPost = blogPosts[0]
  const otherPosts = blogPosts.slice(1)
  const editorialProducts = products.slice(0, 6)

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        {/* Page Intro */}
        <div className="page-intro">
          <p className="eyebrow">The Mixtas Journal</p>
          <h1>Style &amp; Wardrobe Notes</h1>
          <p className="max-w-2xl mx-auto">
            In-depth guides on our signature pieces, fabric craftsmanship, fit recommendations, and considered styling for modern movement.
          </p>
        </div>

        {/* Hero Spotlight Story */}
        <section className="mb-16 bg-[#faf8f5] rounded-2xl border border-[#dedfdd] overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-xs">
          <div className="lg:col-span-7 relative min-h-[340px] sm:min-h-[440px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featuredPost.image}
              alt={featuredPost.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-xs uppercase tracking-wider font-semibold text-[#5d85a0] mb-3">
                <span>{featuredPost.category}</span>
                <span>&middot;</span>
                <span>{featuredPost.readTime}</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#182938] leading-snug mb-4">
                <Link href={`/blog/${featuredPost.slug}`} className="hover:text-[#5d85a0] transition-colors">
                  {featuredPost.title}
                </Link>
              </h2>
              <p className="text-sm text-[#727677] leading-relaxed mb-6">
                {featuredPost.excerpt}
              </p>

              {/* Items Mentioned Preview */}
              <div className="bg-white p-4 rounded-xl border border-[#dedfdd] mb-6 space-y-2">
                <p className="text-xs uppercase tracking-wider font-bold text-[#182938]">Key Pieces Featured:</p>
                <ul className="text-xs text-[#727677] space-y-1">
                  <li>&bull; <strong>Structured Double-Breasted Trench</strong> &middot; 65 000 FCFA</li>
                  <li>&bull; <strong>Oversized Silk Crepe Blouse</strong> &middot; 28 000 FCFA</li>
                  <li>&bull; <strong>Full-Grain Leather Oxford Derbies</strong> &middot; 48 000 FCFA</li>
                  <li>&bull; <strong>Studio Shoulder Bag</strong> &middot; 55 000 FCFA</li>
                </ul>
              </div>
            </div>

            <div>
              <Link href={`/blog/${featuredPost.slug}`} className="button button-dark inline-flex items-center gap-2">
                Read Full Editorial <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* Detailed Articles Grid */}
        <section className="mb-16">
          <div className="section-heading left mb-8">
            <p className="eyebrow">Explore all stories</p>
            <h2>Collection Guides &amp; Craft Notes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {otherPosts.map((post) => (
              <article key={post.slug} className="blog-card bg-white rounded-xl border border-[#dedfdd] overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-sm transition-all">
                <div>
                  <Link href={`/blog/${post.slug}`} className="block relative aspect-16/10 overflow-hidden bg-[#f4f3f0]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-103 transition-transform duration-500"
                    />
                  </Link>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#5d85a0] mb-2">
                      <span>{post.category}</span>
                      <span>&middot;</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h3 className="font-serif text-xl text-[#182938] mb-3 leading-snug">
                      <Link href={`/blog/${post.slug}`} className="hover:text-[#5d85a0] transition-colors">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-[#727677] leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-0 border-t border-[#dedfdd]/60 flex items-center justify-between">
                  <span className="text-[11px] text-[#727677]">{post.date}</span>
                  <Link href={`/blog/${post.slug}`} className="text-link text-xs font-semibold">
                    Read article <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Featured In The Journal - Direct Shop Lookbook */}
        <section className="mb-16 bg-[#faf8f5] p-8 sm:p-12 rounded-2xl border border-[#dedfdd]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#dedfdd]">
            <div>
              <p className="eyebrow">Shop the editorial</p>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#182938]">Pieces Mentioned in the Journal</h2>
            </div>
            <Link href="/shop" className="text-link text-xs font-semibold mt-2 sm:mt-0">
              View All 20 Collection Pieces <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {editorialProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-[#dedfdd] p-3 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all">
                <Link href={`/product/${product.id}`} className="block aspect-square rounded-lg overflow-hidden bg-[#f4f3f0] mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                </Link>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#5d85a0] font-semibold">{product.category}</p>
                  <h4 className="text-xs font-medium text-[#182938] line-clamp-1 mt-0.5">{product.name}</h4>
                  <p className="font-serif font-bold text-xs text-[#182938] mt-1">{money(product.price)}</p>
                </div>
                <Link href={`/product/${product.id}`} className="mt-3 text-[11px] font-semibold text-[#182938] bg-[#f4f3f0] hover:bg-[#dedfdd] text-center py-1.5 rounded transition-colors">
                  View Piece
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Fabric & Craftsmanship Philosophy */}
        <section className="bg-white p-8 sm:p-12 rounded-2xl border border-[#dedfdd] mb-12">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-10">
            <p className="eyebrow">The Standards We Keep</p>
            <h2 className="font-serif text-3xl text-[#182938]">Craftsmanship, Sourcing &amp; Longevity</h2>
            <p className="text-sm text-[#727677] leading-relaxed">
              Every item in our catalogue is chosen with longevity in mind. We collaborate directly with textile mills that specialize in organic natural fibers, unadulterated leathers, and robust construction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="p-5 rounded-xl bg-[#faf8f5] border border-[#dedfdd] space-y-2">
              <h3 className="font-serif font-bold text-base text-[#182938]">Mulberry Silk</h3>
              <p className="text-xs text-[#727677] leading-relaxed">
                Hypoallergenic, breathable, and temperature-regulating. Woven in a matte crepe finish for effortless drape.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#faf8f5] border border-[#dedfdd] space-y-2">
              <h3 className="font-serif font-bold text-base text-[#182938]">Full-Grain Calfskin</h3>
              <p className="text-xs text-[#727677] leading-relaxed">
                Vegetable-tanned and Goodyear-welted. Develops a rich organic patina and molds to your step over time.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#faf8f5] border border-[#dedfdd] space-y-2">
              <h3 className="font-serif font-bold text-base text-[#182938]">European Flax Linen</h3>
              <p className="text-xs text-[#727677] leading-relaxed">
                Spun from heavyweight natural flax. Keeps you cool under sunlight and softens with each wash.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#faf8f5] border border-[#dedfdd] space-y-2">
              <h3 className="font-serif font-bold text-base text-[#182938]">French Terry Fleece</h3>
              <p className="text-xs text-[#727677] leading-relaxed">
                Heavyweight 460 GSM cotton fleece. Pre-shrunk and double-stitched for enduring boxy silhouette.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

/** Renders the customer contact and feedback form. */
export function ContactPage() {
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <>
      <SiteHeader />
      <main className="page-shell contact-page">
        <div className="contact-intro">
          <p className="eyebrow">We would love to hear from you</p>
          <h1>
            Questions,<br />
            <em>ideas, hello.</em>
          </h1>
          <p>Our team is here Monday through Friday, 9am–5pm EST. We usually reply within one business day.</p>
          <a href="mailto:hello@mixtas.studio" className="text-link">
            hello@mixtas.studio <ArrowRight size={14} />
          </a>
        </div>

        {sent ? (
          <div className="bg-white p-8 rounded-xl border border-[#dedfdd] text-center max-w-md">
            <CheckCircle2 size={32} className="text-emerald-600 mx-auto mb-3" />
            <h3 className="font-serif text-xl text-[#182938]">Message Dispatched</h3>
            <p className="text-xs text-[#727677] mt-1">Thank you for reaching out. We will get back to you shortly.</p>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <label>
              Your name
              <input placeholder="Name" required />
            </label>
            <label>
              Email address
              <input type="email" placeholder="Email" required />
            </label>
            <label>
              How can we help?
              <textarea placeholder="Tell us a little more" rows={5} required />
            </label>
            <button className="button button-dark" type="submit">
              Send message <ArrowRight size={15} />
            </button>
          </form>
        )}
      </main>
      <Footer />
    </>
  )
}
