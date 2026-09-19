// Order detail view displaying item breakdown, customer info, status dropdown, and restocking prompt.

'use client'

import React, { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminStore, OrderStatus } from '@/lib/admin-store'
import { formatPrice, formatDateTime } from '@/lib/format'
import { StatusBadge } from '@/components/admin/status-badge'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { ArrowLeft, User, Phone, MapPin, CreditCard, ShoppingBag, RefreshCw } from 'lucide-react'

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

/** Renders detailed order information and status management. */
export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { orders, payments, updateOrderStatus } = useAdminStore()

  const order = orders.find((o) => o.id === resolvedParams.id)
  const linkedPayment = payments.find((p) => p.orderId === resolvedParams.id)

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order?.status || 'pending')
  const [restockDialogOpen, setRestockDialogOpen] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<OrderStatus | null>(null)

  if (!order) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="font-serif text-2xl text-[#182938]">Order Not Found</h2>
        <p className="text-xs text-[#727677]">The order record could not be found.</p>
        <button
          onClick={() => router.push('/admin/orders')}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider bg-[#182938] text-white px-4 py-2 rounded"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders List
        </button>
      </div>
    )
  }

  const handleStatusSelect = (newStatus: OrderStatus) => {
    setSelectedStatus(newStatus)
    if (newStatus === 'cancelled') {
      setPendingStatusChange(newStatus)
      setRestockDialogOpen(true)
    } else {
      updateOrderStatus(order.id, newStatus, false)
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dedfdd] pb-4">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#727677] hover:text-[#182938] mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-normal tracking-tight text-[#182938]">
              Order #{order.orderNumber}
            </h1>
            <StatusBadge type="order" status={order.status} />
          </div>
          <p className="text-xs text-[#727677] mt-1">Placed on {formatDateTime(order.createdAt)}</p>
        </div>

        {/* Status Dropdown Control */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-[#dedfdd]">
          <span className="text-xs uppercase tracking-wider font-semibold text-[#182938]">
            Order Status:
          </span>
          <select
            value={selectedStatus}
            onChange={(e) => handleStatusSelect(e.target.value as OrderStatus)}
            className="bg-[#f4f3f0] text-xs font-medium text-[#182938] px-3 py-1.5 rounded border border-[#dedfdd] focus:border-[#5d85a0] outline-none"
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Items Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-[#dedfdd] p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-normal text-[#182938] border-b border-[#dedfdd] pb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#5d85a0]" /> Order Items
            </h3>

            <div className="divide-y divide-[#dedfdd]">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 bg-[#f4f3f0] rounded border border-[#dedfdd] flex items-center justify-center text-xs font-serif font-bold text-[#5d85a0]">
                      {item.quantity}x
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#182938]">{item.productName}</p>
                      <p className="text-[10px] text-[#727677]">
                        Unit Price: {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-sm font-medium text-[#182938]">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="pt-4 border-t border-[#dedfdd] space-y-2 text-xs">
              <div className="flex justify-between text-[#727677]">
                <span>Subtotal</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between text-[#727677]">
                <span>Shipping / Logistics</span>
                <span>Standard Delivery (Free)</span>
              </div>
              <div className="flex justify-between font-serif text-base font-normal text-[#182938] pt-2 border-t border-[#dedfdd]">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Linked Payment Section */}
          <div className="bg-white rounded-lg border border-[#dedfdd] p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-normal text-[#182938] border-b border-[#dedfdd] pb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#5d85a0]" /> Payment Transaction
            </h3>

            {linkedPayment ? (
              <div className="flex items-center justify-between p-3 bg-[#f4f3f0]/50 rounded border border-[#dedfdd] text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#182938]">
                      {linkedPayment.providerReference}
                    </span>
                    <StatusBadge type="payment" status={linkedPayment.status} />
                  </div>
                  <p className="text-[10px] text-[#727677] mt-1">
                    Provider: {linkedPayment.provider.replace('_', ' ').toUpperCase()} &bull; Payer:{' '}
                    {linkedPayment.payerPhone}
                  </p>
                </div>

                <Link
                  href={`/admin/payments/${linkedPayment.id}`}
                  className="text-xs uppercase tracking-wider text-[#5d85a0] hover:underline font-semibold"
                >
                  View Transfer &rarr;
                </Link>
              </div>
            ) : (
              <p className="text-xs text-[#727677]">No explicit payment transfer linked to this order yet.</p>
            )}
          </div>
        </div>

        {/* Customer Information Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-[#dedfdd] p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-normal text-[#182938] border-b border-[#dedfdd] pb-3">
              Customer Profile
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-[#5d85a0] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#182938]">{order.customerName}</p>
                  <p className="text-[10px] text-[#727677]">{order.customerEmail}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#5d85a0] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#182938]">{order.customerPhone}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#5d85a0] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-[#182938]">Delivery Address</p>
                  <p className="text-[#727677] mt-0.5">{order.customerAddress}</p>
                </div>
              </div>

              {order.notes && (
                <div className="pt-3 border-t border-[#dedfdd]">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-[#727677]">
                    Order Notes
                  </p>
                  <p className="text-xs text-[#182938] mt-1 bg-[#f4f3f0] p-2.5 rounded border border-[#dedfdd]">
                    {order.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Restock Confirmation Modal when status changed to Cancelled */}
      <ConfirmDialog
        isOpen={restockDialogOpen}
        title="Restock Items to Product Inventory?"
        description="This order has been set to Cancelled. Would you like to restock the ordered item quantities back into product inventory?"
        confirmText="Restock Items & Cancel"
        cancelText="Cancel Order Without Restock"
        variant="warning"
        onConfirm={() => {
          if (pendingStatusChange) {
            updateOrderStatus(order.id, pendingStatusChange, true)
            setPendingStatusChange(null)
          }
        }}
        onClose={() => {
          if (pendingStatusChange) {
            updateOrderStatus(order.id, pendingStatusChange, false)
            setPendingStatusChange(null)
          }
        }}
      />
    </div>
  )
}
