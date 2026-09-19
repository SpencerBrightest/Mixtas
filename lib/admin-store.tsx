// Provides reactive client-side state and mock data management for the admin dashboard.

'use client'

import React, { createContext, useContext, useState } from 'react'

export interface Category {
  id: string
  name: string
  slug: string
  productCount: number
  createdAt: string
}

export interface ProductImage {
  id: string
  url: string
  position: number
  isPrimary: boolean
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number // XAF integer
  compareAtPrice?: number
  stock: number
  lowStockThreshold: number
  categoryId: string
  categoryName: string
  isActive: boolean
  images: ProductImage[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  productImage?: string
  unitPrice: number
  quantity: number
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'cancelled' | 'refunded'

export interface Order {
  id: string
  orderNumber: number
  userId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  status: OrderStatus
  total: number
  currency: string
  notes?: string
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'refunded'

export interface Payment {
  id: string
  orderId?: string
  orderNumber?: number
  userId?: string
  userName?: string
  provider: 'mtn_momo' | 'orange_money' | 'flutterwave' | 'manual'
  providerReference: string
  amount: number
  currency: string
  status: PaymentStatus
  payerPhone: string
  payerName: string
  confirmedBy?: string
  confirmedAt?: string
  rawPayload?: Record<string, any>
  createdAt: string
}

export interface UserAccount {
  id: string
  email: string
  fullName: string
  phone: string
  avatarUrl?: string
  role: 'customer' | 'admin'
  createdAt: string
  ordersCount: number
  totalSpent: number
}

interface AdminContextType {
  categories: Category[]
  products: Product[]
  orders: Order[]
  payments: Payment[]
  users: UserAccount[]
  isAuthenticated: boolean
  login: (email: string, pass: string) => boolean
  logout: () => void
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void
  addCategory: (name: string) => void
  updateCategory: (id: string, name: string) => void
  deleteCategory: (id: string) => void
  updateOrderStatus: (orderId: string, status: OrderStatus, restockItems?: boolean) => void
  markPaymentSuccessful: (paymentId: string, adminName: string) => void
  updateUserRole: (userId: string, role: 'customer' | 'admin') => void
}

const initialCategories: Category[] = [
  { id: 'cat-1', name: 'Outerwear', slug: 'outerwear', productCount: 4, createdAt: '2026-01-10T10:00:00Z' },
  { id: 'cat-2', name: 'Tops & Shirts', slug: 'tops-shirts', productCount: 5, createdAt: '2026-01-12T10:00:00Z' },
  { id: 'cat-3', name: 'Knitwear', slug: 'knitwear', productCount: 3, createdAt: '2026-01-15T10:00:00Z' },
  { id: 'cat-4', name: 'Trousers & Denim', slug: 'trousers-denim', productCount: 4, createdAt: '2026-01-20T10:00:00Z' },
  { id: 'cat-5', name: 'Accessories', slug: 'accessories', productCount: 2, createdAt: '2026-02-01T10:00:00Z' },
]

const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Minimalist Wool Trench Coat',
    slug: 'minimalist-wool-trench-coat',
    description: 'Tailored wool trench coat crafted from premium Australian merino wool blend with clean lines and classic storm flap.',
    price: 85000,
    compareAtPrice: 95000,
    stock: 12,
    lowStockThreshold: 5,
    categoryId: 'cat-1',
    categoryName: 'Outerwear',
    isActive: true,
    images: [
      { id: 'img-1', url: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80', position: 0, isPrimary: true },
      { id: 'img-2', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80', position: 1, isPrimary: false }
    ],
    createdAt: '2026-02-10T14:30:00Z',
    updatedAt: '2026-09-10T10:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'Oversized Organic Cotton Shirt',
    slug: 'oversized-organic-cotton-shirt',
    description: 'Relaxed fit shirt made from 100% GOTS certified organic cotton poplin.',
    price: 32000,
    compareAtPrice: 38000,
    stock: 3, // Low stock!
    lowStockThreshold: 5,
    categoryId: 'cat-2',
    categoryName: 'Tops & Shirts',
    isActive: true,
    images: [
      { id: 'img-3', url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80', position: 0, isPrimary: true }
    ],
    createdAt: '2026-02-15T11:00:00Z',
    updatedAt: '2026-09-12T09:15:00Z',
  },
  {
    id: 'prod-3',
    name: 'Cashmere Blend Ribbed Cardigan',
    slug: 'cashmere-blend-ribbed-cardigan',
    description: 'Ultra-soft cardigan with horn-effect buttons and deep ribbed cuffs.',
    price: 54000,
    stock: 18,
    lowStockThreshold: 5,
    categoryId: 'cat-3',
    categoryName: 'Knitwear',
    isActive: true,
    images: [
      { id: 'img-4', url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80', position: 0, isPrimary: true }
    ],
    createdAt: '2026-03-01T08:45:00Z',
    updatedAt: '2026-09-15T16:20:00Z',
  },
  {
    id: 'prod-4',
    name: 'Pleated Wide-Leg Trousers',
    slug: 'pleated-wide-leg-trousers',
    description: 'High-waisted tailored trousers featuring double front pleats and fluid drape.',
    price: 42000,
    compareAtPrice: 48000,
    stock: 2, // Low stock!
    lowStockThreshold: 5,
    categoryId: 'cat-4',
    categoryName: 'Trousers & Denim',
    isActive: true,
    images: [
      { id: 'img-5', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80', position: 0, isPrimary: true }
    ],
    createdAt: '2026-03-10T12:00:00Z',
    updatedAt: '2026-09-18T11:00:00Z',
  },
  {
    id: 'prod-5',
    name: 'Structured Leather Tote Bag',
    slug: 'structured-leather-tote-bag',
    description: 'Minimalist tote in full-grain Italian leather with internal zip pouch.',
    price: 65000,
    stock: 8,
    lowStockThreshold: 3,
    categoryId: 'cat-5',
    categoryName: 'Accessories',
    isActive: true,
    images: [
      { id: 'img-6', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80', position: 0, isPrimary: true }
    ],
    createdAt: '2026-04-05T15:10:00Z',
    updatedAt: '2026-09-14T14:30:00Z',
  }
]

const initialOrders: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 1001,
    userId: 'usr-1',
    customerName: 'Aline Nguena',
    customerEmail: 'aline.nguena@gmail.com',
    customerPhone: '+237 671 23 45 67',
    customerAddress: 'Akwa, Douala, Cameroon',
    status: 'paid',
    total: 117000,
    currency: 'XAF',
    notes: 'Please handle leather item with care',
    items: [
      { id: 'item-1', productId: 'prod-1', productName: 'Minimalist Wool Trench Coat', unitPrice: 85000, quantity: 1 },
      { id: 'item-2', productId: 'prod-2', productName: 'Oversized Organic Cotton Shirt', unitPrice: 32000, quantity: 1 }
    ],
    createdAt: '2026-09-19T09:15:00Z',
    updatedAt: '2026-09-19T09:20:00Z',
  },
  {
    id: 'ord-1002',
    orderNumber: 1002,
    userId: 'usr-2',
    customerName: 'Samuel Eto',
    customerEmail: 'samuel.eto@yahoo.fr',
    customerPhone: '+237 699 88 77 66',
    customerAddress: 'Bastos, Yaoundé, Cameroon',
    status: 'pending',
    total: 65000,
    currency: 'XAF',
    items: [
      { id: 'item-3', productId: 'prod-5', productName: 'Structured Leather Tote Bag', unitPrice: 65000, quantity: 1 }
    ],
    createdAt: '2026-09-19T10:45:00Z',
    updatedAt: '2026-09-19T10:45:00Z',
  },
  {
    id: 'ord-1003',
    orderNumber: 1003,
    userId: 'usr-3',
    customerName: 'Marcelle Kamga',
    customerEmail: 'm.kamga@outlook.com',
    customerPhone: '+237 675 11 22 33',
    customerAddress: 'Bonapriso, Douala, Cameroon',
    status: 'completed',
    total: 96000,
    currency: 'XAF',
    items: [
      { id: 'item-4', productId: 'prod-3', productName: 'Cashmere Blend Ribbed Cardigan', unitPrice: 54000, quantity: 1 },
      { id: 'item-5', productId: 'prod-4', productName: 'Pleated Wide-Leg Trousers', unitPrice: 42000, quantity: 1 }
    ],
    createdAt: '2026-09-18T14:20:00Z',
    updatedAt: '2026-09-18T17:00:00Z',
  },
  {
    id: 'ord-1004',
    orderNumber: 1004,
    userId: 'usr-4',
    customerName: 'Brice Fono',
    customerEmail: 'brice.fono@tech.cm',
    customerPhone: '+237 650 44 55 66',
    customerAddress: 'Molyko, Buea, Cameroon',
    status: 'cancelled',
    total: 32000,
    currency: 'XAF',
    items: [
      { id: 'item-6', productId: 'prod-2', productName: 'Oversized Organic Cotton Shirt', unitPrice: 32000, quantity: 1 }
    ],
    createdAt: '2026-09-17T11:00:00Z',
    updatedAt: '2026-09-17T13:30:00Z',
  }
]

const initialPayments: Payment[] = [
  {
    id: 'pay-1',
    orderId: 'ord-1001',
    orderNumber: 1001,
    userId: 'usr-1',
    userName: 'Aline Nguena',
    provider: 'mtn_momo',
    providerReference: 'MTN-20260919-8921',
    amount: 117000,
    currency: 'XAF',
    status: 'successful',
    payerPhone: '+237 671 23 45 67',
    payerName: 'Aline Nguena',
    rawPayload: {
      transaction_id: 'MTN-20260919-8921',
      status: 'SUCCESSFUL',
      financialTransactionId: '984732102',
      externalId: 'ord-1001',
      amount: '117000',
      currency: 'XAF',
      payer: { partyIdType: 'MSISDN', partyId: '237671234567' }
    },
    createdAt: '2026-09-19T09:20:00Z'
  },
  {
    id: 'pay-2',
    orderId: 'ord-1002',
    orderNumber: 1002,
    userId: 'usr-2',
    userName: 'Samuel Eto',
    provider: 'orange_money',
    providerReference: 'OM-20260919-4412',
    amount: 65000,
    currency: 'XAF',
    status: 'pending',
    payerPhone: '+237 699 88 77 66',
    payerName: 'Samuel Eto',
    rawPayload: {
      tx_ref: 'OM-20260919-4412',
      status: 'PENDING',
      order_id: 'ord-1002',
      amount: 65000
    },
    createdAt: '2026-09-19T10:45:00Z'
  },
  {
    id: 'pay-3',
    orderId: 'ord-1003',
    orderNumber: 1003,
    userId: 'usr-3',
    userName: 'Marcelle Kamga',
    provider: 'flutterwave',
    providerReference: 'FLW-TRX-5541209',
    amount: 96000,
    currency: 'XAF',
    status: 'successful',
    payerPhone: '+237 675 11 22 33',
    payerName: 'Marcelle Kamga',
    rawPayload: {
      id: 5541209,
      tx_ref: 'FLW-TRX-5541209',
      flw_ref: 'FLW-MOCK-99128',
      amount: 96000,
      currency: 'XAF',
      status: 'successful',
      customer: { email: 'm.kamga@outlook.com', name: 'Marcelle Kamga' }
    },
    createdAt: '2026-09-18T14:22:00Z'
  },
  {
    id: 'pay-4',
    orderId: 'ord-1004',
    orderNumber: 1004,
    userId: 'usr-4',
    userName: 'Brice Fono',
    provider: 'mtn_momo',
    providerReference: 'MTN-20260917-0041',
    amount: 32000,
    currency: 'XAF',
    status: 'failed',
    payerPhone: '+237 650 44 55 66',
    payerName: 'Brice Fono',
    rawPayload: {
      transaction_id: 'MTN-20260917-0041',
      status: 'FAILED',
      reason: 'INSUFFICIENT_FUNDS'
    },
    createdAt: '2026-09-17T11:05:00Z'
  }
]

const initialUsers: UserAccount[] = [
  {
    id: 'usr-admin',
    email: 'admin@mixtas.com',
    fullName: 'Spencer Store Owner',
    phone: '+237 670 00 00 00',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    role: 'admin',
    createdAt: '2026-01-01T08:00:00Z',
    ordersCount: 0,
    totalSpent: 0
  },
  {
    id: 'usr-1',
    email: 'aline.nguena@gmail.com',
    fullName: 'Aline Nguena',
    phone: '+237 671 23 45 67',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    role: 'customer',
    createdAt: '2026-02-14T10:30:00Z',
    ordersCount: 3,
    totalSpent: 284000
  },
  {
    id: 'usr-2',
    email: 'samuel.eto@yahoo.fr',
    fullName: 'Samuel Eto',
    phone: '+237 699 88 77 66',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    role: 'customer',
    createdAt: '2026-03-01T14:15:00Z',
    ordersCount: 1,
    totalSpent: 65000
  },
  {
    id: 'usr-3',
    email: 'm.kamga@outlook.com',
    fullName: 'Marcelle Kamga',
    phone: '+237 675 11 22 33',
    role: 'customer',
    createdAt: '2026-04-10T16:00:00Z',
    ordersCount: 2,
    totalSpent: 148000
  },
  {
    id: 'usr-4',
    email: 'brice.fono@tech.cm',
    fullName: 'Brice Fono',
    phone: '+237 650 44 55 66',
    role: 'customer',
    createdAt: '2026-05-18T09:20:00Z',
    ordersCount: 1,
    totalSpent: 0
  }
]

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [payments, setPayments] = useState<Payment[]>(initialPayments)
  const [users, setUsers] = useState<UserAccount[]>(initialUsers)

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mixtas_admin_auth') === 'true'
    }
    return false
  })

  // Admin login handler checking configured credentials
  const login = (email: string, pass: string): boolean => {
    const cleanEmail = email.trim().toLowerCase()
    if (cleanEmail === 'mixtas@spencer.gmail.com' && pass === 'spencerbrightest') {
      setIsAuthenticated(true)
      if (typeof window !== 'undefined') {
        localStorage.setItem('mixtas_admin_auth', 'true')
      }
      return true
    }
    return false
  }

  // Admin logout handler
  const logout = () => {
    setIsAuthenticated(false)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mixtas_admin_auth')
    }
  }

