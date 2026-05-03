import { useEffect, useState, useRef, useCallback } from 'react'
import { api } from '../../context/AuthContext'

type NodeType = 'person' | 'location' | 'event' | 'evidence'
type EdgeSource = 'AI' | 'USER'

type GraphNode = {
  id: string
  type: NodeType
  label: string
  source: EdgeSource
  evidence_id?: string | null
}

type EvidenceItem = {
  file_id: string
  file_name: string
  content_type?: string
  upload_date?: string
  processing_status?: string
}

type GraphEdge = {
  id: string
  From: string
  to: string
  type: string
  source: EdgeSource
  confidence: number | null
}

type GraphResponse = {
  case_id: string
  nodes: GraphNode[]
  edges: GraphEdge[]
}

type GraphProps = {
  caseId: string
  previewRoute?: string
}

const NODE_W = 148
const NODE_H = 52
const NODE_RADIUS = 8
const CANVAS_W = 1100
const CANVAS_H = 700
const GROUP_PADDING = 80

type LayoutNode = GraphNode & { x: number; y: number }

function computeLayout(nodes: GraphNode[]): LayoutNode[] {
  const groups: Record<NodeType, GraphNode[]> = {
    person: [],
    location: [],
    event: [],
    evidence: [],
  }
  for (const n of nodes) groups[n.type].push(n)

  const typeOrder: NodeType[] = ['person', 'event', 'location', 'evidence']
  const cols = typeOrder.filter((t) => groups[t].length > 0)
  const colCount = cols.length || 1
  const colW = (CANVAS_W - GROUP_PADDING * 2) / colCount

  const result: LayoutNode[] = []
  cols.forEach((type, ci) => {
    const members = groups[type]
    const cx = GROUP_PADDING + ci * colW + colW / 2
    const totalH = members.length * (NODE_H + 24) - 24
    const startY = (CANVAS_H - totalH) / 2
    members.forEach((node, ri) => {
      result.push({ ...node, x: cx - NODE_W / 2, y: startY + ri * (NODE_H + 24) })
    })
  })
  return result
}

const NODE_STYLE: Record<NodeType, { fill: string; stroke: string; label: string }> = {
  person:   { fill: '#EDE9FE', stroke: '#7C3AED', label: 'Person' },
  location: { fill: '#D1FAE5', stroke: '#059669', label: 'Location' },
  event:    { fill: '#FEF3C7', stroke: '#D97706', label: 'Event' },
  evidence: { fill: '#DBEAFE', stroke: '#2563EB', label: 'Evidence' },
}

const NODE_STYLE_DARK: Record<NodeType, { fill: string; stroke: string }> = {
  person:   { fill: '#3B2063', stroke: '#A78BFA' },
  location: { fill: '#064E3B', stroke: '#34D399' },
  event:    { fill: '#451A03', stroke: '#FBBF24' },
  evidence: { fill: '#1E3A5F', stroke: '#60A5FA' },
}

function Defs() {
  return (
    <defs>
      <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M2 1L8 5L2 9" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </marker>
      <marker id="arr-user" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M2 1L8 5L2 9" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </marker>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000020" />
      </filter>
    </defs>
  )
}

function EdgeLine({
  edge,
  layoutNodes,
  selected,
  onClick,
}: {
  edge: GraphEdge
  layoutNodes: LayoutNode[]
  selected: boolean
  onClick: () => void
}) {
  const from = layoutNodes.find((n) => n.id === edge.From)
  const to = layoutNodes.find((n) => n.id === edge.to)
  if (!from || !to) return null

  const x1 = from.x + NODE_W / 2
  const y1 = from.y + NODE_H / 2
  const x2 = to.x + NODE_W / 2
  const y2 = to.y + NODE_H / 2

  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const ex2 = x2 - (dx / len) * (NODE_W / 2 + 4)
  const ey2 = y2 - (dy / len) * (NODE_H / 2 + 4)

  const isAI = edge.source === 'AI'
  const conf = edge.confidence ?? 1
  const strokeColor = selected ? '#818CF8' : isAI ? '#94A3B8' : '#6366F1'
  const strokeDash = isAI ? '5 3' : undefined
  const strokeW = selected ? 2 : 1.2
  const midX = (x1 + ex2) / 2
  const midY = (y1 + ey2) / 2

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <line x1={x1} y1={y1} x2={ex2} y2={ey2} stroke="transparent" strokeWidth={12} />
      <line
        x1={x1} y1={y1} x2={ex2} y2={ey2}
        stroke={strokeColor}
        strokeWidth={strokeW}
        strokeDasharray={strokeDash}
        markerEnd={`url(#${isAI ? 'arr' : 'arr-user'})`}
        opacity={0.5 + conf * 0.5}
      />
      {selected && (
        <text x={midX} y={midY - 8} fontSize={11} fill="#818CF8" textAnchor="middle" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
          {edge.type} · {isAI ? 'AI' : 'User'}
          {edge.confidence !== null ? ` · ${Math.round(conf * 100)}%` : ''}
        </text>
      )}
    </g>
  )
}

