// Plural route alias forwarding /products/[id] to the primary product detail view.

import { redirect } from 'next/navigation'

export default async function ProductsAlias({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/product/${id}`)
}
