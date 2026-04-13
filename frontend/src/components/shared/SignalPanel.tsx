import { useSignals } from '../../context/SignalContext'
import type { Signal } from '../../context/SignalContext'
import '../../styles/Signals.css'

function formatDate(d: string) {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function confidenceColor(score: number): string {
  if (score >= 0.75) return '#16a34a'
  if (score >= 0.5) return '#d97706'
  return '#dc2626'
}

function formatSignalType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function SignalPanel() {
  const { signals, isPanelOpen, closePanel, setOpenSignal } = useSignals()

  if (!isPanelOpen) return null

  const sorted = [...signals].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (b.status === 'pending' && a.status !== 'pending') return 1
    return b.confidence - a.confidence
  })

  const handleSignalClick = (signal: Signal) => {
    setOpenSignal(signal)
    closePanel()
  }

  return (
    <>
      <div className="signal-panel-backdrop" onClick={closePanel} />

      <div className="signal-panel">
        <div className="signal-panel-header">
          <h3>Signals</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="admin-pill neutral">{signals.length} total</span>
            <button
              type="button"
              className="signal-panel-close"
              onClick={closePanel}
              aria-label="Close panel"
            >
              ×
            </button>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="signal-panel-empty">No signals yet.</div>
        ) : (
          <div className="signal-panel-list">
            {sorted.map((signal) => (
              <button
                key={signal.id}
                type="button"
                className={`signal-panel-item ${signal.status !== 'pending' ? 'dimmed' : ''}`}
                onClick={() => handleSignalClick(signal)}
              >
                <div className="signal-panel-item-top">
                  <span className="signal-type-badge small evidence">
                    {formatSignalType(signal.signal_type)}
                  </span>
                  {signal.status !== 'pending' && (
                    <span className={`signal-status-badge ${signal.status}`}>
                      {signal.status}
                    </span>
                  )}
                </div>

                <div className="signal-panel-case">{signal.raw_value}</div>

                <div className="signal-panel-conf">
                  <div className="signal-conf-bar-bg">
                    <div
                      className="signal-conf-bar-fill"
                      style={{
                        width: `${Math.round(signal.confidence * 100)}%`,
                        background: confidenceColor(signal.confidence),
                      }}
                    />
                  </div>
                  <span
                    style={{
                      color: confidenceColor(signal.confidence),
                      fontSize: '0.75rem',
                      minWidth: '32px',
                      fontWeight: 600,
                    }}
                  >
                    {Math.round(signal.confidence * 100)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
