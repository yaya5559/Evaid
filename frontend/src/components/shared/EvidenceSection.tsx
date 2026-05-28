import { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'
import { SignalHistoryModal } from './SignalHistoryModal'

export type EvidenceItem = {
  file_id: string
  file_name: string
  content_type?: string
  upload_date?: string
  processing_status?: string
  agent_context?: string | null
  summary?: string | null
}

function formatDate(d: string | undefined | null) {
  if (!d) return '—'
  const dt = new Date(d.slice(0, 10) + 'T00:00:00')
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusColor(status: string | undefined) {
  const s = status?.toLowerCase()
  if (s === 'confirmed' || s === 'processed' || s === 'complete') return '#16a34a'
  if (s === 'processing' || s === 'initial_processing') return '#0ea5e9'
  if (s === 'pending') return '#d97706'
  return '#64748b'
}

function statusBg(status: string | undefined) {
  const s = status?.toLowerCase()
  if (s === 'confirmed' || s === 'processed' || s === 'complete') return 'rgba(22,163,74,0.12)'
  if (s === 'processing' || s === 'initial_processing') return 'rgba(14,165,233,0.12)'
  if (s === 'pending') return 'rgba(217,119,6,0.12)'
  return 'rgba(100,116,139,0.10)'
}

function fileIcon(contentType: string | undefined) {
  if (!contentType) return '📄'
  if (contentType.startsWith('image/')) return '🖼'
  if (contentType === 'application/pdf') return '📑'
  if (contentType.includes('text')) return '📝'
  return '📄'
}

function FilePreviewModal({ evidenceId, fileName, previewRoute, onClose }: {
  evidenceId: string
  fileName: string
  previewRoute: string
  onClose: () => void
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [contentType, setContentType] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState(true)
  const [previewError, setPreviewError] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    const load = async () => {
      try {
        const res = await api.get(`${previewRoute}/${evidenceId}`, { responseType: 'blob', withCredentials: true })
        objectUrl = URL.createObjectURL(res.data)
        setBlobUrl(objectUrl)
        setContentType(res.data.type ?? '')
      } catch {
        setPreviewError('Failed to load file preview')
      } finally {
        setLoadingPreview(false)
      }
    }
    void load()
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [evidenceId, previewRoute])

  const isImage = contentType.startsWith('image/')
  const isPdf = contentType === 'application/pdf'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <div style={{ background: '#1a1a1a', borderRadius: '12px', width: '90vw', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{fileName}</strong>
          <button type="button" className="admin-btn" onClick={onClose} style={{ padding: '4px 10px' }}>✕ Close</button>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
          {loadingPreview && <p style={{ opacity: 0.6, color: '#fff' }}>Loading preview...</p>}
          {previewError && <p style={{ color: '#f87171' }}>{previewError}</p>}
          {blobUrl && isImage && <img src={blobUrl} alt={fileName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />}
          {blobUrl && isPdf && <iframe src={blobUrl} title={fileName} style={{ width: '100%', height: '100%', border: 'none' }} />}
          {blobUrl && !isImage && !isPdf && (
            <div style={{ color: '#fff', textAlign: 'center', padding: '32px' }}>
              <p style={{ marginBottom: '12px', opacity: 0.8 }}>Preview not available for this file type.</p>
              <a href={blobUrl} download={fileName} className="admin-btn primary">Download File</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Evidence list section (collapsible, like Confirmed Signals) ──────────────
interface EvidenceSectionProps {
  evidence: EvidenceItem[]
  loading: boolean
  onDelete: (fileId: string) => Promise<void>
  previewRoute: string
}

export function EvidenceSection({ evidence, loading, onDelete, previewRoute }: EvidenceSectionProps) {
  const [collapsed, setCollapsed] = useState(true)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [previewEvidence, setPreviewEvidence] = useState<{ id: string; name: string } | null>(null)
  const [signalEvidence, setSignalEvidence] = useState<{ id: string; name: string } | null>(null)
  const [noteEvidence, setNoteEvidence] = useState<{ name: string; note: string } | null>(null)

  return (
    <>
      {previewEvidence && (
        <FilePreviewModal evidenceId={previewEvidence.id} fileName={previewEvidence.name} previewRoute={previewRoute} onClose={() => setPreviewEvidence(null)} />
      )}
      {signalEvidence && (
        <SignalHistoryModal evidenceId={signalEvidence.id} evidenceName={signalEvidence.name} onClose={() => setSignalEvidence(null)} />
      )}
      {noteEvidence && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setNoteEvidence(null)}>
          <div style={{ background: '#1a1a1a', borderRadius: '12px', width: '100%', maxWidth: '480px', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.5, color: '#fff', marginBottom: '2px' }}>Investigator Note</div>
                <strong style={{ color: '#ffffff', fontSize: '0.95rem' }}>{noteEvidence.name}</strong>
              </div>
              <button type="button" className="admin-btn" onClick={() => setNoteEvidence(null)} style={{ padding: '4px 10px' }}>✕</button>
            </div>
            <div style={{ padding: '20px', color: '#fff', fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.85 }}>{noteEvidence.note}</div>
          </div>
        </div>
      )}

      <section className="admin-card" style={{ marginBottom: '16px', borderLeft: '3px solid #f204f2' }}>
        <h2
          onClick={() => setCollapsed(p => !p)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
        >
          Evidence
          <span className="admin-pill neutral" style={{ fontSize: '0.75rem' }}>{evidence.length}</span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: collapsed ? 'rotate(0deg)':'rotate(180deg)' , transition: 'transform 0.2s ease' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </h2>

        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {evidence.length === 0 && (
              <p style={{ opacity: 0.5, fontSize: '0.85rem', padding: '12px 0', textAlign: 'center' }}>
                No evidence uploaded yet.
              </p>
            )}
            {evidence.map((ev) => {
              const isProcessing = ev.processing_status === 'INITIAL_PROCESSING';
              const isConfirming = confirmDeleteId === ev.file_id;

              return (
                <div
                  key={ev.file_id}
                  className="orgdash-progress-row"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    transition: 'border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                >
                  {/* Clickable content area */}
                  <button
                    type="button"
                    onClick={() => setPreviewEvidence({ id: ev.file_id, name: ev.file_name })}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                      width: '100%',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '0.92rem',
                        textDecoration: 'underline',
                        textDecorationColor: 'rgba(255,255,255,0.3)',
                        textUnderlineOffset: '3px',
                        color: '#e8e8e8',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ev.file_name}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      {/* Status badge instead of plain text */}
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: isProcessing
                            ? 'rgba(251, 191, 36, 0.15)'
                            : 'rgba(74, 222, 128, 0.15)',
                          color: isProcessing ? '#fbbf24' : '#4ade80',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {isProcessing ? 'Processing…' : ev.processing_status}
                      </span>
                      <span style={{ fontSize: '0.78rem', opacity: 0.45, color: '#e8e8e8' }}>
                        {formatDate(ev.upload_date)}
                      </span>
                    </div>

                    {ev.summary && (
                      <p style={{ fontSize: '0.82rem', opacity: 0.6, marginTop: '6px', fontStyle: 'italic', lineHeight: 1.4, color: '#e8e8e8' }}>
                        {ev.summary}
                      </p>
                    )}
                  </button>

                  {/* Actions row — separated from content */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '6px',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      paddingTop: '8px',
                    }}
                  >
                    {ev.agent_context && (
                      <button
                        type="button"
                        className="admin-btn"
                        style={{ fontSize: '0.78rem', padding: '4px 12px' }}
                        onClick={() => setNoteEvidence({ name: ev.file_name, note: ev.agent_context! })}
                      >
                        Note
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-btn"
                      style={{ fontSize: '0.78rem', padding: '4px 12px' }}
                      onClick={() => setSignalEvidence({ id: ev.file_id, name: ev.file_name })}
                    >
                      Signals
                    </button>

                    {/* Push delete to the right */}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                      {isConfirming ? (
                        <>
                          <button
                            type="button"
                            className="admin-btn critical"
                            style={{ fontSize: '0.78rem', padding: '4px 12px' }}
                            onClick={() => { void onDelete(ev.file_id); setConfirmDeleteId(null); }}
                            disabled={loading}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="admin-btn"
                            style={{ fontSize: '0.78rem', padding: '4px 12px' }}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="admin-btn critical"
                          style={{ fontSize: '0.78rem', padding: '4px 12px' }}
                          onClick={() => setConfirmDeleteId(ev.file_id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  )
}

// ── Upload Evidence section (separate collapsible) ───────────────────────────
interface EvidenceUploadSectionProps {
  onUpload: (file: File, agentContext: string) => Promise<void>
}

export function EvidenceUploadSection({ onUpload }: EvidenceUploadSectionProps) {
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [agentNote, setAgentNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleUpload = async () => {
    if (!evidenceFile) return
    setUploading(true); setUploadError(null); setUploadDone(false)
    try {
      await onUpload(evidenceFile, agentNote)
      setEvidenceFile(null); setAgentNote('')
      setUploadDone(true)
      setTimeout(() => setUploadDone(false), 3000)
    } catch (err: any) {
      setUploadError(err?.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="admin-card" style={{ marginBottom: '16px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        Upload Evidence
      </h2>
      <div>
          <label style={{ display: 'block', fontWeight: 500, marginBottom: '6px', fontSize: '0.9rem' }}>
            Note for AI <span style={{ opacity: 0.6, fontWeight: 400 }}>(optional — helps AI extract more relevant signals)</span>
          </label>
          <textarea
            className="edit-org-input"
            rows={2}
            placeholder="e.g. 'This is a Discord log. Focus on usernames and server names.'"
            value={agentNote}
            onChange={e => setAgentNote(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="file"
              accept="image/*,.pdf,.txt,.csv,.json"
              onChange={e => { setEvidenceFile(e.target.files?.[0] ?? null); setUploadDone(false) }}
              style={{ flex: 1, color: 'inherit' }}
            />
            <button
              type="button"
              className="admin-btn primary"
              onClick={() => void handleUpload()}
              disabled={uploading || !evidenceFile}
              style={{ minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              {uploading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Uploading...
                </>
              ) : uploadDone ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Done
                </>
              ) : 'Upload'}
            </button>
          </div>
          {uploadError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '6px' }}>{uploadError}</p>}
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      
    </section>
  )
}
