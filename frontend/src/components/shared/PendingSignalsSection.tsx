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
  const { signals, setOpenSignal } = useSignals()
  const [error, setError] = useState<string | null>(null)

  const pending = signals.filter((s) => s.status === 'pending')

  if (pending.length === 0) return null

  return (
    <section className="admin-card" style={{ marginBottom: '16px', borderLeft: '3px solid #d97706' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        Pending Signals
        <span className="admin-pill neutral" style={{ fontSize: '0.75rem' }}>{pending.length} awaiting review</span>
      </h2>
      <p style={{ opacity: 0.6, fontSize: '0.85rem', marginTop: 0, marginBottom: '12px' }}>
        Click a signal to review it in detail.
      </p>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: '6px', marginBottom: '10px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {pending.map((signal) => (
          <button
            key={signal.id}
            type="button"
            onClick={() => setOpenSignal(signal)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              transition: 'background 0.15s',
              color: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              <span className="signal-type-badge small evidence" style={{ flexShrink: 0 }}>
                {formatSignalType(signal.signal_type)}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {signal.raw_value}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '12px' }}>
              <span style={{ fontWeight: 700, color: confidenceColor(signal.confidence), fontSize: '0.85rem' }}>
                {Math.round(signal.confidence * 100)}%
              </span>
              <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>Click to review →</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
