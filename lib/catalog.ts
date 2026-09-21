export type Product = {
  id: string
  name: string
  category: string
  price: number
  oldPrice?: number
  image: string
  images?: string[]
  colors?: string[]
  sizes?: string[]
  description: string
  badge?: string
}

export const products: Product[] = [
  { id: 'polo-navy', name: 'adidas X Pop Polo Shirt', category: 'Jackets', price: 25000, image: 'https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=900&q=85', description: 'A relaxed everyday polo with a clean athletic finish.', colors: ['Navy', 'White'], sizes: ['S', 'M', 'L', 'XL'], badge: 'New' },
  { id: 'trax-vintage', name: 'adidas X Pop TRX Vintage', category: 'Shoes', price: 30000, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85', description: 'Retro-inspired runners built for city movement.', colors: ['Navy', 'White'], sizes: ['7', '8', '9', '10', '11'] },
  { id: 'track-jacket', name: 'adidas X Pop Beckenbauer Track Jacket', category: 'Jackets', price: 45000, image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85', description: 'A structured track layer with signature three-stripe detailing.', colors: ['Ink', 'Blue'], sizes: ['S', 'M', 'L', 'XL'] },
  { id: 'classic-tee', name: 'adidas X Pop Classic T-shirt', category: 'Jackets', price: 20000, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85', description: 'Soft cotton jersey cut with a considered, boxy silhouette.', colors: ['Grey', 'Navy'], sizes: ['S', 'M', 'L', 'XL'] },
  { id: 'cap', name: 'adidas X Pop SL Cap', category: 'Accessories', price: 15000, image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=85', description: 'A six-panel cap for off-duty days.', colors: ['Navy', 'White'], sizes: ['One size'] },
  { id: 'hoodie', name: 'Butter Pullover Hood', category: 'Jackets', price: 35000, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85', description: 'Heavyweight brushed fleece with a generous hood.', colors: ['Denim', 'Black'], sizes: ['S', 'M', 'L', 'XL'] },
  { id: 'par-tee', name: 'Rung Pull T-shirt', category: 'Jackets', price: 18000, image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85', description: 'A playful graphic tee for the everyday rotation.', colors: ['White'], sizes: ['S', 'M', 'L'] },
  { id: 'crewneck', name: 'Comfort LS Sweatshirt', category: 'Jackets', price: 32000, image: 'https://images.unsplash.com/photo-1606725116923-5d5ec6a0d6cf?auto=format&fit=crop&w=900&q=85', description: 'The soft, easy layer you will reach for all season.', colors: ['Oat', 'Black'], sizes: ['S', 'M', 'L', 'XL'] },
  { id: 'leather-bag', name: 'Studio Shoulder Bag', category: 'Bags', price: 55000, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85', description: 'An everyday leather carryall with a sculptural profile.', colors: ['Black', 'Brown'], sizes: ['One size'], badge: 'Editors pick' },
  { id: 'runner-white', name: 'Courtline City Runner', category: 'Shoes', price: 40000, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85', description: 'Minimal white sneakers with a cushioned city sole.', colors: ['White'], sizes: ['7', '8', '9', '10', '11'] },
]

export const heroImage = 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2000&q=90'

export const categories = ['Women', 'Men', 'Shoes', 'Bags', 'Accessories']
export const blogPosts = [
  { slug: 'the-new-uniform', title: 'The new uniform: dressing for the life you actually live', date: 'September 12, 2026', category: 'Journal', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85', excerpt: 'A closer look at the pieces that make up a considered everyday wardrobe.' },
  { slug: 'blue-hour', title: 'Blue hour: the mood of a changing season', date: 'August 28, 2026', category: 'Stories', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85', excerpt: 'Our fall palette starts with a shade that always feels right.' },
  { slug: 'good-materials', title: 'Good materials, better habits', date: 'August 10, 2026', category: 'Notes', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=85', excerpt: 'Why we are choosing fewer, more thoughtful fabrics this year.' },
]

// Formats a number to Franc CFA string with spaced thousand grouping
export function money(value: number) {
  if (isNaN(value) || value === null || value === undefined) return '0 FCFA'
  return `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`
}
export function getProduct(id: string) { return products.find((product) => product.id === id) ?? products[0] }
export function relatedProducts(productId: string) { return products.filter((product) => product.id !== productId).slice(0, 4) }

export const navItems = [
  { label: 'Shop', href: '/shop' },
  { label: 'Journal', href: '/blog' },
  { label: 'About', href: '/contact' },
]

export type CartItem = { product: Product; quantity: number; size?: string }
export const initialCart: CartItem[] = [{ product: products[0], quantity: 1, size: 'M' }, { product: products[1], quantity: 1, size: '9' }]
