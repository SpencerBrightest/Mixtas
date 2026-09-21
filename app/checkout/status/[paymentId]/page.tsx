// Renders customer payment status landing page after redirection from payment provider hosted page.

import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { PaymentStatusPoller } from './poller'

export const metadata = { robots: { index: false, follow: false } }

/** Server component rendering status container for payment confirmation. */
export default async function PaymentStatusPage({
  params,
}: {
  params: Promise<{ paymentId: string }>
}) {
  const { paymentId } = await params
  const { supabase, user } = await requireUser()

  // Row Level Security limits query to the user's own payments
  const { data: payment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('id', paymentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!payment) notFound()

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <PaymentStatusPoller paymentId={payment.id} initialStatus={payment.status} />
    </main>
  )
}
