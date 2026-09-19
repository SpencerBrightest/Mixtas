// Page for creating a new product in the store catalog.

'use client'

import React from 'react'
import { ProductForm } from '@/components/admin/product-form'

/** Renders the new product creation view. */
export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-[#182938]">
          Add New Product
        </h1>
        <p className="text-xs text-[#727677] mt-1">
          Create a new clothing item or accessory for your storefront.
        </p>
      </div>

      <ProductForm />
    </div>
  )
}
