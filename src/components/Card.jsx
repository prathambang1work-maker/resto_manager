/**
 * Card — base panel surface used for metrics, forms, and lists.
 * eyebrow: small label above the title (e.g. "TODAY")
 */
export default function Card({ eyebrow, title, value, accent, children, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-rail bg-panel p-5 shadow-ticket ${className}`}
    >
      {(eyebrow || title) && (
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            {eyebrow && (
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                {eyebrow}
              </p>
            )}
            {title && <h3 className="font-display text-lg text-paper">{title}</h3>}
          </div>
          {accent && <span className="font-mono text-xs text-ember">{accent}</span>}
        </div>
      )}
      {value !== undefined && (
        <p className="font-display text-3xl font-medium text-paper">{value}</p>
      )}
      {children}
    </div>
  )
}
