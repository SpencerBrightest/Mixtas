// Client hook managing checkout submission locking and idempotency key generation.

'use client'

import { useRef, useState } from 'react'
import { placeOrder, type CheckoutInput } from '@/app/checkout/actions'

export function useCheckout() {
  // One unique key per checkout attempt. Same key on retry = same order.
  const [key, setKey] = useState(() => crypto.randomUUID())
  const [busy, setBusy] = useState(false)
  const lock = useRef(false) // Blocks a second click before React re-renders

  /** Submits the order securely with idempotency key locking. */
  async function submit(data: Omit<CheckoutInput, 'idempotencyKey'>) {
    if (lock.current) return null
    lock.current = true
    setBusy(true)

    try {
      return await placeOrder({ ...data, idempotencyKey: key })
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  /** Generates a new idempotency key on cart or form modifications. */
  function newAttempt() {
    setKey(crypto.randomUUID())
  }

  return { submit, busy, newAttempt, idempotencyKey: key }
}
