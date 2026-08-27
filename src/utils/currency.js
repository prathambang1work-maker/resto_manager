// ---------------------------------------------------------------------------
// currency.js
// Single place that knows how money is formatted across the app (INR).
// ---------------------------------------------------------------------------

const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2
})

/** Format a number as Indian Rupees, e.g. 1234.5 -> "₹1,234.50" */
export function formatINR(amount) {
  const safe = Number.isFinite(amount) ? amount : 0
  return formatter.format(safe)
}
