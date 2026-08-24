import Button from './Button'
import { orderTotal } from '../utils/storage'

/**
 * OrderTicket — the app's signature element. Styled after a kitchen
 * order ticket / receipt: perforated edge, monospace figures, a stamped
 * status. This is how a line cook actually reads an order.
 */
export default function OrderTicket({ order, onComplete, onDelete }) {
  const isPending = order.status === 'pending'
  const time = new Date(order.timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="relative flex items-stretch overflow-hidden rounded-lg border border-rail bg-panel shadow-ticket">
      {/* perforated left rail */}
      <div
        className={`w-2 shrink-0 ${isPending ? 'bg-ember' : 'bg-sage'}`}
        style={{
          maskImage:
            'repeating-linear-gradient(to bottom, black 0 6px, transparent 6px 12px)',
          WebkitMaskImage:
            'repeating-linear-gradient(to bottom, black 0 6px, transparent 6px 12px)'
        }}
      />

      <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-display text-base text-paper">{order.item}</p>
            <StatusStamp status={order.status} />
          </div>
          <p className="mt-1 font-mono text-xs text-muted">
            #{order.id.split('_')[1]} · {order.quantity}× · fired {time}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <p className="font-mono text-lg text-paper">${orderTotal(order).toFixed(2)}</p>
          <div className="flex gap-2">
            {isPending && (
              <Button variant="primary" onClick={() => onComplete(order.id)}>
                Complete
              </Button>
            )}
            <Button variant="danger" onClick={() => onDelete(order.id)}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusStamp({ status }) {
  const isPending = status === 'pending'
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
        isPending
          ? 'border-ember/40 text-ember'
          : 'border-sage/40 text-sage'
      }`}
    >
      {status}
    </span>
  )
}