  // Product operations
  const addProduct = (newProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `prod-${Date.now()}`
    const now = new Date().toISOString()
    const product: Product = {
      ...newProduct,
      id,
      createdAt: now,
      updatedAt: now,
    }
    setProducts((prev) => [product, ...prev])
    // Update category product count
    setCategories((prev) =>
      prev.map((cat) => (cat.id === newProduct.categoryId ? { ...cat, productCount: cat.productCount + 1 } : cat))
    )
  }

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    const now = new Date().toISOString()
    setProducts((prev) =>
      prev.map((prod) => (prod.id === id ? { ...prod, ...updatedFields, updatedAt: now } : prod))
    )
  }

  const deleteProduct = (id: string) => {
    const targetProduct = products.find((p) => p.id === id)
    setProducts((prev) => prev.filter((prod) => prod.id !== id))
    if (targetProduct) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === targetProduct.categoryId ? { ...cat, productCount: Math.max(0, cat.productCount - 1) } : cat
        )
      )
    }
  }

  // Category operations
  const addCategory = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      slug,
      productCount: 0,
      createdAt: new Date().toISOString(),
    }
    setCategories((prev) => [...prev, newCat])
  }

  const updateCategory = (id: string, name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, name, slug } : cat)))
    setProducts((prev) => prev.map((p) => (p.categoryId === id ? { ...p, categoryName: name } : p)))
  }

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id))
    setProducts((prev) => prev.map((p) => (p.categoryId === id ? { ...p, categoryId: '', categoryName: 'Uncategorized' } : p)))
  }

  // Order operations
  const updateOrderStatus = (orderId: string, status: OrderStatus, restockItems: boolean = false) => {
    const now = new Date().toISOString()
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          // If status is changed to cancelled and user chooses restock
          if (status === 'cancelled' && restockItems) {
            ord.items.forEach((item) => {
              setProducts((pList) =>
                pList.map((p) => (p.id === item.productId ? { ...p, stock: p.stock + item.quantity } : p))
              )
            })
          }
          return { ...ord, status, updatedAt: now }
        }
        return ord
      })
    )
  }

  // Payment operations
  const markPaymentSuccessful = (paymentId: string, adminName: string) => {
    const now = new Date().toISOString()
    setPayments((prev) =>
      prev.map((pay) => {
        if (pay.id === paymentId) {
          // Also update linked order to paid if exists
          if (pay.orderId) {
            updateOrderStatus(pay.orderId, 'paid')
          }
          return {
            ...pay,
            status: 'successful',
            confirmedBy: adminName,
            confirmedAt: now,
          }
        }
        return pay
      })
    )
  }

  // User operations
  const updateUserRole = (userId: string, role: 'customer' | 'admin') => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)))
  }

  return (
    <AdminContext.Provider
      value={{
        categories,
        products,
        orders,
        payments,
        users,
        isAuthenticated,
        login,
        logout,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        updateOrderStatus,
        markPaymentSuccessful,
        updateUserRole,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdminStore() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdminStore must be used within an AdminStoreProvider')
  }
  return context
}
