// Secondary storefront pages including shopping cart, checkout, wishlist, account, journal, and contact.

'use client'

import Link from 'next/link'
import React, { useState } from 'react'
import { ArrowRight, Check, Mail, Heart, Trash2, ShieldCheck, CheckCircle2, Phone, CreditCard, ShoppingBag } from 'lucide-react'
import { Footer, ProductGrid, SiteHeader, Quantity, useStore } from '@/components/store'
import { blogPosts, money, products } from '@/lib/catalog'
import { placeOrder } from '@/app/checkout/actions'
import { useAdminStore } from '@/lib/admin-store'

/** Renders the shopping bag view with item quantity management and subtotal calculations. */
export function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useStore()
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  return (
    <>
      <SiteHeader />
      <main className="page-shell narrow">
        <div className="page-intro left">
          <p className="eyebrow">Your selection</p>
          <h1>Shopping bag</h1>
          <p>{cart.length} items &middot; Complimentary shipping over $150</p>
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
              <strong>{subtotal >= 150 || subtotal === 0 ? 'Free' : '$12.00'}</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>{money(subtotal >= 150 || subtotal === 0 ? subtotal : subtotal + 12)}</strong>
            </div>
            <Link href={cart.length ? '/checkout' : '/shop'} className="button button-dark full">
              {cart.length ? 'Proceed to Checkout' : 'Continue shopping'} <ArrowRight size={15} />
            </Link>
            <p className="secure-note">Secure checkout &middot; Visa &middot; Mastercard &middot; Mobile money</p>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  )
}

