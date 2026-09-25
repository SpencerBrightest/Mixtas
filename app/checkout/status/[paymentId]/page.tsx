// Renders customer payment status landing page after redirection from payment provider hosted page.

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { PaymentStatusPoller } from './poller'

export const metadata = { robots: { index: false, follow: false } }

/** Server component rendering status container for payment confirmation. */
export default async function PaymentStatusPage({
  params,
}: {
  params: Promise<{ paymentId: string }>
}) {
  const { paymentId } = await params
  const admin = createAdminClient()

  const { data: payment } = await admin
    .from('payments')
    .select('id, status')
    .eq('id', paymentId)
    .maybeSingle()

  if (!payment) notFound()

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <PaymentStatusPoller paymentId={payment.id} initialStatus={payment.status} />
    </main>
  )
}
