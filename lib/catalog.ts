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

export const categories = ['Women', 'Men', 'Jackets', 'Shoes', 'Bags', 'Accessories']
export type BlogPost = {
  slug: string
  title: string
  subtitle?: string
  date: string
  category: string
  readTime: string
  image: string
  excerpt: string
  featuredProductIds: string[]
  content: {
    intro: string
    sections: {
      heading: string
      productId?: string
      body: string
      highlight?: string
    }[]
    conclusion: string
  }
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'the-new-uniform',
    title: 'The New Uniform: Curating an Everyday Wardrobe for Modern Movement',
    subtitle: 'How structured outerwear, refined silk crepe, and handcrafted footwear form the foundational core of contemporary dressing.',
    date: 'September 15, 2026',
    category: 'Style & Wardrobe',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85',
    excerpt: 'A comprehensive editorial breakdown of our quintessential capsule pieces: from the Structured Double-Breasted Trench to Goodyear-welted Derbies and the Mulberry Silk Crepe Blouse.',
    featuredProductIds: ['wool-trench', 'silk-blouse', 'derby-shoes', 'leather-bag'],
    content: {
      intro: 'In an era where personal schedules oscillate between metropolitan commutes, studio work, and relaxed evening gatherings, the modern wardrobe must perform with effortless poise. Our "New Uniform" philosophy centers around versatility without compromise—elevating essential cuts through artisanal textiles, clean lines, and durable construction.',
      sections: [
        {
          heading: '1. The Hero Layer: Structured Double-Breasted Trench (65 000 FCFA)',
          productId: 'wool-trench',
          body: 'Every capsule wardrobe demands an unmistakable anchor. Tailored from a tightly woven, weather-resistant wool blend, our Structured Trench features a classic storm flap, raglan shoulders for fluid arm movement, and polished horn buttons. Designed to be worn loose over light knitwear or belted snugly at the waist, it instantly elevates casual denim into high-tailored elegance.',
          highlight: 'Styling Recommendation: Pair with wide-leg trousers and leave the front open to create a tall, vertical line.',
        },
        {
          heading: '2. Fluid Tactility: Oversized Silk Crepe Blouse (28 000 FCFA)',
          productId: 'silk-blouse',
          body: 'Crafted from 100% natural mulberry silk crepe, this blouse balances slouchy ease with refined formal poise. The matte crepe texture avoids excessive sheen, offering a sophisticated drape that complements both sharp blazers and relaxed chinos. Mother-of-pearl buttons and dropped shoulder seams provide subtle luxury you can feel all day.',
          highlight: 'Fabric Note: Breathable, hypoallergenic natural silk keeps you cool in tropical humidity and warm during breezy evenings.',
        },
        {
          heading: '3. Grounded Elegance: Full-Grain Leather Oxford Derbies (48 000 FCFA)',
          productId: 'derby-shoes',
          body: 'Footwear is the foundation of posture and presence. Built upon an authentic Goodyear-welted construction, our Oxford Derbies are hand-buffed in rich espresso calfskin. The reinforced leather sole is fitted with a shock-absorbing rubber heel cap, guaranteeing years of comfortable city exploration and easy resoleability.',
          highlight: 'Fit Guide: True to size. Crafted with an anatomical toe box to avoid pressure points during long walking days.',
        },
        {
          heading: '4. Sculptural Utility: Studio Shoulder Bag (55 000 FCFA)',
          productId: 'leather-bag',
          body: 'Engineered for seamless daily transition, the Studio Shoulder Bag is cut from premium vegetable-tanned full-grain leather that develops a unique patina over time. It comfortably accommodates an 11-inch tablet, daily essentials, and personal notebooks while retaining its sculptural silhouette.',
          highlight: 'Key Detail: Hidden magnetic closure with interior microsuede lining and zippered security pocket.',
        },
      ],
      conclusion: 'Building a considered wardrobe is not about accumulating garments; it is about choosing pieces that dialogue seamlessly with one another. Each of these featured items is crafted to stand the test of time, both aesthetically and structurally.',
    },
  },
  {
    slug: 'blue-hour',
    title: 'Blue Hour: Athleisure Refined with Sportswear Heritage',
    subtitle: 'Exploring technical knit layers, fleece pullovers, and minimalist city runners engineered for active comfort.',
    date: 'September 08, 2026',
    category: 'Collection Spotlight',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85',
    excerpt: 'Discover the tactile craftsmanship behind the adidas X Pop Beckenbauer Track Jacket, the Butter Pullover Hoodie, and Courtline City Runner.',
    featuredProductIds: ['track-jacket', 'hoodie', 'runner-white', 'cap'],
    content: {
      intro: 'When sport heritage meets minimal tailoring, sportswear transcends the gym to become a definitive cultural uniform. The "Blue Hour" capsule draws inspiration from twilight tones in the city, merging retro sports silhouettes with modern cuts and heavyweight premium fabrics.',
      sections: [
        {
          heading: '1. Heritage Icon: adidas X Pop Beckenbauer Track Jacket (45 000 FCFA)',
          productId: 'track-jacket',
          body: 'A reimagined classic featuring high-density double-knit pique fabric with crisp three-stripe sleeve paneling. The structured stand-up collar retains its shape throughout the day, while deep zip pockets keep your phone and cardholder secure on the move.',
          highlight: 'Styling Tip: Layer under a wool overcoat for a dynamic contrast between sporty vigor and formal tailoring.',
        },
        {
          heading: '2. Maximum Comfort: Butter Pullover Hood (35 000 FCFA)',
          productId: 'hoodie',
          body: 'Weighing in at a substantial 460 GSM, the Butter Pullover is cut from custom-brushed French terry fleece. It features a double-layered hood without drawstrings for a streamlined look, ribbed side gussets for mobility, and reinforced pouch pocket stitching.',
          highlight: 'Draping: Pre-shrunk cotton ensures the boxy silhouette stays consistent after every wash.',
        },
        {
          heading: '3. Urban City Stride: Courtline City Runner (40 000 FCFA)',
          productId: 'runner-white',
          body: 'A minimalist white sneaker stripped of noisy branding. Constructed with buttery soft nappa leather uppers, antibacterial calfskin lining, and an ultra-cushioned EVA foam midsole that absorbs step shock across asphalt and cobblestones.',
          highlight: 'Comfort Guarantee: Built with a removable ergonomic footbed suitable for all-day standing.',
        },
        {
          heading: '4. Everyday Cap: adidas X Pop SL Cap (15 000 FCFA)',
          productId: 'cap',
          body: 'A classic low-profile six-panel baseball cap rendered in deep navy cotton twill. Features an adjustable antiqued brass buckle closure and subtle tonal embroidery for an understated athletic finish.',
          highlight: 'Utility: Moisture-wicking interior sweatband keeps your forehead dry on warm afternoons.',
        },
      ],
      conclusion: 'Effortless cool comes from apparel that feels natural on the body. These sport-infused essentials provide the freedom to move through the city with agility, style, and absolute confidence.',
    },
  },
  {
    slug: 'good-materials',
    title: 'Material Matters: The Art of Sustainable Fibers & Natural Leathers',
    subtitle: 'Why pure organic cotton, unlined breathable linen, and Italian vegetable-tanned leather outlast fast fashion cycles.',
    date: 'August 25, 2026',
    category: 'Fabric & Craft',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=85',
    excerpt: 'An educational journey through the fibers that define our newest collection: pure linen overshirts, tailored wool trousers, and hand-finished canvas totes.',
    featuredProductIds: ['linen-overshirt', 'tailored-trouser', 'crossbody-tote', 'cashmere-scarf'],
    content: {
      intro: 'True luxury lies in the integrity of raw materials. When garments are produced from honest, unadulterated natural fibers, they age with grace, breathe with the body, and respect our environmental footprint. Here is how our staple pieces translate this ethos into tangible garments.',
      sections: [
        {
          heading: '1. Sun-Drenched Texture: Relaxed Heavy Linen Overshirt (24 000 FCFA)',
          productId: 'linen-overshirt',
          body: 'Spun from 100% natural European flax, our heavy linen overshirt offers substantial hand-feel while promoting unmatched airflow. Garment-dyed in warm earth tones, it features dual chest utility pockets and horn buttons.',
          highlight: 'Care Advantage: Linen softens with every wash, molding uniquely to your body contours over months of wear.',
        },
        {
          heading: '2. Tailored Movement: Pleated Wide-Leg Wool Trousers (34 000 FCFA)',
          productId: 'tailored-trouser',
          body: 'Tailored from high-twist tropical virgin wool, these trousers resist creasing and boast a fluid drape with sharp double front pleats. The extended waistband tab and deep side pockets blend mid-century sartorial tradition with modern proportions.',
          highlight: 'Versatility: Wear with clean white sneakers for weekend brunches or dress up with leather derbies for formal business dinners.',
        },
        {
          heading: '3. Rugged Refinement: Minimalist Canvas & Leather Tote (38 000 FCFA)',
          productId: 'crossbody-tote',
          body: 'Constructed from heavy 24oz organic cotton canvas, this tote is built to carry substantial weight without stretching. Reinforced with full-grain Italian leather handles and brass rivets, it includes a padded interior laptop compartment.',
          highlight: 'Capacity: Fits a 15-inch laptop, water bottle, workout gear, and groceries effortlessly.',
        },
        {
          heading: '4. Weightless Softness: Fringed Brushed Cashmere Scarf (22 000 FCFA)',
          productId: 'cashmere-scarf',
          body: 'Woven from grade-A Himalayan cashmere fibers, this scarf offers incredible warmth-to-weight ratio. Finished with hand-twisted fringe details, it provides an exquisite textural touch to any winter or transitional look.',
          highlight: 'Feel: So delicate that it can be worn directly against sensitive neck skin without any prickliness.',
        },
      ],
      conclusion: 'Investing in high-grade materials changes your relationship with your wardrobe. By opting for authentic textiles, you buy fewer, better pieces that stay in your rotation for years to come.',
    },
  },
  {
    slug: 'the-shoe-handbook',
    title: 'The Shoe Handbook: Oxford Derbies, Penny Loafers & Court Sneakers',
    subtitle: 'From Goodyear welts to sculpted lug soles: selecting the right footwear for each occasion.',
    date: 'August 14, 2026',
    category: 'Footwear Guide',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',
    excerpt: 'A comprehensive comparison between classic leather oxfords, chunky lugged penny loafers, and court city runners to anchor your outfits.',
    featuredProductIds: ['derby-shoes', 'chunky-loafers', 'trax-vintage', 'runner-white'],
    content: {
      intro: 'A person is only as well-dressed as their footwear. Selecting the appropriate shoe is not merely an aesthetic choice—it dictates your gait, comfort, and the overall cadence of your attire. We break down the four staple pairs available in our store.',
      sections: [
        {
          heading: '1. The Formal Cornerstone: Full-Grain Leather Oxford Derbies (48 000 FCFA)',
          productId: 'derby-shoes',
          body: 'Whether attending formal conferences, weddings, or evening receptions, the Oxford Derby is the quintessential gentleman’s staple. Ours is built on a traditional English last with an open lacing system for higher arches.',
          highlight: 'Maintenance: Clean with beeswax polish every three months to maintain deep leather luster.',
        },
        {
          heading: '2. The Modern Icon: Lugged Sole Penny Loafers (42 000 FCFA)',
          productId: 'chunky-loafers',
          body: 'Reinterpreting Ivy League collegiate style with a bold, contemporary edge. Features a beefroll penny strap, hand-stitched apron, and an exaggerated commando rubber sole that offers extreme grip and elevation.',
          highlight: 'Styling: Looks stunning paired with white ribbed sports socks and cropped wool trousers.',
        },
        {
          heading: '3. Retro Runner: adidas X Pop TRX Vintage (30 000 FCFA)',
          productId: 'trax-vintage',
          body: 'A faithful homage to 1970s distance running shoes. Features a lightweight nylon base with premium suede overlays and a studded traction outsole that grips any urban terrain.',
          highlight: 'Vibe: Nostalgic, athletic, and effortlessly pairs with baggy sweatpants or rolled-up raw denim.',
        },
        {
          heading: '4. Everyday Clean: Courtline City Runner (40 000 FCFA)',
          productId: 'runner-white',
          body: 'The universal sneaker that pairs with literally everything in your closet. Crisp white Italian nappa leather with tonal stitching, flat waxed cotton laces, and a padded ankle collar.',
          highlight: 'Versatility: 10/10 compatibility with shorts, jeans, trousers, and trench coats.',
        },
      ],
      conclusion: 'Equipping yourself with the right trio—a clean white runner, a chunky loafer, and a formal derby—guarantees you will never be underdressed or uncomfortable anywhere in the world.',
    },
  },
]

// Formats a number to Franc CFA string with spaced thousand grouping
export function money(value: number) {
  if (value === null || value === undefined || Number.isNaN(value)) return '0 FCFA'
  return `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`
}
export function getProduct(id: string) { return products.find((product) => product.id === id) }
export function relatedProducts(productId: string) { return products.filter((product) => product.id !== productId).slice(0, 4) }
export function getBlogPost(slug: string) { return blogPosts.find((p) => p.slug === slug) }

export const navItems = [
  { label: 'Shop', href: '/shop' },
  { label: 'Journal', href: '/blog' },
  { label: 'About', href: '/contact' },
]

export type CartItem = { product: Product; quantity: number; size?: string }
export const initialCart: CartItem[] = []

