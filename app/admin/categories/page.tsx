// Categories management page featuring add/rename/delete dialogs and product count association.

'use client'

import React, { useState } from 'react'
import { useAdminStore, Category } from '@/lib/admin-store'
import { formatDate } from '@/lib/format'
import { DataTable, Column } from '@/components/admin/data-table'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Plus, Edit, Trash2, FolderTree, X, Check } from 'lucide-react'

/** Renders the category management interface. */
export default function AdminCategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useAdminStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryNameInput, setCategoryNameInput] = useState('')

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  const openAddModal = () => {
    setEditingCategory(null)
    setCategoryNameInput('')
    setModalOpen(true)
  }

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat)
    setCategoryNameInput(cat.name)
    setModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryNameInput.trim()) return

    if (editingCategory) {
      updateCategory(editingCategory.id, categoryNameInput.trim())
    } else {
      addCategory(categoryNameInput.trim())
    }

    setModalOpen(false)
  }

  const columns: Column<Category>[] = [
    {
      header: 'Category Name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#f4f3f0] text-[#5d85a0] rounded">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-[#182938]">{row.name}</p>
            <p className="text-[10px] text-[#727677] font-mono">{row.slug}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Products Count',
      cell: (row) => (
        <span className="font-semibold px-2.5 py-1 bg-[#f4f3f0] text-[#182938] rounded-full text-xs">
          {row.productCount} items
        </span>
      ),
    },
    {
      header: 'Created Date',
      cell: (row) => <span className="text-[#727677] text-xs">{formatDate(row.createdAt)}</span>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="p-1.5 text-[#727677] hover:text-[#182938] hover:bg-[#f4f3f0] rounded transition-colors"
            title="Edit category"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCategoryToDelete(row)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
            title="Delete category"
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
            Product Categories
          </h1>
          <p className="text-xs text-[#727677] mt-1">
            Organize products into store categories for easier navigation.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 bg-[#182938] hover:bg-[#5d85a0] text-white text-xs uppercase tracking-wider px-4 py-2.5 rounded font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Create Category
        </button>
      </div>

      {/* Main Categories Table */}
      <DataTable
        data={categories}
        columns={columns}
        searchPlaceholder="Search categories..."
        searchKey="name"
      />

      {/* Add / Edit Category Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setModalOpen(false)}
          />
          <form
            onSubmit={handleSave}
            className="relative bg-white rounded-lg max-w-md w-full p-6 border border-[#dedfdd] shadow-xl z-10 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#dedfdd] pb-3">
              <h3 className="font-serif text-lg text-[#182938]">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[#727677] hover:text-[#182938]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#182938] font-semibold mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={categoryNameInput}
                onChange={(e) => setCategoryNameInput(e.target.value)}
                placeholder="e.g. Knitwear, Denim, Outerwear..."
                className="w-full bg-[#f4f3f0] text-xs text-[#182938] p-3 rounded border border-[#dedfdd] focus:border-[#5d85a0] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#dedfdd]">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs uppercase tracking-wider text-[#727677] hover:bg-[#f4f3f0] rounded border border-[#dedfdd]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs uppercase tracking-wider bg-[#182938] hover:bg-[#5d85a0] text-white rounded font-medium flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Save Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!categoryToDelete}
        title="Delete Category?"
        description={
          categoryToDelete && categoryToDelete.productCount > 0
            ? `Warning: "${categoryToDelete.name}" currently contains ${categoryToDelete.productCount} product(s). Deleting it will mark those products as Uncategorized.`
            : `Are you sure you want to delete "${categoryToDelete?.name}"?`
        }
        confirmText="Delete Category"
        variant="danger"
        onConfirm={() => {
          if (categoryToDelete) {
            deleteCategory(categoryToDelete.id)
            setCategoryToDelete(null)
          }
        }}
        onClose={() => setCategoryToDelete(null)}
      />
    </div>
  )
}
