// Form component for creating or editing product details in the admin dashboard.

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Product, ProductImage, useAdminStore } from '@/lib/admin-store'
import { ImageUploader } from './image-uploader'
import { ArrowLeft, Save, Check } from 'lucide-react'

interface ProductFormProps {
  initialData?: Product
  isEditing?: boolean
}

/** Renders a form for adding or updating store products. */
export function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
  const router = useRouter()
  const { categories, addProduct, updateProduct } = useAdminStore()

  const [name, setName] = useState(initialData?.name || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [price, setPrice] = useState<number | ''>(initialData?.price ?? 0)
  const [compareAtPrice, setCompareAtPrice] = useState<number | ''>(
    initialData?.compareAtPrice ?? ''
  )
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || categories[0]?.id || '')
  const [stock, setStock] = useState<number | ''>(initialData?.stock ?? 0)
  const [lowStockThreshold, setLowStockThreshold] = useState<number | ''>(
    initialData?.lowStockThreshold ?? 5
  )
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true)
  const [images, setImages] = useState<ProductImage[]>(initialData?.images || [])
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Auto-generate slug when name changes if user hasn't typed a custom slug
  const handleNameChange = (val: string) => {
    setName(val)
    if (!isEditing || !slug) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
      setSlug(generatedSlug)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const selectedCategory = categories.find((c) => c.id === categoryId)

    const payload = {
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      description,
      price: Number(price) || 0,
      compareAtPrice: compareAtPrice !== '' ? Number(compareAtPrice) : undefined,
      stock: Number(stock) || 0,
      lowStockThreshold: Number(lowStockThreshold) || 5,
      categoryId,
      categoryName: selectedCategory ? selectedCategory.name : 'Uncategorized',
      isActive,
      images,
    }

    if (isEditing && initialData) {
      updateProduct(initialData.id, payload)
    } else {
      addProduct(payload)
    }

    setSavedSuccess(true)
    setTimeout(() => {
      router.push('/admin/products')
    }, 800)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between border-b border-[#dedfdd] pb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#727677] hover:text-[#182938]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>

        <button
          type="submit"
          className="inline-flex items-center gap-2 bg-[#182938] hover:bg-[#5d85a0] text-white text-xs uppercase tracking-wider px-5 py-2.5 rounded font-medium transition-colors shadow-xs"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" /> Saved Successfully!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> {isEditing ? 'Update Product' : 'Create Product'}
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-[#dedfdd] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-normal text-[#182938] border-b border-[#dedfdd] pb-3">
              General Information
            </h3>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#182938] font-semibold mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Minimalist Wool Trench Coat"
                className="w-full bg-[#f4f3f0] text-xs text-[#182938] p-3 rounded border border-[#dedfdd] focus:border-[#5d85a0] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#182938] font-semibold mb-1">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="minimalist-wool-trench-coat"
                className="w-full bg-[#f4f3f0] text-xs text-[#182938] p-3 rounded border border-[#dedfdd] focus:border-[#5d85a0] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#182938] font-semibold mb-1">
                Description
              </label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a clear, compelling product description..."
                className="w-full bg-[#f4f3f0] text-xs text-[#182938] p-3 rounded border border-[#dedfdd] focus:border-[#5d85a0] outline-none"
              />
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="bg-white p-6 rounded-lg border border-[#dedfdd] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-normal text-[#182938] border-b border-[#dedfdd] pb-3">
              Pricing & Inventory (XAF)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#182938] font-semibold mb-1">
                  Price (XAF) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="85000"
                  className="w-full bg-[#f4f3f0] text-xs text-[#182938] p-3 rounded border border-[#dedfdd] focus:border-[#5d85a0] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#182938] font-semibold mb-1">
                  Compare-at Price (XAF)
                </label>
                <input
                  type="number"
                  min="0"
                  value={compareAtPrice}
                  onChange={(e) =>
                    setCompareAtPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="95000"
                  className="w-full bg-[#f4f3f0] text-xs text-[#182938] p-3 rounded border border-[#dedfdd] focus:border-[#5d85a0] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#182938] font-semibold mb-1">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#f4f3f0] text-xs text-[#182938] p-3 rounded border border-[#dedfdd] focus:border-[#5d85a0] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#182938] font-semibold mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) =>
                    setLowStockThreshold(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full bg-[#f4f3f0] text-xs text-[#182938] p-3 rounded border border-[#dedfdd] focus:border-[#5d85a0] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Product Media */}
          <div className="bg-white p-6 rounded-lg border border-[#dedfdd] shadow-xs">
            <ImageUploader images={images} onChange={setImages} />
          </div>
        </div>

        {/* Sidebar Configuration Panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-[#dedfdd] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-normal text-[#182938] border-b border-[#dedfdd] pb-3">
              Organization & Visibility
            </h3>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#182938] font-semibold mb-1">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-[#f4f3f0] text-xs text-[#182938] p-3 rounded border border-[#dedfdd] focus:border-[#5d85a0] outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-[#dedfdd] flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#182938] font-semibold">
                  Storefront Status
                </p>
                <p className="text-[11px] text-[#727677]">Make this product visible in catalog</p>
              </div>

              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                  isActive ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
