import { useSignals } from '../../context/SignalContext'
import type { EvidenceAnalysisSignal, CaseConnectionSignal } from '../../context/SignalContext'
import '../../styles/Signals.css'

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

function roleClass(role: string): string {
  if (role === 'Suspect') return 'suspect'
  if (role === 'Person of Interest') return 'person-of-interest'
  if (role === 'Witness') return 'witness'
  return 'victim'
}

function EvidenceAnalysisDetail({ signal }: { signal: EvidenceAnalysisSignal }) {
  return (
    <>
      <div className="signal-modal-section">
        <div className="signal-modal-label">Case</div>
        <div className="signal-modal-value">{signal.caseTitle}</div>
      </div>

      <div className="signal-modal-section">
        <div className="signal-modal-label">Evidence File</div>
        <div className="signal-modal-value">{signal.evidenceFileName}</div>
      </div>

      <div className="signal-modal-section">
        <div className="signal-modal-label">AI Confidence</div>
        <ConfidenceBar score={signal.confidenceScore} />
      </div>

      {signal.actors.length > 0 && (
        <div className="signal-modal-section">
          <div className="signal-modal-label">Actors Identified</div>
          {signal.actors.map((a) => (
            <div key={a.id} className="signal-modal-actor">
              <strong style={{ fontSize: '0.9rem' }}>{a.primaryName}</strong>
              <span className={`signal-role-badge ${roleClass(a.role)}`}>{a.role}</span>
              {a.aliases.length > 0 && (
                <span style={{ fontSize: '0.78rem', opacity: 0.65 }}>
                  aka: {a.aliases.join(', ')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {signal.aiNotes && (
        <div className="signal-modal-section">
          <div className="signal-modal-label">AI Notes</div>
          <div className="signal-modal-notes">{signal.aiNotes}</div>
        </div>
      )}
    </>
  )
}

function CaseConnectionDetail({ signal }: { signal: CaseConnectionSignal }) {
  return (
    <>
      <div className="signal-modal-section">
        <div className="signal-modal-label">Cases Being Linked</div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="signal-case-chip">{signal.caseTitle}</span>
          <span style={{ opacity: 0.45, fontSize: '1.1rem' }}>↔</span>
          <span className="signal-case-chip">{signal.connectedCaseTitle}</span>
        </div>
      </div>

      <div className="signal-modal-section">
        <div className="signal-modal-label">AI Confidence</div>
        <ConfidenceBar score={signal.confidenceScore} />
      </div>

      {signal.connectionReason && (
        <div className="signal-modal-section">
          <div className="signal-modal-label">Connection Reason</div>
          <div className="signal-modal-notes">{signal.connectionReason}</div>
        </div>
      )}

      {signal.connectingActors.length > 0 && (
        <div className="signal-modal-section">
          <div className="signal-modal-label">Connecting Actors</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {signal.connectingActors.map((a) => (
              <span key={a.id} className="signal-case-chip">{a.primaryName}</span>
            ))}
          </div>
        </div>
      )}

      {signal.connectingEvidence.length > 0 && (
        <div className="signal-modal-section">
          <div className="signal-modal-label">Connecting Evidence</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {signal.connectingEvidence.map((e) => (
              <span key={e.id} className="signal-case-chip">{e.fileName}</span>
            ))}
          </div>
        </div>
      )}

      {signal.suggestedAgentName && (
        <div className="signal-modal-section">
          <div className="signal-modal-label">Suggested Agent Addition</div>
          <div className="signal-modal-value">{signal.suggestedAgentName}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '3px' }}>
            Confirming will request this agent be added to {signal.connectedCaseTitle}.
          </div>
        </div>
      )}
    </>
  )
}

export function SignalModal() {
  const { openSignal, setOpenSignal, confirmSignal, denySignal } = useSignals()
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
            <span
              className={`signal-type-badge large ${
                openSignal.type === 'evidence_analysis' ? 'evidence' : 'connection'
              }`}
            >
              {openSignal.type === 'evidence_analysis' ? 'Evidence Analysis' : 'Case Connection'}
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

        {/* Body */}
        <div className="signal-modal-body">
          {openSignal.type === 'evidence_analysis' ? (
            <EvidenceAnalysisDetail signal={openSignal} />
          ) : (
            <CaseConnectionDetail signal={openSignal} />
          )}
        </div>

        {/* Footer */}
        <div className="signal-modal-footer">
          {openSignal.status === 'pending' ? (
            <>
              <button
                type="button"
                className="signal-btn confirm"
                onClick={() => confirmSignal(openSignal.id)}
              >
                Confirm Signal
              </button>
              <button
                type="button"
                className="signal-btn deny"
                onClick={() => denySignal(openSignal.id)}
              >
                Deny Signal
              </button>
            </>
          ) : (
            <button
              type="button"
              className="signal-btn"
              style={{ background: '#f3f4f6', color: '#374151' }}
              onClick={() => setOpenSignal(null)}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
