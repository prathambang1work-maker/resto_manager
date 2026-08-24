const VARIANTS = {
  primary:
    'bg-ember text-void hover:bg-ember-soft active:bg-ember-dim shadow-[0_0_0_1px_rgba(232,134,58,0.4)]',
  ghost:
    'bg-transparent text-paper/80 hover:text-paper hover:bg-raised border border-rail',
  danger:
    'bg-transparent text-chili hover:bg-chili/10 border border-chili/40',
  subtle:
    'bg-raised text-paper/70 hover:text-paper hover:bg-rail'
}

/**
 * Button — the single interactive control used across the app.
 * variant: 'primary' | 'ghost' | 'danger' | 'subtle'
 */
export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium
        transition-colors duration-150 focus-visible:outline focus-visible:outline-2
        focus-visible:outline-offset-2 focus-visible:outline-ember disabled:opacity-40
        disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