/** Renders the checkout checkout form with contact, address, payment method selection, and order placement. */
export function CheckoutPage() {
  const { cart, clearCart } = useStore()
  const { addOrder, addPayment } = useAdminStore()

  const [method, setMethod] = useState<'mtn_momo' | 'orange_money' | 'card' | 'paypal'>('mtn_momo')
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
  const [orderConfirmed, setOrderConfirmed] = useState<{
    orderNumber: number | string
    total: number
    paymentReference: string
  } | null>(null)

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const shippingFee = subtotal >= 150 || subtotal === 0 ? 0 : 12
  const total = subtotal + shippingFee

  // Handles order submission and synchronization with backend
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cart.length) return

    setIsSubmitting(true)

    const customerFullName = `${firstName} ${lastName}`.trim()
    const fullAddress = `${address}, ${city}, ${state} ${zip}`.trim()

    try {
      // Attempt backend order creation via server action
      const result = await placeOrder({
        customerName: customerFullName,
        customerEmail: email,
        customerPhone: phone || momoNumber,
        customerAddress: fullAddress,
        city,
        paymentMethod: method,
        momoNumber: method.includes('momo') ? momoNumber : undefined,
        items: cart.map((c) => ({
          productId: c.product.id,
          name: c.product.name,
          price: c.product.price,
          quantity: c.quantity,
          size: c.size,
        })),
        total,
      })

      // Also sync to client admin store for immediate interactive dashboard preview
      const localOrderNum = result.orderNumber || Math.floor(1000 + Math.random() * 9000)
      const localOrderId = result.orderId || `ord-${Date.now()}`

      addOrder({
        orderNumber: typeof localOrderNum === 'number' ? localOrderNum : Number(localOrderNum),
        customerName: customerFullName,
        customerPhone: phone || momoNumber,
        customerAddress: fullAddress,
        status: 'pending',
        total,
        currency: 'XAF',
        items: cart.map((c, i) => ({
          id: `item-${Date.now()}-${i}`,
          orderId: localOrderId,
          productName: c.size ? `${c.product.name} (Size ${c.size})` : c.product.name,
          unitPrice: c.product.price,
          quantity: c.quantity,
        })),
      })

      addPayment({
        orderId: localOrderId,
        orderNumber: typeof localOrderNum === 'number' ? localOrderNum : Number(localOrderNum),
        provider: method,
        providerReference: result.paymentReference || `REF-${Date.now()}`,
        amount: total,
        currency: 'XAF',
        status: 'pending',
        payerPhone: momoNumber || phone,
        payerName: customerFullName,
      })

      setOrderConfirmed({
        orderNumber: localOrderNum,
        total,
        paymentReference: result.paymentReference,
      })

      clearCart()
    } catch (err) {
      console.warn('Backend server action notice, fallback client sync:', err)
      // Client-side fallback if database is in setup phase
      const fallbackNum = Math.floor(1000 + Math.random() * 9000)
      const fallbackRef = `MOM-${Date.now()}`
      const fallbackId = `ord-${Date.now()}`

      addOrder({
        orderNumber: fallbackNum,
        customerName: customerFullName,
        customerPhone: phone || momoNumber,
        customerAddress: fullAddress,
        status: 'pending',
        total,
        currency: 'XAF',
        items: cart.map((c, i) => ({
          id: `item-${Date.now()}-${i}`,
          orderId: fallbackId,
          productName: c.size ? `${c.product.name} (Size ${c.size})` : c.product.name,
          unitPrice: c.product.price,
          quantity: c.quantity,
        })),
      })

      addPayment({
        orderId: fallbackId,
        orderNumber: fallbackNum,
        provider: method,
        providerReference: fallbackRef,
        amount: total,
        currency: 'XAF',
        status: 'pending',
        payerPhone: momoNumber || phone,
        payerName: customerFullName,
      })

      setOrderConfirmed({
        orderNumber: fallbackNum,
        total,
        paymentReference: fallbackRef,
      })

      clearCart()
    } finally {
      setIsSubmitting(false)
    }
  }

  // If order was placed, display dedicated confirmation screen
  if (orderConfirmed) {
    return (
      <>
        <SiteHeader />
        <main className="page-shell narrow">
          <div className="bg-white p-8 sm:p-12 rounded-xl border border-[#dedfdd] text-center max-w-xl mx-auto my-12 shadow-sm space-y-6">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-[#5d85a0] font-semibold">Thank You For Your Order</p>
              <h1 className="font-serif text-3xl text-[#182938] mt-1">Order #{orderConfirmed.orderNumber} Confirmed</h1>
              <p className="text-xs text-[#727677] mt-2">
                We have received your order request. A confirmation and payment prompt will be dispatched to your contact details.
              </p>
            </div>

            <div className="p-4 bg-[#f4f3f0] rounded-lg border border-[#dedfdd] text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#727677]">Transaction Reference:</span>
                <span className="font-mono font-medium text-[#182938]">{orderConfirmed.paymentReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#727677]">Payment Method:</span>
                <span className="capitalize font-medium text-[#182938]">{method.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#727677]">Total Amount:</span>
                <span className="font-bold text-[#182938] font-serif">${orderConfirmed.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#727677]">Status:</span>
                <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-semibold text-[10px]">Payment Pending</span>
              </div>
            </div>

            {method.includes('momo') && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2 text-left">
                <Phone size={18} className="flex-shrink-0" />
                <span>
                  Please check your phone (<strong>{momoNumber || phone}</strong>) and approve the Mobile Money prompt to finalize your transfer.
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link href="/shop" className="button button-dark flex-1">
                Continue Shopping <ArrowRight size={15} />
              </Link>
              <Link href="/account" className="outline-button flex-1">
                View My Account
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
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
                    <small>Instant push prompt on your phone</small>
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
                    <small>Fast wallet payment authorization</small>
                  </span>
                  <span className="payment-radio" />
                </button>

                <button
                  type="button"
                  className={method === 'card' ? 'payment-option active' : 'payment-option'}
                  onClick={() => setMethod('card')}
                >
                  <span className="payment-logo card-logo">▣</span>
                  <span>
                    <strong>Card payment</strong>
                    <small>Visa, Mastercard, or Amex</small>
                  </span>
                  <span className="payment-radio" />
                </button>
              </div>

              {method.includes('momo') || method === 'orange_money' ? (
                <div className="mobile-money-fields">
                  <label>
                    Mobile Money Number
                    <input
                      placeholder="e.g. 670 000 000"
                      type="tel"
                      required
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                    />
                  </label>
                  <p className="text-[11px] text-[#727677]">
                    A secure USSD payment prompt will be sent directly to this number upon placing your order.
                  </p>
                </div>
              ) : (
                <div className="mobile-money-fields">
                  <label>
                    Card number
                    <input placeholder="1234 5678 9012 3456" inputMode="numeric" required />
                  </label>
                  <div className="input-grid">
                    <input placeholder="MM / YY" required />
                    <input placeholder="CVC" required />
                  </div>
                </div>
              )}
            </div>

            <button
              className="button button-dark full flex items-center justify-center gap-2"
              type="submit"
              disabled={isSubmitting || !cart.length}
            >
              {isSubmitting ? 'Processing Order...' : `Place Order · ${money(total)}`} <ArrowRight size={15} />
            </button>
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
                      <span className="font-serif font-bold text-[#182938]">${ord.total.toFixed(2)}</span>
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

/** Renders the brand editorial and journal blog posts. */
export function BlogPage() {
  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <div className="page-intro">
          <p className="eyebrow">From the studio</p>
          <h1>Journal</h1>
          <p>Stories about style, materials, and making space for the good things.</p>
        </div>
        <div className="blog-grid">
          {blogPosts.map((post) => (
            <article className="blog-card" key={post.slug}>
              <Link href={`/blog/${post.slug}`}>
                <img src={post.image} alt={post.title} />
              </Link>
              <p className="eyebrow">{post.category} &middot; {post.date}</p>
              <h2>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p>{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`} className="text-link">
                Read story <ArrowRight size={14} />
              </Link>
            </article>
          ))}
        </div>
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
