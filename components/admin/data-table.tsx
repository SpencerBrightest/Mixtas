// Generic reusable Data Table component with integrated search, custom filters, pagination, and empty states.

'use client'

import React, { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'

export interface Column<T> {
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  searchKey?: keyof T | ((row: T) => string)
  filters?: {
    key: string
    label: string
    options: { label: string; value: string }[]
    value: string
    onChange: (val: string) => void
  }[]
  actionButton?: React.ReactNode
  pageSize?: number
  emptyTitle?: string
  emptyMessage?: string
}

/** Renders a styled data table matching the site layout. */
export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  searchKey,
  filters = [],
  actionButton,
  pageSize = 10,
  emptyTitle = 'No items found',
  emptyMessage = 'There are no items matching your criteria.',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter logic based on search term and active dropdown filters
  const filteredData = data.filter((row) => {
    if (searchTerm && searchKey) {
      const value =
        typeof searchKey === 'function' ? searchKey(row) : String(row[searchKey] || '')
      if (!value.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
    }
    return true
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize)

  return (
    <div className="bg-white rounded-lg border border-[#dedfdd] overflow-hidden shadow-xs">
      {/* Header controls: Search, Custom filters, and primary action button */}
      <div className="p-4 border-b border-[#dedfdd] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#f4f3f0]/40">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {searchKey && (
            <div className="relative min-w-[240px] max-w-xs flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#727677]" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full bg-white text-xs text-[#182938] placeholder-[#727677] pl-9 pr-3 py-2 rounded border border-[#dedfdd] focus:border-[#5d85a0] outline-none"
              />
            </div>
          )}

          {filters.map((filter) => (
            <select
              key={filter.key}
              value={filter.value}
              onChange={(e) => {
                filter.onChange(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-white text-xs text-[#182938] px-3 py-2 rounded border border-[#dedfdd] focus:border-[#5d85a0] outline-none"
            >
              <option value="all">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>

        {actionButton && <div>{actionButton}</div>}
      </div>

      {/* Table grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#182938]">
          <thead className="bg-[#f4f3f0] border-b border-[#dedfdd] uppercase tracking-wider text-[10px] text-[#727677] font-semibold">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dedfdd]">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-[#f4f3f0]/30 transition-colors">
                  {columns.map((col, idx) => (
                    <td key={idx} className={`px-4 py-3.5 align-middle ${col.className || ''}`}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? '')
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-[#727677]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="w-8 h-8 text-[#5d85a0]/50" />
                    <p className="font-semibold text-[#182938]">{emptyTitle}</p>
                    <p className="text-xs max-w-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer pagination */}
      {filteredData.length > 0 && (
        <div className="px-4 py-3 border-t border-[#dedfdd] flex items-center justify-between text-xs text-[#727677] bg-[#f4f3f0]/20">
          <div>
            Showing <span className="font-medium text-[#182938]">{startIndex + 1}</span> to{' '}
            <span className="font-medium text-[#182938]">
              {Math.min(startIndex + pageSize, filteredData.length)}
            </span>{' '}
            of <span className="font-medium text-[#182938]">{filteredData.length}</span> results
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-[#dedfdd] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f4f3f0]"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-[#dedfdd] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f4f3f0]"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
