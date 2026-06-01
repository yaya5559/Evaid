import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { api } from './AuthContext'

export type SignalStatus = 'pending' | 'confirmed' | 'denied'

export type Signal = {
  id: string
  signal_type: string
  raw_value: string
  normalized_value: string | null
  confidence: number
  source_locator: string | null
  triage_reason: string | null
  status: SignalStatus
  evidence_id: string
  case_id?: string
  case_title?: string
}

export type ConfirmedSignal = {
  id: string
  signal_type: string
  raw_value: string
  normalized_value: string | null
  confidence: number
  source_locator: string | null
  evidence_id: string
}

type BackendSignal = {
  id: string
  signal_type: string
  raw_value: string
  normalized_value: string | null
  confidence: number
  source_locator: string | null
  triage_reason: string | null
  evidence_id?: string
  case_id?: string
  case_title?: string
}

type SignalContextValue = {
  signals: Signal[]
  unseenCount: number
  toastQueue: Signal[]
  dismissToast: (id: string) => void
  openSignal: Signal | null
  setOpenSignal: (s: Signal | null) => void
  isPanelOpen: boolean
  openPanel: () => void
  closePanel: () => void
  confirmSignal: (id: string) => Promise<void>
  denySignal: (id: string) => Promise<void>
  fetchSignalsForEvidence: (evidenceId: string) => Promise<void>
  fetchSignalsForCase: (caseId: string) => Promise<void>
  fetchSignalsForOrg: (orgId: string) => Promise<void>
  confirmedSignals: ConfirmedSignal[]
  clearSignals: () => void
  setWatchedCase: (caseId: string | null) => Promise<void>
  lastTriagedAt: number
}

const SignalContext = createContext<SignalContextValue | null>(null)

export function useSignals() {
  const ctx = useContext(SignalContext)
  if (!ctx) throw new Error('useSignals must be used within SignalProvider')
  return ctx
}

async function getPendingSignals(evidenceId: string): Promise<BackendSignal[]> {
  const res = await api.get<BackendSignal[]>(`/evidence/${evidenceId}/pending-signals`)
  return Array.isArray(res.data) ? res.data : []
}

async function getPendingSignalsForCase(caseId: string): Promise<BackendSignal[]> {
  const res = await api.get(`/evidence/pending-signals/case/${caseId}`)
  return Array.isArray(res.data) ? res.data : []
}

async function getPendingSignalsForOrg(orgId: string): Promise<BackendSignal[]> {
  const res = await api.get(`/evidence/pending-signals/org/${orgId}`)
  return Array.isArray(res.data) ? res.data : []
}

async function getConfirmedSignalsForCase(caseId: string): Promise<ConfirmedSignal[]> {
  const res = await api.get(`/evidence/confirmedSignals/${caseId}`)
  return Array.isArray(res.data) ? res.data : []
}

// ── Provider ───────────────────────────────────────────────

