// Server-side integration with NotchPay API for Mobile Money and card transaction processing.

import 'server-only'

interface NotchPayInitInput {
  amount: number
  currency?: string
  email: string
  name: string
  phone?: string
  reference: string
  callbackUrl?: string
  description?: string
}

export interface NotchPayInitResult {
  success: boolean
  transactionReference?: string
  authorizationUrl?: string
  error?: string
}

/** Initializes a payment transaction with the NotchPay REST API. */
export async function initializeNotchPayPayment(
  input: NotchPayInitInput
): Promise<NotchPayInitResult> {
  // NotchPay authenticates payment init with the PUBLIC key (pk_) in Authorization.
  const apiKey = (process.env.NOTCHPAY_PUBLIC_KEY || '').trim()

  if (!apiKey || apiKey.startsWith('your_') || apiKey.includes('xxxxxxxx')) {
    console.warn('NotchPay API key not configured in .env.')
    return {
      success: false,
      error: 'Payment gateway is not configured. Set NOTCHPAY_PUBLIC_KEY.',
    }
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const callbackUrl = input.callbackUrl || `${siteUrl}/checkout`

    const response = await fetch('https://api.notchpay.co/payments/initialize', {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency || 'XAF',
        email: input.email,
        name: input.name,
        phone: input.phone || undefined,
        reference: input.reference,
        callback: callbackUrl,
        description: input.description || `Payment for order ${input.reference}`,
      }),
    })

    const data = await response.json()

    if (response.ok && (data.status === 'accepted' || data.code === 201 || data.transaction)) {
      return {
        success: true,
        transactionReference: data.transaction?.reference || data.reference || input.reference,
        authorizationUrl: data.authorization_url,
      }
    }

    console.error('NotchPay init error response:', data)
    return {
      success: false,
      error: data.message || 'Failed to initialize NotchPay payment transaction',
    }
  } catch (err: any) {
    console.error('NotchPay exception:', err)
    return {
      success: false,
      error: err.message || 'Exception communicating with NotchPay API',
    }
  }
}
