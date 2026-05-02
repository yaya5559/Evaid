import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../../context/AuthContext'

type SignalRecord = {
    id: string
    signal_type: string
    raw_value: string
    normalized_value: string
    confidence: number
    source_locator: string
    status: 'confirmed' | 'rejected'
    triage_reason?: string
    reviewed_at?: string
}

type SignalHistory = {
    confirmed: SignalRecord[]
    rejected: SignalRecord[]
}

interface SignalHistoryModalProps {
    evidenceId: string
    evidenceName: string
    onClose: () => void
}

function confidenceColor(score: number): string {
    if (score >= 0.75) return '#16a34a'
    if (score >= 0.5) return '#d97706'
    return '#dc2626'
}

function formatSignalType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(d: string | null | undefined) {
    if (!d) return '—'
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return '—'
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function SignalHistoryModal({ evidenceId, evidenceName, onClose }: SignalHistoryModalProps) {
    const [history, setHistory] = useState<SignalHistory | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'confirmed' | 'rejected'>('confirmed')

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await api.get(`/evidence/${evidenceId}/signal-history`, { withCredentials: true })
                setHistory(res.data)
            } catch (err: any) {
                setError(err?.message ?? 'Failed to load signal history')
            } finally {
                setLoading(false)
            }
        }
        void load()
    }, [evidenceId])

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    const current = activeTab === 'confirmed' ? (history?.confirmed ?? []) : (history?.rejected ?? [])

    const modal = (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#1a1a1a',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '600px',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexShrink: 0,
                    background: '#1a1a1a',
                }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '2px', color: '#fff' }}>Signal History</div>
                        <h2 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{evidenceName}</h2>
                    </div>
                    <button type="button" className="admin-btn" onClick={onClose} style={{ padding: '4px 10px' }}>✕</button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    background: '#1a1a1a',
                    flexShrink: 0,
                }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('confirmed')}
                        style={{
                            flex: 1, padding: '10px', border: 'none',
                            background: 'transparent',
                            borderBottom: activeTab === 'confirmed' ? '2px solid #16a34a' : '2px solid transparent',
                            color: activeTab === 'confirmed' ? '#16a34a' : 'rgba(255,255,255,0.5)',
                            fontWeight: activeTab === 'confirmed' ? 600 : 400,
                            cursor: 'pointer', fontSize: '0.875rem',
                        }}
                    >
                        ✓ Confirmed {history ? `(${history.confirmed.length})` : ''}
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('rejected')}
                        style={{
                            flex: 1, padding: '10px', border: 'none',
                            background: 'transparent',
                            borderBottom: activeTab === 'rejected' ? '2px solid #dc2626' : '2px solid transparent',
                            color: activeTab === 'rejected' ? '#dc2626' : 'rgba(255,255,255,0.5)',
                            fontWeight: activeTab === 'rejected' ? 600 : 400,
                            cursor: 'pointer', fontSize: '0.875rem',
                        }}
                    >
                        ✕ Rejected {history ? `(${history.rejected.length})` : ''}
                    </button>
                </div>

                {/* Body */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    background: '#1a1a1a',
                }}>
                    {loading && <p style={{ opacity: 0.6, textAlign: 'center', color: '#fff' }}>Loading signals...</p>}
                    {error && <p style={{ color: '#f87171' }}>{error}</p>}

                    {!loading && !error && current.length === 0 && (
                        <p style={{ opacity: 0.5, textAlign: 'center', marginTop: '24px', color: '#fff' }}>
                            No {activeTab} signals for this evidence.
                        </p>
                    )}

                    {!loading && !error && current.map((signal) => (
                        <div
                            key={signal.id}
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: '8px',
                                borderLeft: `3px solid ${signal.status === 'confirmed' ? '#16a34a' : '#dc2626'}`,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{
                                    background: 'rgba(255,255,255,0.12)',
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: '#fff',
                                }}>
                                    {formatSignalType(signal.signal_type)}
                                </span>
                                <span style={{ fontWeight: 700, color: confidenceColor(signal.confidence), fontSize: '0.85rem' }}>
                                    {Math.round(signal.confidence * 100)}%
                                </span>
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all', marginBottom: '4px', color: '#fff' }}>
                                {signal.raw_value}
                            </div>
                            {signal.normalized_value && signal.normalized_value !== signal.raw_value && (
                                <div style={{ fontSize: '0.8rem', opacity: 0.5, fontFamily: 'monospace', color: '#fff' }}>
                                    Normalized: {signal.normalized_value}
                                </div>
                            )}
                            {signal.reviewed_at && (
                                <div style={{ fontSize: '0.75rem', opacity: 0.4, marginTop: '4px', color: '#fff' }}>
                                    {signal.status === 'confirmed' ? 'Confirmed' : 'Rejected'} on {formatDate(signal.reviewed_at)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    return createPortal(modal, document.body)
}
