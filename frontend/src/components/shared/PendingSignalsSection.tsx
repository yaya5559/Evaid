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
  const [collapsed, setCollapsed] = useState<Boolean>(true)
  const pending = signals.filter((s) => s.status === 'pending')

  if (pending.length === 0) return null

  return (
    <section className="admin-card" style={{ marginBottom: '16px', borderLeft: '3px solid #d97706' }}>
      <h2
        onClick={() => setCollapsed(p => !p)}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
        Pending Signals
        <span className="admin-pill neutral" style={{ fontSize: '0.75rem' }}>{pending.length} awaiting review</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <svg
            width="16" height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </h2>
      {!collapsed && (
        <>
          <p style={{ opacity: 0.6, fontSize: '0.85rem', marginTop: 0, marginBottom: '12px' }}>
            These signals were extracted from uploaded evidence and need your review. Click a signal to review it.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
            {pending.map((signal) => (
              <button
                key={signal.id}
                type="button"
                className="orgdash-progress-row"
                style={{
                  flexDirection: 'column', alignItems: 'flex-start', gap: '8px', padding: '12px',
                  cursor: 'pointer', width: '100%', textAlign: 'left', background: 'none', border: 'none',
                }}
                onClick={() => setOpenSignal(signal)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="signal-type-badge small evidence">
                      {formatSignalType(signal.signal_type)}
                    </span>
                    <span style={{ color: "#fff8f8", fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                      {signal.raw_value}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontWeight: 700,
                      color: confidenceColor(signal.confidence),
                      fontSize: '0.85rem',
                      minWidth: '36px',
                      textAlign: 'right',
                    }}>
                      {Math.round(signal.confidence * 100)}%
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#5b8dee', fontWeight: 600 }}>Review →</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
