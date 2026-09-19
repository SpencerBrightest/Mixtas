// Utility functions for currency, date, and text formatting across the application.

/** Formats an integer amount as XAF currency string with space grouping. */
export function formatPrice(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 XAF'
  }
  // Group thousands with space according to local XAF formatting standard
  const formatted = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${formatted} XAF`
}

/** Formats an ISO date string into a readable date format. */
export function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/** Formats an ISO date string with time included. */
export function formatDateTime(dateString: string): string {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/** Shortens a reference string or ID for cleaner display in tables. */
export function truncateId(id: string, length: number = 8): string {
  if (!id) return ''
  if (id.length <= length) return id
  return `${id.substring(0, length)}...`
}
