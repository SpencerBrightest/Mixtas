// Product management list page for viewing, searching, filtering, and deleting products.

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAdminStore, Product } from '@/lib/admin-store'
import { formatPrice } from '@/lib/format'
import { DataTable, Column } from '@/components/admin/data-table'
import { StatusBadge } from '@/components/admin/status-badge'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react'

/** Renders the administrative product catalog table. */
export default function AdminProductsPage() {
  const { products, categories, updateProduct, deleteProduct } = useAdminStore()

  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')

  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  // Filter products by selected dropdown values
  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'all' && p.categoryId !== categoryFilter) return false
    if (activeFilter !== 'all') {
      const isActive = activeFilter === 'true'
      if (p.isActive !== isActive) return false
    }
    return true
  })

  const columns: Column<Product>[] = [
    {
      header: 'Product',
      cell: (row) => {
        const primaryImage = row.images.find((img) => img.isPrimary) || row.images[0]
        return (
          <div className="flex items-center gap-3">
            <div className="w-12 h-14 bg-[#f4f3f0] rounded border border-[#dedfdd] overflow-hidden flex-shrink-0">
              {primaryImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={primaryImage.url}
                  alt={row.name}
                  className="w-full h-full object-cover mix-blend-multiply"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#727677]">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}
            </div>
            <div>
              <Link
                href={`/admin/products/${row.id}`}
                className="font-medium text-[#182938] hover:text-[#5d85a0] line-clamp-1"
              >
                {row.name}
              </Link>
              <span className="text-[10px] font-mono text-[#727677]">{row.slug}</span>
            </div>
          </div>
        )
      },
    },
    {
      header: 'Category',
      accessorKey: 'categoryName',
      cell: (row) => (
        <span className="text-xs text-[#727677] px-2 py-1 bg-[#f4f3f0] rounded">
          {row.categoryName}
        </span>
      ),
    },
    {
      header: 'Price',
      cell: (row) => (
        <div>
          <span className="font-medium font-serif text-[#182938]">
            {formatPrice(row.price)}
          </span>
          {row.compareAtPrice && (
            <span className="block text-[10px] text-[#727677] line-through">
              {formatPrice(row.compareAtPrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Stock',
      cell: (row) => {
        const isLow = row.stock <= row.lowStockThreshold
        return (
          <div>
            <span
              className={`font-semibold ${
                row.stock === 0
                  ? 'text-rose-600'
                  : isLow
                  ? 'text-amber-600'
                  : 'text-emerald-700'
              }`}
            >
              {row.stock} units
            </span>
            {isLow && row.stock > 0 && (
              <span className="block text-[9px] uppercase tracking-wider text-amber-600 font-bold">
                Low Stock
              </span>
            )}
          </div>
        )
      },
    },
    {
      header: 'Status',
      cell: (row) => (
        <button
          onClick={() => updateProduct(row.id, { isActive: !row.isActive })}
          className="focus:outline-none"
          title="Click to toggle storefront visibility"
        >
          <StatusBadge type="active" status={String(row.isActive)} />
        </button>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/products/${row.id}`}
            className="p-1.5 text-[#727677] hover:text-[#182938] hover:bg-[#f4f3f0] rounded transition-colors"
            title="Edit product"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setProductToDelete(row)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
            title="Delete product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-normal tracking-tight text-[#182938]">
            Product Catalog
          </h1>
          <p className="text-xs text-[#727677] mt-1">
            Manage product listings, inventory stock levels, and store visibility.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 bg-[#182938] hover:bg-[#5d85a0] text-white text-xs uppercase tracking-wider px-4 py-2.5 rounded font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </Link>
      </div>

      {/* Main Data Table */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        searchPlaceholder="Search product by name..."
        searchKey="name"
        pageSize={20}
        filters={[
          {
            key: 'category',
            label: 'All Categories',
            options: categories.map((c) => ({ label: c.name, value: c.id })),
            value: categoryFilter,
            onChange: setCategoryFilter,
          },
          {
            key: 'status',
            label: 'All Statuses',
            options: [
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ],
            value: activeFilter,
            onChange: setActiveFilter,
          },
        ]}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!productToDelete}
        title="Delete Product?"
        description={`Are you sure you want to delete "${productToDelete?.name}"? This action will permanently remove the product listing and all associated media from storage.`}
        confirmText="Delete Product"
        variant="danger"
        onConfirm={() => {
          if (productToDelete) {
            deleteProduct(productToDelete.id)
            setProductToDelete(null)
          }
        }}
        onClose={() => setProductToDelete(null)}
      />
    </div>
  )
}