export function SignalProvider({ children }: { children: React.ReactNode }) {
  const [signals, setSignals] = useState<Signal[]>([])
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())
  const [toastQueue, setToastQueue] = useState<Signal[]>([])
  const [openSignal, setOpenSignal] = useState<Signal | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [lastTriagedAt, setLastTriagedAt] = useState(0)
  const [confirmedSignals, setConfirmedSignals] = useState<ConfirmedSignal[]>([])
  const knownIds = useRef<Set<string>>(new Set())
  const watchedEvidenceIds = useRef<Set<string>>(new Set())
  const watchedCaseId = useRef<string | null>(null)

  const clearSignals = useCallback(() => {
    setSignals([])
    setConfirmedSignals([])
    setSeenIds(new Set())
    setToastQueue([])
    setOpenSignal(null)
    watchedCaseId.current = null
    knownIds.current = new Set()
    watchedEvidenceIds.current = new Set()
  }, [])

  const setWatchedCase = useCallback(async (caseId: string | null) => {
    watchedCaseId.current = caseId
    if (caseId) {
      try {
        const confirmed = await getConfirmedSignalsForCase(caseId)
        setConfirmedSignals(confirmed)
      } catch { /* silent */ }
    } else {
      setConfirmedSignals([])
    }
  }, [])


  const processIncoming = useCallback((incoming: Signal[]) => {
    if (incoming.length === 0) return
    const newSignals = incoming.filter((s) => !knownIds.current.has(s.id))
    if (newSignals.length === 0) return
    newSignals.forEach((s) => knownIds.current.add(s.id))
    setSignals((prev) => {
      const merged = [...prev]
      newSignals.forEach((s) => {
        if (!merged.find((x) => x.id === s.id)) merged.push(s)
      })
      return merged.sort((a, b) => b.confidence - a.confidence)
    })
    const pendingNew = newSignals.filter((s) => s.status === 'pending')
    if (pendingNew.length > 0) {
      setToastQueue((prev) => [...prev, ...pendingNew])
    }
  }, [])

  const fetchSignalsForCase = useCallback(async (caseId: string) => {
    try {
      const raw = await getPendingSignalsForCase(caseId)
      const mapped: Signal[] = raw.map((s) => ({
        ...s,
        status: 'pending' as const,
        evidence_id: s.evidence_id ?? caseId,
      }))
      processIncoming(mapped)
    } catch { /* silent */ }
  }, [processIncoming])

  const fetchSignalsForOrg = useCallback(async (orgId: string) => {
    try {
      const raw = await getPendingSignalsForOrg(orgId)
      const mapped: Signal[] = raw.map((s) => ({
        ...s,
        status: 'pending' as const,
        evidence_id: s.evidence_id ?? '',
      }))
      processIncoming(mapped)
    } catch { /* silent */ }
  }, [processIncoming])

  const fetchSignalsForEvidence = useCallback(async (evidenceId: string) => {
    watchedEvidenceIds.current.add(evidenceId)
    try {
      const raw = await getPendingSignals(evidenceId)
      const mapped: Signal[] = raw.map((s) => ({
        ...s,
        status: 'pending' as const,
        evidence_id: evidenceId,
      }))
      processIncoming(mapped)
    } catch { /* silent */ }
  }, [processIncoming])

  useEffect(() => {
    const poll = async () => {
      for (const evidenceId of watchedEvidenceIds.current) {
        try {
          const raw = await getPendingSignals(evidenceId)
          const mapped: Signal[] = raw.map((s) => ({
            ...s,
            status: 'pending' as const,
            evidence_id: evidenceId,
          }))
          processIncoming(mapped)
        } catch { /* silent */ }
      }

      if (watchedCaseId.current) {
        try {
          const confirmed = await getConfirmedSignalsForCase(watchedCaseId.current)
          setConfirmedSignals(confirmed)
        } catch { /* silent */ }
      }
    }
    const interval = setInterval(() => void poll(), 30_000)
    return () => clearInterval(interval)
  }, [processIncoming])

  const dismissToast = useCallback((id: string) => {
    setSeenIds((prev) => new Set([...prev, id]))
    setToastQueue((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const openPanel = useCallback(() => {
    setIsPanelOpen(true)
    setSeenIds((prev) => {
      const next = new Set(prev)
      signals.forEach((s) => next.add(s.id))
      return next
    })
    setToastQueue([])
  }, [signals])

  const closePanel = useCallback(() => setIsPanelOpen(false), [])

  const confirmSignal = useCallback(async (id: string) => {
    try {
      await api.patch(`/evidence/pending-signals/${id}/confirm`)
      setSignals((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'confirmed' as const } : s))
      )
      setOpenSignal(null)
      setLastTriagedAt(Date.now())
    } catch { /* silent */ }
  }, [])

  const denySignal = useCallback(async (id: string) => {
    try {
      await api.delete(`/evidence/pending-signals/${id}/reject`)
      setSignals((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'denied' as const } : s))
      )
      setOpenSignal(null)
      setLastTriagedAt(Date.now())
    } catch { /* silent */ }
  }, [])

  const unseenCount = signals.filter(
    (s) => s.status === 'pending' && !seenIds.has(s.id)
  ).length

  return (
    <SignalContext.Provider
      value={{
        signals,
        unseenCount,
        toastQueue,
        dismissToast,
        openSignal,
        setOpenSignal,
        isPanelOpen,
        openPanel,
        closePanel,
        confirmSignal,
        denySignal,
        fetchSignalsForEvidence,
        fetchSignalsForCase,
        fetchSignalsForOrg,
        confirmedSignals,
        clearSignals,
        lastTriagedAt,
        setWatchedCase,
      }}
    >
      {children}
    </SignalContext.Provider>
  )
}
