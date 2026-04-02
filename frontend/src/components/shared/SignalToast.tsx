import { useEffect } from 'react'
import { useSignals } from '../../context/SignalContext'
import type { Signal } from '../../context/SignalContext'
import '../../styles/Signals.css'

const TOAST_DURATION_MS = 8000

function confidenceColor(score: number): string {
  if (score >= 0.75) return '#16a34a'
  if (score >= 0.5) return '#d97706'
  return '#dc2626'
}

function ToastItem({
  signal,
  onDismiss,
  onOpen,
}: {
  signal: Signal
  onDismiss: () => void
  onOpen: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, TOAST_DURATION_MS)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className="signal-toast"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      <div className="signal-toast-header">
        <span
          className={`signal-type-badge ${
            signal.type === 'evidence_analysis' ? 'evidence' : 'connection'
          }`}
        >
          {signal.type === 'evidence_analysis' ? 'Evidence Analysis' : 'Case Connection'}
        </span>
        <button
          type="button"
          className="signal-toast-close"
          onClick={(e) => {
            e.stopPropagation()
            onDismiss()
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      <div className="signal-toast-case">{signal.caseTitle}</div>

      <div className="signal-toast-confidence">
        <span style={{ color: confidenceColor(signal.confidenceScore) }}>
          {Math.round(signal.confidenceScore * 100)}% confidence
        </span>
      </div>

      <div className="signal-toast-action">Click to view signal →</div>
    </div>
  )
}

export function SignalToast() {
  const { toastQueue, dismissToast, setOpenSignal } = useSignals()
  const current = toastQueue[0]
  if (!current) return null

  return (
    <div className="signal-toast-container">
      <ToastItem
        signal={current}
        onDismiss={() => dismissToast(current.id)}
        onOpen={() => {
          setOpenSignal(current)
          dismissToast(current.id)
        }}
      />
    </div>
  )
}