function NodeBox({
  node,
  selected,
  onClick,
  dark,
}: {
  node: LayoutNode
  selected: boolean
  onClick: () => void
  dark: boolean
}) {
  const style = dark ? NODE_STYLE_DARK[node.type] : { fill: NODE_STYLE[node.type].fill, stroke: NODE_STYLE[node.type].stroke }
  const strokeW = selected ? 2 : 1
  const MAX_LABEL = 17
  const label = node.label.length > MAX_LABEL ? node.label.slice(0, MAX_LABEL - 1) + '…' : node.label

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }} filter={selected ? 'url(#shadow)' : undefined}>
      <rect
        x={node.x} y={node.y}
        width={NODE_W} height={NODE_H}
        rx={NODE_RADIUS}
        fill={style.fill}
        stroke={style.stroke}
        strokeWidth={strokeW}
      />
      {node.source === 'USER' && (
        <rect x={node.x + NODE_W - 28} y={node.y + 4} width={22} height={13} rx={4} fill={dark ? '#3730A3' : '#EEF2FF'} />
      )}
      {node.source === 'USER' && (
        <text
          x={node.x + NODE_W - 17} y={node.y + 13}
          fontSize={9} fill={dark ? '#A5B4FC' : '#4F46E5'}
          textAnchor="middle" fontWeight={600}
          style={{ fontFamily: 'var(--font-mono, monospace)' }}
        >
          USR
        </text>
      )}
      <text
        x={node.x + 12} y={node.y + 16}
        fontSize={10} fill={style.stroke} fontWeight={600}
        style={{ fontFamily: 'var(--font-sans, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.06em' }}
      >
        {node.type}
      </text>
      <text
        x={node.x + 12} y={node.y + 35}
        fontSize={13} fill={dark ? '#F1F5F9' : '#0F172A'} fontWeight={500}
        style={{ fontFamily: 'var(--font-sans, sans-serif)' }}
      >
        {label}
      </text>
    </g>
  )
}

function ColumnHeader({ type, x, colW }: { type: NodeType; x: number; colW: number }) {
  const s = NODE_STYLE[type]
  return (
    <text
      x={x + colW / 2} y={28}
      fontSize={11} fill={s.stroke}
      textAnchor="middle" fontWeight={700} opacity={0.75}
      style={{ fontFamily: 'var(--font-sans, sans-serif)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
    >
      {s.label}s
    </text>
  )
}

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, opacity: 0.45 }}>
      <svg width={56} height={56} viewBox="0 0 56 56" fill="none">
        <circle cx={14} cy={14} r={8} stroke="currentColor" strokeWidth={1.5} />
        <circle cx={42} cy={14} r={8} stroke="currentColor" strokeWidth={1.5} />
        <circle cx={28} cy={42} r={8} stroke="currentColor" strokeWidth={1.5} />
        <line x1={22} y1={14} x2={34} y2={14} stroke="currentColor" strokeWidth={1} strokeDasharray="3 2" />
        <line x1={18} y1={20} x2={26} y2={36} stroke="currentColor" strokeWidth={1} strokeDasharray="3 2" />
        <line x1={38} y1={20} x2={30} y2={36} stroke="currentColor" strokeWidth={1} strokeDasharray="3 2" />
      </svg>
      <span style={{ fontSize: 13, fontFamily: 'var(--font-sans, sans-serif)' }}>No graph data for this case</span>
    </div>
  )
}

