// Server actions for CRUD operations on products and product images via Supabase.

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { productSchema, type ProductInput } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

/** Fetches all products with their primary image and category name. */
export async function getProducts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (name),
      product_images (id, url, storage_path, position, is_primary)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

/** Fetches a single product by ID with all images. */
export async function getProductById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (id, name),
      product_images (id, url, storage_path, position, is_primary)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Creates a new product after admin validation. */
export async function createProduct(input: ProductInput) {
  await requireAdmin()
  const validated = productSchema.parse(input)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: validated.name,
      slug: validated.slug,
      description: validated.description,
      price: validated.price,
      compare_at_price: validated.compare_at_price ?? null,
      stock: validated.stock,
      low_stock_threshold: validated.low_stock_threshold,
      category_id: validated.category_id ?? null,
      is_active: validated.is_active,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return data
}

/** Updates an existing product by ID. */
export async function updateProduct(id: string, input: Partial<ProductInput>) {
  await requireAdmin()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${id}`)
  revalidatePath('/shop')
  return data
}

/** Deletes a product and removes all associated images from Supabase Storage. */
export async function deleteProduct(id: string) {
  await requireAdmin()

  const supabase = await createClient()

  // Fetch associated image storage paths before deleting the product row
  const { data: images } = await supabase
    .from('product_images')
    .select('storage_path')
    .eq('product_id', id)

  if (images && images.length > 0) {
    const paths = images.map((img) => img.storage_path)
    await supabase.storage.from('product-images').remove(paths)
  }

  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return { success: true }
}

/** Toggles a product's active/inactive visibility on the storefront. */
export async function toggleProductActive(id: string, isActive: boolean) {
  await requireAdmin()

  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return { success: true }
}

/** Uploads a product image to Supabase Storage and records it in the database. */
export async function uploadProductImage(
  productId: string,
  formData: FormData
) {
  await requireAdmin()

  const file = formData.get('file') as File
  if (!file) throw new Error('No file provided')

  // Validate file type and size constraints
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!acceptedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WebP images are accepted')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be under 5 MB')
  }

  const supabase = await createClient()
  const ext = file.name.split('.').pop() || 'jpg'
  const storagePath = `products/${productId}/${crypto.randomUUID()}.${ext}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) throw new Error(uploadError.message)

  // Generate public URL
  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(storagePath)

  // Check if this is the first image to set it as primary
  const { count } = await supabase
    .from('product_images')
    .select('*', { count: 'exact', head: true })
    .eq('product_id', productId)

  const isPrimary = (count ?? 0) === 0

  // Insert database record
  const { data, error: dbError } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      url: urlData.publicUrl,
      storage_path: storagePath,
      position: count ?? 0,
      is_primary: isPrimary,
    })
    .select()
    .single()

  if (dbError) throw new Error(dbError.message)
  revalidatePath(`/admin/products/${productId}`)
  return data
}

/** Deletes a product image from both Storage and the database. */
export async function deleteProductImage(imageId: string, productId: string) {
  await requireAdmin()

  const supabase = await createClient()

  const { data: image } = await supabase
    .from('product_images')
    .select('storage_path, is_primary')
    .eq('id', imageId)
    .single()

  if (image) {
    await supabase.storage.from('product-images').remove([image.storage_path])
  }

  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)

  if (error) throw new Error(error.message)

  // If deleted image was primary, promote the first remaining image
  if (image?.is_primary) {
    const { data: remaining } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .order('position', { ascending: true })
      .limit(1)

    if (remaining && remaining.length > 0) {
      await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', remaining[0].id)
    }
  }

  revalidatePath(`/admin/products/${productId}`)
  return { success: true }
}

/** Sets a specific image as the primary thumbnail for a product. */
export async function setPrimaryImage(imageId: string, productId: string) {
  await requireAdmin()

  const supabase = await createClient()

  // Reset all images for this product to non-primary
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId)

  // Set selected image as primary
  const { error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/products/${productId}`)
  return { success: true }
}
