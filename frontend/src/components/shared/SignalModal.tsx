import { useSignals } from '../../context/SignalContext'
import '../../styles/Signals.css'
import { FilePreviewModal } from './EvidenceSection'



function confidenceColor(score: number): string {
  if (score >= 0.75) return '#16a34a'
  if (score >= 0.5) return '#d97706'
  return '#dc2626'
}

function ConfidenceBar({ score }: { score: number }) {
  const color = confidenceColor(score)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div className="signal-conf-bar-bg">
        <div
          className="signal-conf-bar-fill"
          style={{ width: `${Math.round(score * 100)}%`, background: color }}
        />
      </div>
      <span style={{ fontWeight: 700, color, minWidth: '38px', fontSize: '0.9rem' }}>
        {Math.round(score * 100)}%
      </span>
    </div>
  )
}

function formatSignalType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

type ParsedLocator = {
  method?: string
  platform?: string
  reasoning?: string
  char_start?: number
  char_end?: number
  attachment_id?: string
}

function parseLocator(raw: string | null): ParsedLocator | null {
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function SignalModal({previewRoute}:{previewRoute:string}) {
    const { openSignal, setOpenSignal, confirmSignal, denySignal } = useSignals()
    const locator = parseLocator(openSignal?.source_locator ?? null)

    if (!openSignal) return null    

    return (
      <div
        className="signal-modal-backdrop"
        onClick={() => setOpenSignal(null)}
        role="dialog"
        aria-modal="true"
      >
        <div className="signal-modal-card" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="signal-modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="signal-type-badge large evidence">
                {formatSignalType(openSignal.signal_type)}
              </span>
              {openSignal.status !== 'pending' && (
                <span className={`signal-status-badge ${openSignal.status}`}>
                  {openSignal.status}
                </span>
              )}
            </div>
            <button
              type="button"
              className="signal-modal-close"
              onClick={() => setOpenSignal(null)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

            {/* Two-panel row */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

            {/* Left: signal details + footer */}
            <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #213344' }}>
              <div className="signal-modal-body">

                <div className="signal-modal-section">
                  <div className="signal-modal-label">Extracted Value</div>
                  <div className="signal-modal-value" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {openSignal.raw_value}
                  </div>
                </div>

                {openSignal.normalized_value && openSignal.normalized_value !== openSignal.raw_value && (
                  <div className="signal-modal-section">
                    <div className="signal-modal-label">Normalized</div>
                    <div className="signal-modal-value" style={{ fontFamily: 'monospace', opacity: 0.75 }}>
                      {openSignal.normalized_value}
                    </div>
                  </div>
                )}

                <div className="signal-modal-section">
                  <div className="signal-modal-label">Confidence</div>
                  <ConfidenceBar score={openSignal.confidence} />
                </div>

                {locator?.platform && (
                  <div className="signal-modal-section">
                    <div className="signal-modal-label">Detected Platform</div>
                    <div className="signal-modal-value">{locator.platform}</div>
                  </div>
                )}

                {locator?.reasoning && (
                  <div className="signal-modal-section">
                    <div className="signal-modal-label">AI Reasoning</div>
                    <div className="signal-modal-notes">{locator.reasoning}</div>
                  </div>
                )}

                {(locator?.char_start != null && locator?.char_end != null) && (
                  <div className="signal-modal-section">
                    <div className="signal-modal-label">Location in Document</div>
                    <div className="signal-modal-value" style={{ fontSize: '0.82rem', opacity: 0.75 }}>
                      Characters {locator.char_start} – {locator.char_end}
                    </div>
                  </div>
                )}

                {openSignal.triage_reason && (
                  <div className="signal-modal-section">
                    <div className="signal-modal-label">Source</div>
                    <div className="signal-modal-value" style={{ textTransform: 'capitalize' }}>
                      {openSignal.triage_reason.replace(/_/g, ' ')}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer inside left panel */}
              <div className="signal-modal-footer">
                {openSignal.status === 'pending' ? (
                  <>
                    <button type="button" className="signal-btn confirm" onClick={() => void confirmSignal(openSignal.id)}>
                      Confirm Signal
                    </button>
                    <button type="button" className="signal-btn deny" onClick={() => void denySignal(openSignal.id)}>
                      Deny Signal
                    </button>
                  </>
                ) : (
                  <button type="button" className="signal-btn" style={{ background: 'rgba(255,255,255,0.06)', color: '#9fb6ce' }} onClick={() => setOpenSignal(null)}>
                    Close
                  </button>
                )}
              </div>
            </div>

            {/* Right: imgae Preview*/}
            <div style ={{flex: 1, overflow: 'hidden', borderRadius: '0 0 18px 0'}}>
              <FilePreviewModal
                evidenceId={openSignal.evidence_id}
                fileName={openSignal.raw_value}
                previewRoute={previewRoute}
                onClose={() => {}}
                embedded
              />
            </div>

          </div>

        </div>
      </div>

      
    )
  }
