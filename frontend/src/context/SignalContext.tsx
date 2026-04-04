import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

// ── Types ──────────────────────────────────────────────────

export type SignalStatus = 'pending' | 'confirmed' | 'denied'

export type ActorRef = {
  id: string
  primaryName: string
  aliases: string[]
  role: 'Suspect' | 'Person of Interest' | 'Witness' | 'Victim'
}

export type EvidenceRef = {
  id: string
  fileName: string
}

export type EvidenceAnalysisSignal = {
  id: string
  type: 'evidence_analysis'
  status: SignalStatus
  confidenceScore: number
  createdAt: string
  caseId: string
  caseTitle: string
  evidenceFileId: string
  evidenceFileName: string
  actors: ActorRef[]
  aiNotes: string
}

export type CaseConnectionSignal = {
  id: string
  type: 'case_connection'
  status: SignalStatus
  confidenceScore: number
  createdAt: string
  caseId: string
  caseTitle: string
  connectedCaseId: string
  connectedCaseTitle: string
  connectingActors: Array<{ id: string; primaryName: string }>
  connectingEvidence: EvidenceRef[]
  suggestedAgentId?: number
  suggestedAgentName?: string
  connectionReason: string
}

export type Signal = EvidenceAnalysisSignal | CaseConnectionSignal

// ── Context shape ──────────────────────────────────────────

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
  confirmSignal: (id: string) => void
  denySignal: (id: string) => void
  checkSignalsAfterUpload: (caseId: string) => Promise<void>
}

const SignalContext = createContext<SignalContextValue | null>(null)

export function useSignals() {
  const ctx = useContext(SignalContext)
  if (!ctx) throw new Error('useSignals must be used within SignalProvider')
  return ctx
}

// ── Stubs — replace with real API calls when backend is available ──

async function fetchAllSignals(): Promise<Signal[]> {
  // TODO: GET /signals
  return []
}

async function fetchSignalsForCase(_caseId: string): Promise<Signal[]> {
  // TODO: GET /cases/{caseId}/signals
  return []
}

// ── TEST SIGNALS — remove once backend is wired up ────────

const TEST_SIGNALS: Signal[] = [
  {
    id: 'test-signal-evidence-001',
    type: 'evidence_analysis',
    status: 'pending',
    confidenceScore: 0.91,
    createdAt: new Date().toISOString(),
    caseId: 'case-001',
    caseTitle: 'Operation Nightfall',
    evidenceFileId: 'file-abc-123',
    evidenceFileName: 'surveillance_footage_aug12.mp4',
    actors: [
      {
        id: 'actor-001',
        primaryName: 'Marcus Webb',
        aliases: ['The Broker', 'M. Weber'],
        role: 'Suspect',
      },
      {
        id: 'actor-002',
        primaryName: 'Diane Solano',
        aliases: ['D. Sol'],
        role: 'Person of Interest',
      },
    ],
    aiNotes:
      'Surveillance footage from August 12th shows two individuals matching prior descriptions entering the warehouse at 02:14 AM. Facial geometry analysis indicates a 91% match with Marcus Webb. A second individual, partially obscured, matches Diane Solano with 74% confidence. Both departed at 03:47 AM carrying unidentified containers.',
  },
  {
    id: 'test-signal-connection-001',
    type: 'case_connection',
    status: 'pending',
    confidenceScore: 0.76,
    createdAt: new Date(Date.now() - 120_000).toISOString(),
    caseId: 'case-001',
    caseTitle: 'Operation Nightfall',
    connectedCaseId: 'case-007',
    connectedCaseTitle: 'Harbor District Fraud',
    connectingActors: [
      { id: 'actor-001', primaryName: 'Marcus Webb' },
    ],
    connectingEvidence: [
      { id: 'file-abc-123', fileName: 'surveillance_footage_aug12.mp4' },
      { id: 'file-xyz-456', fileName: 'financial_records_q3.pdf' },
    ],
    suggestedAgentId: 42,
    suggestedAgentName: 'Agent Sarah Okonkwo',
    connectionReason:
      'Marcus Webb appears in evidence from both Operation Nightfall and Harbor District Fraud. Financial records from Harbor District Fraud reference a shell company — "Webb Logistics LLC" — which matches a name found in Operation Nightfall communications. The AI recommends cross-case collaboration.',
  },
]

// ── Provider ───────────────────────────────────────────────

export function SignalProvider({ children }: { children: React.ReactNode }) {
  const [signals, setSignals] = useState<Signal[]>(TEST_SIGNALS)
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set())
  const [toastQueue, setToastQueue] = useState<Signal[]>([TEST_SIGNALS[0]])
  const [openSignal, setOpenSignal] = useState<Signal | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const knownIds = useRef<Set<string>>(new Set(TEST_SIGNALS.map((s) => s.id)))

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
      return merged.sort((a, b) => b.confidenceScore - a.confidenceScore)
    })
    // Only queue pending signals as toasts
    const pendingNew = newSignals.filter((s) => s.status === 'pending')
    if (pendingNew.length > 0) {
      setToastQueue((prev) => [...prev, ...pendingNew])
    }
  }, [])

  // Poll every 30 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const data = await fetchAllSignals()
        processIncoming(data)
      } catch { /* silent — backend not yet available */ }
    }
    void poll()
    const interval = setInterval(() => void poll(), 30_000)
    return () => clearInterval(interval)
  }, [processIncoming])

  const checkSignalsAfterUpload = useCallback(async (caseId: string) => {
    try {
      const data = await fetchSignalsForCase(caseId)
      processIncoming(data)
    } catch { /* silent */ }
  }, [processIncoming])

  const dismissToast = useCallback((id: string) => {
    setSeenIds((prev) => new Set([...prev, id]))
    setToastQueue((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const openPanel = useCallback(() => {
    setIsPanelOpen(true)
    // Mark all as seen when opening panel
    setSeenIds((prev) => {
      const next = new Set(prev)
      signals.forEach((s) => next.add(s.id))
      return next
    })
    setToastQueue([])
  }, [signals])

  const closePanel = useCallback(() => setIsPanelOpen(false), [])

  const confirmSignal = useCallback((id: string) => {
    // TODO: POST /signals/{id}/confirm
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'confirmed' as const } : s))
    )
    setOpenSignal(null)
  }, [])

  const denySignal = useCallback((id: string) => {
    // TODO: POST /signals/{id}/deny
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'denied' as const } : s))
    )
    setOpenSignal(null)
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
        checkSignalsAfterUpload,
      }}
    >
      {children}
    </SignalContext.Provider>
  )
}
