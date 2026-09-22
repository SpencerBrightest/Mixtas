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
  { id: 'polo-navy', name: 'adidas X Pop Polo Shirt', category: 'Jackets', price: 3000, image: 'https://images.unsplash.com/photo-1627225924765-552d49cf47ad?auto=format&fit=crop&w=900&q=85', description: 'A relaxed everyday polo with a clean athletic finish.', colors: ['Navy', 'White'], sizes: ['S', 'M', 'L', 'XL'], badge: 'New' },
  { id: 'trax-vintage', name: 'adidas X Pop TRX Vintage', category: 'Shoes', price: 30000, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85', description: 'Retro-inspired runners built for city movement.', colors: ['Navy', 'White'], sizes: ['7', '8', '9', '10', '11'] },
  { id: 'track-jacket', name: 'adidas X Pop Beckenbauer Track Jacket', category: 'Jackets', price: 45000, image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85', description: 'A structured track layer with signature three-stripe detailing.', colors: ['Ink', 'Blue'], sizes: ['S', 'M', 'L', 'XL'] },
  { id: 'classic-tee', name: 'adidas X Pop Classic T-shirt', category: 'Jackets', price: 20000, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85', description: 'Soft cotton jersey cut with a considered, boxy silhouette.', colors: ['Grey', 'Navy'], sizes: ['S', 'M', 'L', 'XL'] },
  { id: 'cap', name: 'adidas X Pop SL Cap', category: 'Accessories', price: 15000, image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=85', description: 'A six-panel cap for off-duty days.', colors: ['Navy', 'White'], sizes: ['One size'] },
  { id: 'hoodie', name: 'Butter Pullover Hood', category: 'Jackets', price: 35000, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85', description: 'Heavyweight brushed fleece with a generous hood.', colors: ['Denim', 'Black'], sizes: ['S', 'M', 'L', 'XL'] },
  { id: 'par-tee', name: 'Rung Pull T-shirt', category: 'Jackets', price: 18000, image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85', description: 'A playful graphic tee for the everyday rotation.', colors: ['White'], sizes: ['S', 'M', 'L'] },
  { id: 'crewneck', name: 'Comfort LS Sweatshirt', category: 'Jackets', price: 32000, image: 'https://images.unsplash.com/photo-1606725116923-5d5ec6a0d6cf?auto=format&fit=crop&w=900&q=85', description: 'The soft, easy layer you will reach for all season.', colors: ['Oat', 'Black'], sizes: ['S', 'M', 'L', 'XL'] },
  { id: 'leather-bag', name: 'Studio Shoulder Bag', category: 'Bags', price: 55000, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=85', description: 'An everyday leather carryall with a sculptural profile.', colors: ['Black', 'Brown'], sizes: ['One size'], badge: 'Editors pick' },
  { id: 'runner-white', name: 'Courtline City Runner', category: 'Shoes', price: 40000, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85', description: 'Minimal white sneakers with a cushioned city sole.', colors: ['White'], sizes: ['7', '8', '9', '10', '11'] },
  { id: 'silk-blouse', name: 'Oversized Silk Crepe Blouse', category: 'Women', price: 28000, oldPrice: 35000, image: 'https://images.unsplash.com/photo-1534126511673-b6899657816a?auto=format&fit=crop&w=900&q=85', description: 'Fluid tailored blouse cut from premium mulberry silk crepe.', colors: ['Ecru', 'Olive'], sizes: ['XS', 'S', 'M', 'L'], badge: 'New' },
  { id: 'wool-trench', name: 'Structured Double-Breasted Trench', category: 'Women', price: 65000, oldPrice: 75000, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85', description: 'A timeless cold-weather layer tailored with a refined storm flap and horn buttons.', colors: ['Camel', 'Charcoal'], sizes: ['S', 'M', 'L'], badge: 'Bestseller' },
  { id: 'linen-overshirt', name: 'Relaxed Heavy Linen Overshirt', category: 'Men', price: 24000, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=85', description: 'Breathable textured linen jacket designed for effortless layering in warmer weather.', colors: ['Sand', 'Navy', 'Olive'], sizes: ['S', 'M', 'L', 'XL'] },
  { id: 'tailored-trouser', name: 'Pleated Wide-Leg Wool Trousers', category: 'Men', price: 34000, image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=85', description: 'Crisply pressed trousers with front pleats and a relaxed tapered drape.', colors: ['Black', 'Dark Grey'], sizes: ['30', '32', '34', '36'] },
  { id: 'derby-shoes', name: 'Full-Grain Leather Oxford Derbies', category: 'Shoes', price: 48000, oldPrice: 55000, image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=900&q=85', description: 'Handcrafted Goodyear-welted leather shoes with a polished burnished toe.', colors: ['Espresso', 'Black'], sizes: ['40', '41', '42', '43', '44'], badge: 'Handmade' },
  { id: 'chunky-loafers', name: 'Lugged Sole Penny Loafers', category: 'Shoes', price: 42000, image: 'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=900&q=85', description: 'Modern chunky profile crafted in supple calfskin leather with a cushioned insole.', colors: ['Burgundy', 'Black'], sizes: ['37', '38', '39', '40', '41'] },
  { id: 'crossbody-tote', name: 'Minimalist Canvas & Leather Tote', category: 'Bags', price: 38000, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85', description: 'Heavyweight organic cotton canvas reinforced with Italian vegetable-tanned leather handles.', colors: ['Natural / Tan', 'All Black'], sizes: ['One size'], badge: 'Eco' },
  { id: 'mini-crossbody', name: 'Curved Structured Crossbody Bag', category: 'Bags', price: 32000, image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=900&q=85', description: 'Sleek architectural crossbody bag with an adjustable strap and magnetic closure.', colors: ['Sage', 'Taupe', 'Noir'], sizes: ['One size'] },
  { id: 'acetate-sunglasses', name: 'Sculpted Square Acetate Sunglasses', category: 'Accessories', price: 16000, image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85', description: 'UV400 protective polarized lenses encased in polished Italian acetate frames.', colors: ['Tortoise', 'Solid Black'], sizes: ['One size'] },
  { id: 'cashmere-scarf', name: 'Fringed Brushed Cashmere Scarf', category: 'Accessories', price: 22000, image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=900&q=85', description: 'Ultra-soft pure cashmere woven with delicate eyelash fringe edges.', colors: ['Oatmeal', 'Camel', 'Grey'], sizes: ['One size'] },
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
