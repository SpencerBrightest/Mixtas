// Page for editing an existing product.

'use client'

import React, { use } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminStore } from '@/lib/admin-store'
import { ProductForm } from '@/components/admin/product-form'
import { ArrowLeft } from 'lucide-react'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

/** Renders the product editing form. */
export default function EditProductPage({ params }: EditProductPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { products } = useAdminStore()

  const product = products.find((p) => p.id === resolvedParams.id)

  if (!product) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="font-serif text-2xl text-[#182938]">Product Not Found</h2>
        <p className="text-xs text-[#727677]">
          The product you are attempting to edit does not exist or was deleted.
        </p>
        <button
          onClick={() => router.push('/admin/products')}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-[#182938] text-white px-4 py-2 rounded"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Products
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-[#182938]">
          Edit Product: {product.name}
        </h1>
        <p className="text-xs text-[#727677] mt-1">
          Update prices, description, stock levels, or images.
        </p>
      </div>

      <ProductForm initialData={product} isEditing />
    </div>
  )
}
