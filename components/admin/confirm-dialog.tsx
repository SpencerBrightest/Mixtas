// Reusable confirmation modal dialog for administrative actions.

'use client'

import React from 'react'
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'success'
  onConfirm: () => void
  onClose: () => void
}

/** Renders a styled modal dialog for user confirmation. */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  let Icon = AlertTriangle
  let confirmBtnStyle = 'bg-amber-600 hover:bg-amber-700 text-white'
  let iconBg = 'bg-amber-100 text-amber-700'

  if (variant === 'danger') {
    confirmBtnStyle = 'bg-rose-600 hover:bg-rose-700 text-white'
    iconBg = 'bg-rose-100 text-rose-700'
  } else if (variant === 'success') {
    Icon = CheckCircle2
    confirmBtnStyle = 'bg-emerald-600 hover:bg-emerald-700 text-white'
    iconBg = 'bg-emerald-100 text-emerald-700'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg max-w-md w-full p-6 border border-[#dedfdd] shadow-xl z-10">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full flex-shrink-0 ${iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="font-serif text-lg font-normal text-[#182938] mb-1">{title}</h3>
            <p className="text-xs text-[#727677] leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#dedfdd]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs uppercase tracking-wider text-[#727677] hover:text-[#182938] hover:bg-[#f4f3f0] rounded border border-[#dedfdd] transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`px-4 py-2 text-xs uppercase tracking-wider rounded font-medium shadow-xs transition-colors ${confirmBtnStyle}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
