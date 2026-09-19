// Zod validation schemas for all admin forms and server action inputs.

import { z } from 'zod'

// ============ PRODUCT SCHEMAS ============

export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120, 'Name too long'),
  slug: z
    .string()
    .min(2, 'Slug required')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(5000, 'Description too long').optional().default(''),
  price: z.number().int().min(0, 'Price must be a positive integer'),
  compare_at_price: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  low_stock_threshold: z.number().int().min(0).default(5),
  category_id: z.string().uuid('Invalid category').optional().nullable(),
  is_active: z.boolean().default(true),
})

export type ProductInput = z.infer<typeof productSchema>

// ============ CATEGORY SCHEMAS ============

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
})

export type CategoryInput = z.infer<typeof categorySchema>

// ============ ORDER STATUS SCHEMA ============

export const orderStatusSchema = z.object({
  order_id: z.string().uuid('Invalid order ID'),
  status: z.enum(['pending', 'paid', 'processing', 'completed', 'cancelled', 'refunded']),
  restock_items: z.boolean().default(false),
})

export type OrderStatusInput = z.infer<typeof orderStatusSchema>

// ============ PAYMENT MANUAL CONFIRM SCHEMA ============

export const paymentConfirmSchema = z.object({
  payment_id: z.string().uuid('Invalid payment ID'),
})

export type PaymentConfirmInput = z.infer<typeof paymentConfirmSchema>

// ============ USER ROLE SCHEMA ============

export const userRoleSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  role: z.enum(['customer', 'admin']),
})

export type UserRoleInput = z.infer<typeof userRoleSchema>

// ============ IMAGE UPLOAD VALIDATION ============

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

export const imageFileSchema = z.object({
  name: z.string(),
  size: z.number().max(MAX_IMAGE_SIZE, 'Image must be under 5 MB'),
  type: z.string().refine((t) => ACCEPTED_IMAGE_TYPES.includes(t), {
    message: 'Only JPEG, PNG, and WebP images are accepted',
  }),
})

export type ImageFileInput = z.infer<typeof imageFileSchema>
