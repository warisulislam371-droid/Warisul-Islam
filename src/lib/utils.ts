/**
 * Utility functions for the e-commerce platform.
 */

/**
 * A lightweight custom conditional class joiner (alternative to clsx/tailwind-merge)
 */
export function cn(...inputs: any[]): string {
  return inputs
    .filter(Boolean)
    .map((str) => String(str).trim())
    .join(' ');
}

/**
 * Formats date string to high-fidelity human readable format.
 */
export function formatDate(dateString: string | any): string {
  if (!dateString) return 'Pending';
  try {
    const d = typeof dateString === 'string' ? new Date(dateString) : dateString.toDate?.() || new Date(dateString);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return String(dateString);
  }
}

/**
 * Formats currency amount in Indian Rupees (INR).
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}
