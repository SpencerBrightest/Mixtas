// Multi-image uploader component with preview, primary choice, and reordering options.

'use client'

import React, { useState } from 'react'
import { Upload, Star, Trash2, ArrowLeft, ArrowRight, Image as ImageIcon } from 'lucide-react'
import { ProductImage } from '@/lib/admin-store'

interface ImageUploaderProps {
  images: ProductImage[]
  onChange: (images: ProductImage[]) => void
}

/** Renders an interactive image upload manager. */
export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false)

  // Add mock local image preview files
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newImages: ProductImage[] = Array.from(files).map((file, idx) => ({
      id: `img-temp-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      position: images.length + idx,
      isPrimary: images.length === 0 && idx === 0,
    }))

    onChange([...images, ...newImages])
  }

  // Set selected image as primary cover image
  const setPrimary = (id: string) => {
    onChange(
      images.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    )
  }

  // Remove image item
  const removeImage = (id: string) => {
    const filtered = images.filter((img) => img.id !== id)
    // If we removed the primary image, make the first remaining image primary
    if (images.find((img) => img.id === id)?.isPrimary && filtered.length > 0) {
      filtered[0].isPrimary = true
    }
    onChange(filtered)
  }

  // Reorder items left or right
  const moveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= images.length) return

    const updated = [...images]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp

    // Update positions
    updated.forEach((img, i) => {
      img.position = i
    })

    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <label className="block text-xs uppercase tracking-wider text-[#182938] font-semibold">
        Product Images
      </label>

      {/* Drag & drop upload area */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-[#5d85a0] bg-[#5d85a0]/5'
            : 'border-[#dedfdd] bg-[#f4f3f0]/40 hover:bg-[#f4f3f0]'
        }`}
      >
        <Upload className="w-8 h-8 mx-auto text-[#5d85a0] mb-2" />
        <p className="text-xs text-[#182938] font-medium">
          Drag & drop product images here, or{' '}
          <label className="text-[#5d85a0] underline cursor-pointer font-semibold">
            browse
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </p>
        <p className="text-[10px] text-[#727677] mt-1">
          Supports JPG, PNG, WEBP (Max 5 MB each)
        </p>
      </div>

      {/* Image list previews */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={`relative rounded-lg overflow-hidden border bg-[#f4f3f0] group ${
                img.isPrimary ? 'ring-2 ring-[#5d85a0] border-transparent' : 'border-[#dedfdd]'
              }`}
            >
              <div className="aspect-square relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`Product view ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Primary badge */}
              {img.isPrimary && (
                <span className="absolute top-2 left-2 bg-[#5d85a0] text-white text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold flex items-center gap-1 shadow-xs">
                  <Star className="w-3 h-3 fill-current" /> Primary
                </span>
              )}

              {/* Quick actions overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(img.id)}
                    className="p-1.5 bg-white text-[#182938] rounded hover:bg-amber-400 text-xs"
                    title="Set as primary thumbnail"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}

                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(idx, 'left')}
                    className="p-1.5 bg-white text-[#182938] rounded hover:bg-gray-200"
                    title="Move left"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                )}

                {idx < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(idx, 'right')}
                    className="p-1.5 bg-white text-[#182938] rounded hover:bg-gray-200"
                    title="Move right"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="p-1.5 bg-rose-600 text-white rounded hover:bg-rose-700"
                  title="Remove image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-[#727677]">
          <ImageIcon className="w-4 h-4" />
          <span>No images uploaded yet. Primary image will be chosen automatically.</span>
        </div>
      )}
    </div>
  )
}
