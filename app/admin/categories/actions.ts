// Server actions for managing product categories via Supabase.

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { categorySchema, type CategoryInput } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

/** Fetches all categories with their product counts. */
export async function getCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*, products(count)')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)

  // Flatten the product count aggregation from Supabase response
  return (data || []).map((cat: any) => ({
    ...cat,
    product_count: cat.products?.[0]?.count ?? 0,
  }))
}

/** Creates a new category. */
export async function createCategory(input: CategoryInput) {
  await requireAdmin()
  const validated = categorySchema.parse(input)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: validated.name, slug: validated.slug })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/categories')
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return data
}

/** Renames an existing category. */
export async function updateCategory(id: string, input: CategoryInput) {
  await requireAdmin()
  const validated = categorySchema.parse(input)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .update({ name: validated.name, slug: validated.slug })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/categories')
  revalidatePath('/admin/products')
  return data
}

/** Deletes a category by ID. Products in the category become uncategorized. */
export async function deleteCategory(id: string) {
  await requireAdmin()

  const supabase = await createClient()

  // Check how many products reference this category
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/categories')
  revalidatePath('/admin/products')
  revalidatePath('/shop')
  return { success: true, productsAffected: count ?? 0 }
}
