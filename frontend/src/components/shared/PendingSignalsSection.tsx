import { useState } from 'react'
import { useSignals } from '../../context/SignalContext'

function confidenceColor(score: number): string {
  if (score >= 0.75) return '#16a34a'
  if (score >= 0.5) return '#d97706'
  return '#dc2626'
}

function formatSignalType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function PendingSignalsSection() {
  const { signals, confirmSignal, denySignal } = useSignals()
  const [error, setError] = useState<string | null>(null)

  const pending = signals.filter((s) => s.status === 'pending')

  if (pending.length === 0) return null

  const handleConfirm = async (id: string) => {
    setError(null)
    try {
      await confirmSignal(id)
    } catch {
      setError('Failed to confirm signal. Check backend logs.')
    }
  }

  const handleDeny = async (id: string) => {
    setError(null)
    try {
      await denySignal(id)
    } catch {
      setError('Failed to deny signal.')
    }
  }

  return (
    <section className="admin-card" style={{ marginBottom: '16px', borderLeft: '3px solid #d97706' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        Pending Signals
        <span className="admin-pill neutral" style={{ fontSize: '0.75rem' }}>{pending.length} awaiting review</span>
      </h2>
      <p style={{ opacity: 0.6, fontSize: '0.85rem', marginTop: 0, marginBottom: '12px' }}>
        These signals were extracted from uploaded evidence and need your review.
      </p>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: '6px', marginBottom: '10px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {pending.map((signal) => (
          <div
            key={signal.id}
            className="orgdash-progress-row"
            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', padding: '12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="signal-type-badge small evidence">
                  {formatSignalType(signal.signal_type)}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                  {signal.raw_value}
                </span>
              </div>
              <span style={{
                fontWeight: 700,
                color: confidenceColor(signal.confidence),
                fontSize: '0.85rem',
                minWidth: '36px',
                textAlign: 'right',
              }}>
                {Math.round(signal.confidence * 100)}%
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="admin-btn primary"
                style={{ padding: '4px 14px', fontSize: '0.8rem' }}
                onClick={() => void handleConfirm(signal.id)}
              >
                Confirm
              </button>
              <button
                type="button"
                className="admin-btn critical"
                style={{ padding: '4px 14px', fontSize: '0.8rem' }}
                onClick={() => void handleDeny(signal.id)}
              >
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