function Legend({ dark }: { dark: boolean }) {
  const types: NodeType[] = ['person', 'location', 'event', 'evidence']
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '10px 16px', borderTop: '1px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', borderRadius: '0 0 12px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, flexWrap: 'wrap' }}>
        {types.map((t) => {
          const fill = dark ? NODE_STYLE_DARK[t].fill : NODE_STYLE[t].fill
          const stroke = dark ? NODE_STYLE_DARK[t].stroke : NODE_STYLE[t].stroke
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: fill, border: `1.5px solid ${stroke}` }} />
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans, sans-serif)', textTransform: 'capitalize' }}>{t}</span>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={28} height={10}><line x1={0} y1={5} x2={28} y2={5} stroke="#94A3B8" strokeWidth={1.2} strokeDasharray="5 3" /></svg>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans, sans-serif)' }}>AI edge</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={28} height={10}><line x1={0} y1={5} x2={28} y2={5} stroke="#6366F1" strokeWidth={1.5} /></svg>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans, sans-serif)' }}>User edge</span>
        </div>
      </div>
    </div>
  )
}

function FilePreviewModal({ evidenceId, fileName, previewRoute, onClose }: {
  evidenceId: string
  fileName: string
  previewRoute: string
  onClose: () => void
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [contentType, setContentType] = useState('')
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
        setPreviewError('Failed to load file preview.')
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
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#1a1a1a', borderRadius: 12, width: '90vw', height: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '11px 18px', borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 6, background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                <rect x={1} y={1} width={9} height={12} rx={1.5} stroke="#60A5FA" strokeWidth={1} />
                <path d="M4 4h4M4 6.5h4M4 9h2.5" stroke="#60A5FA" strokeWidth={0.8} strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', fontFamily: 'var(--font-sans)' }}>{fileName}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, color: '#94a3b8', fontFamily: 'var(--font-sans)' }}
          >
            ✕ Close
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
          {loadingPreview && <p style={{ opacity: 0.5, color: '#e2e8f0', fontSize: 13, fontFamily: 'var(--font-sans)' }}>Loading preview…</p>}
          {previewError && <p style={{ color: '#f87171', fontSize: 13, fontFamily: 'var(--font-sans)' }}>{previewError}</p>}
          {blobUrl && isImage && <img src={blobUrl} alt={fileName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />}
          {blobUrl && isPdf && <iframe src={blobUrl} title={fileName} style={{ width: '100%', height: '100%', border: 'none' }} />}
          {blobUrl && !isImage && !isPdf && (
            <div style={{ color: '#e2e8f0', textAlign: 'center', padding: 32 }}>
              <p style={{ marginBottom: 12, opacity: 0.6, fontSize: 13, fontFamily: 'var(--font-sans)' }}>Preview not available for this file type.</p>
              <a href={blobUrl} download={fileName} style={{ display: 'inline-block', padding: '7px 16px', borderRadius: 6, background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', textDecoration: 'none', fontSize: 13, fontFamily: 'var(--font-sans)', border: '0.5px solid rgba(255,255,255,0.15)' }}>
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EvidenceList({ nodeId, allNodes, edges, previewRoute }: {
  nodeId: string
  allNodes: LayoutNode[]
  edges: GraphEdge[]
  previewRoute: string
}) {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    setLoading(true)
    setEvidence([])

    const thisNode = allNodes.find((n) => n.id === nodeId)
    const evidenceIds = new Set<string>()

    if (thisNode?.type === 'evidence') evidenceIds.add(thisNode.id)
    if (thisNode?.evidence_id) evidenceIds.add(thisNode.evidence_id)

    edges
      .filter((e) => e.From === nodeId || e.to === nodeId)
      .forEach((e) => {
        const otherId = e.From === nodeId ? e.to : e.From
        const other = allNodes.find((n) => n.id === otherId)
        if (other?.type === 'evidence') evidenceIds.add(other.id)
        if (other?.evidence_id) evidenceIds.add(other.evidence_id)
      })

    if (evidenceIds.size === 0) {
      setLoading(false)
      return
    }

    Promise.all(
      [...evidenceIds].map((id) =>
        api.get<EvidenceItem>(`/evidence/${id}`).then((r) => r.data).catch(() => null)
      )
    ).then((results) => {
      setEvidence(results.filter((r): r is EvidenceItem => r !== null))
      setLoading(false)
    })
  }, [nodeId, allNodes, edges, previewRoute])

  const iconForType = (ct?: string) => {
    if (!ct) return '📄'
    if (ct.startsWith('image/')) return '🖼'
    if (ct === 'application/pdf') return '📑'
    if (ct.includes('text')) return '📝'
    return '📄'
  }

  return (
    <>
      {preview && (
        <FilePreviewModal
          evidenceId={preview.id}
          fileName={preview.name}
          previewRoute={previewRoute}
          onClose={() => setPreview(null)}
        />
      )}
      <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', marginTop: 8, paddingTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-sans)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={11} height={11} viewBox="0 0 12 12" fill="none">
            <rect x={1} y={1} width={7} height={10} rx={1} stroke="currentColor" strokeWidth={1} />
            <path d="M3 4h3M3 6h3M3 8h2" stroke="currentColor" strokeWidth={0.8} strokeLinecap="round" />
          </svg>
          Evidence
        </div>
        {loading && <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)', padding: '4px 0' }}>Loading…</div>}
        {!loading && evidence.length === 0 && <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)', padding: '4px 0' }}>No linked evidence</div>}
        {evidence.map((ev) => (
          <div key={ev.file_id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <div style={{ width: 26, height: 26, borderRadius: 5, flexShrink: 0, background: 'var(--color-background-info)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
              {iconForType(ev.content_type)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ev.file_name}
              </div>
              {ev.processing_status && (
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)' }}>{ev.processing_status}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPreview({ id: ev.file_id, name: ev.file_name })}
              style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}
            >
              <svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                <circle cx={6} cy={6} r={2.5} stroke="currentColor" strokeWidth={1} />
                <path d="M1 6C2.5 3.5 4 2.5 6 2.5S9.5 3.5 11 6c-1.5 2.5-3 3.5-5 3.5S2.5 8.5 1 6Z" stroke="currentColor" strokeWidth={1} fill="none" />
              </svg>
              View
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

function DetailPanel({ node, edges, nodes, onClose, previewRoute }: {
  node: LayoutNode | null
  edges: GraphEdge[]
  nodes: LayoutNode[]
  onClose: () => void
  previewRoute: string
}) {
  if (!node) return null

  const connected = edges.filter((e) => e.From === node.id || e.to === node.id)
  const s = NODE_STYLE[node.type]

  return (
    <div style={{ position: 'absolute', top: 12, right: 12, width: 240, background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', zIndex: 10, maxHeight: 'calc(100% - 24px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 14px', background: s.fill, borderBottom: `1px solid ${s.stroke}22`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: s.stroke, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-sans)' }}>{node.type}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', marginTop: 2, fontFamily: 'var(--font-sans)' }}>{node.label}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.5, padding: 0, lineHeight: 1, color: 'inherit' }}>✕</button>
      </div>
      <div style={{ padding: '10px 14px', overflowY: 'auto', flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)', marginBottom: 8 }}>Source: {node.source}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Connections ({connected.length})
        </div>
        {connected.length === 0 && <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)' }}>No connections</div>}
        {connected.map((e) => {
          const otherId = e.From === node.id ? e.to : e.From
          const other = nodes.find((n) => n.id === otherId)
          const dir = e.From === node.id ? '→' : '←'
          return (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: '0.5px solid var(--color-border-tertiary)', fontSize: 12, fontFamily: 'var(--font-sans)' }}>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>{dir}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-primary)' }}>{other?.label ?? otherId}</span>
              {e.confidence !== null && <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{Math.round((e.confidence ?? 0) * 100)}%</span>}
            </div>
          )
        })}
        <EvidenceList nodeId={node.id} allNodes={nodes} edges={edges} previewRoute={previewRoute} />
      </div>
    </div>
  )
}

function Graph({ caseId, previewRoute = '/evidence/preview' }: GraphProps) {
  const [data, setData] = useState<GraphResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    api
      .get<GraphResponse>(`/graph/cases/${caseId}`)
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load graph data.'))
      .finally(() => setLoading(false))
  }, [caseId])

  const layoutNodes = data ? computeLayout(data.nodes) : []
  const selectedNode = layoutNodes.find((n) => n.id === selectedNodeId) ?? null

  const typeOrder: NodeType[] = ['person', 'event', 'location', 'evidence']
  const groups: Partial<Record<NodeType, boolean>> = {}
  for (const n of layoutNodes) groups[n.type] = true
  const activeCols = typeOrder.filter((t) => groups[t])
  const colCount = activeCols.length || 1
  const colW = (CANVAS_W - GROUP_PADDING * 2) / colCount

  const handleCanvasClick = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
  }, [])

  return (
    <section style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-background-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width={18} height={18} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
            <circle cx={4} cy={4} r={3} stroke="var(--color-text-secondary)" strokeWidth={1.2} />
            <circle cx={14} cy={4} r={3} stroke="var(--color-text-secondary)" strokeWidth={1.2} />
            <circle cx={9} cy={14} r={3} stroke="var(--color-text-secondary)" strokeWidth={1.2} />
            <line x1={7} y1={4} x2={11} y2={4} stroke="var(--color-text-secondary)" strokeWidth={1} />
            <line x1={5.5} y1={6.5} x2={7.5} y2={11.5} stroke="var(--color-text-secondary)" strokeWidth={1} />
            <line x1={12.5} y1={6.5} x2={10.5} y2={11.5} stroke="var(--color-text-secondary)" strokeWidth={1} />
          </svg>
          <span style={{ fontWeight: 500, fontSize: 14, fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)' }}>Evidence Graph</span>
          {data && (
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'var(--color-background-info)', color: 'var(--color-text-info)', fontFamily: 'var(--font-mono, monospace)' }}>
              {data.nodes.length} nodes · {data.edges.length} edges
            </span>
          )}
        </div>
        <button
          onClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null) }}
          style={{ background: 'none', border: '0.5px solid var(--color-border-secondary)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
        >
          Reset
        </button>
      </div>
      <div style={{ position: 'relative', overflowX: 'auto', overflowY: 'auto', minHeight: 400, maxHeight: 600 }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>Loading graph…</span>
          </div>
        )}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-danger)', fontFamily: 'var(--font-sans)' }}>{error}</span>
          </div>
        )}
        {!loading && !error && data && data.nodes.length === 0 && <EmptyState />}
        {!loading && !error && data && data.nodes.length > 0 && (
          <>
            <svg
              ref={svgRef}
              width={CANVAS_W}
              height={CANVAS_H}
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              style={{ display: 'block' }}
              onClick={handleCanvasClick}
            >
              <Defs />
              {activeCols.map((type, ci) => (
                <ColumnHeader key={type} type={type} x={GROUP_PADDING + ci * colW} colW={colW} />
              ))}
              {activeCols.slice(0, -1).map((_, ci) => (
                <line
                  key={ci}
                  x1={GROUP_PADDING + (ci + 1) * colW} y1={40}
                  x2={GROUP_PADDING + (ci + 1) * colW} y2={CANVAS_H - 20}
                  stroke={dark ? '#334155' : '#E2E8F0'}
                  strokeWidth={0.5}
                  strokeDasharray="4 4"
                />
              ))}
              {data.edges.map((edge) => (
                <EdgeLine
                  key={edge.id}
                  edge={edge}
                  layoutNodes={layoutNodes}
                  selected={selectedEdgeId === edge.id}
                  onClick={(e: any) => { e.stopPropagation(); setSelectedEdgeId(edge.id); setSelectedNodeId(null) }}
                />
              ))}
              {layoutNodes.map((node) => (
                <NodeBox
                  key={node.id}
                  node={node}
                  selected={selectedNodeId === node.id}
                  dark={dark}
                  onClick={(e: any) => { e.stopPropagation(); setSelectedNodeId(node.id); setSelectedEdgeId(null) }}
                />
              ))}
            </svg>
            <DetailPanel
              node={selectedNode}
              edges={data.edges}
              nodes={layoutNodes}
              onClose={() => setSelectedNodeId(null)}
              previewRoute={previewRoute}
            />
          </>
        )}
      </div>
      {!loading && !error && data && data.nodes.length > 0 && <Legend dark={dark} />}
    </section>
  )
}

export default Graph
