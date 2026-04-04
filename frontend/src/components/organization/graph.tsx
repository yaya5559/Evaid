import React, { useEffect } from "react";
import {
    type Node, type Edge,
    ReactFlow, Background, Controls, MiniMap,
    useNodesState, useEdgesState,
    BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { getGraph } from "../../helpers/api-communicators";

type ApiNode = { id: string; label: string; type: string }
type ApiEdge = { id: string; from: string; to: string; evidence_title: string; evidence_id: string }

const TYPE_COLOR: Record<string, string> = {
    email:        '#3b82f6',
    ip_address:   '#ef4444',
    phone_number: '#22c55e',
    url:          '#f97316',
}

const TYPE_ICON: Record<string, string> = {
    email:        '✉',
    ip_address:   '🖥',
    phone_number: '📞',
    url:          '🔗',
}

// circular layout — spreads nodes evenly around a circle
function circularPosition(index: number, total: number): { x: number; y: number } {
    const radius = Math.max(180, total * 55)
    const angle  = (2 * Math.PI * index) / total - Math.PI / 2
    return {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
    }
}

function toRFNode(n: ApiNode, index: number, total: number): Node {
    const color = TYPE_COLOR[n.type] ?? '#8b5cf6'
    const icon  = TYPE_ICON[n.type]  ?? '?'
    const pos   = circularPosition(index, total)
    return {
        id:       n.id,
        position: pos,
        data:     { label: `${icon}  ${n.label}` },
        style: {
            background:   color,
            color:        '#fff',
            border:       '2px solid rgba(255,255,255,0.3)',
            borderRadius: 10,
            padding:      '8px 14px',
            fontSize:     12,
            fontWeight:   500,
            maxWidth:     180,
            wordBreak:    'break-all',
            boxShadow:    '0 2px 8px rgba(0,0,0,0.18)',
        },
    }
}

function toRFEdge(e: ApiEdge): Edge {
    return {
        id:         e.id,
        source:     e.from,
        target:     e.to,
        label:      e.evidence_title ?? 'shared evidence',
        type:       'smoothstep',
        animated:   true,
        style:      { stroke: '#cbd5e1', strokeWidth: 2 },
        labelStyle: { fontSize: 10, fill: '#64748b', fontWeight: 500 },
        labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.85 },
        labelBgPadding: [4, 6],
        labelBgBorderRadius: 4,
    }
}

function EmptyState() {
    return (
        <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
            color: '#94a3b8',
        }}>
            <span style={{ fontSize: 48 }}>🕸️</span>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>No signals found</p>
            <p style={{ margin: 0, fontSize: 13 }}>
                Upload and process evidence to see the signal graph.
            </p>
        </div>
    )
}

function Graph({ case_id }: { case_id: string }) {
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [selected, setSelected] = React.useState<ApiNode | null>(null)
    const [loading, setLoading] = React.useState(true)

    useEffect(() => {
        if (!case_id) return
        setLoading(true)
        getGraph(case_id)
            .then(({ data }) => {
                const total = data.nodes.length
                setNodes(data.nodes.map((n: ApiNode, i: number) => toRFNode(n, i, total)))
                setEdges(data.edges.map(toRFEdge))
            })
            .catch((err: unknown) => console.error('Failed to fetch graph:', err))
            .finally(() => setLoading(false))
    }, [case_id])

    if (loading) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', color: '#94a3b8', fontSize: 14 }}>
                Loading graph...
            </div>
        )
    }

    if (nodes.length === 0) return <EmptyState />

    return (
        <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ flex: 1 }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    fitViewOptions={{ padding: 0.3 }}
                    onNodeClick={(_: React.MouseEvent, node: Node) => {
                        setSelected({
                            id:    node.id,
                            label: String(node.data.label),
                            type:  node.id.split('::')[0],
                        })
                    }}
                    onPaneClick={() => setSelected(null)}
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} color="#e2e8f0" />
                    <Controls />
                    <MiniMap nodeColor={(n) => TYPE_COLOR[n.id.split('::')[0]] ?? '#8b5cf6'} />
                </ReactFlow>
            </div>

            {/* side panel */}
            {selected && (
                <div style={{
                    width: 240, padding: 20,
                    borderLeft: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>Signal Details</span>
                        <button onClick={() => setSelected(null)}
                            style={{ background: 'none', border: 'none',
                                     cursor: 'pointer', fontSize: 16, color: '#94a3b8' }}>✕</button>
                    </div>
                    <div style={{
                        background: TYPE_COLOR[selected.type] ?? '#8b5cf6',
                        color: '#fff', borderRadius: 8, padding: '10px 14px',
                    }}>
                        <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
                            {selected.type.replace('_', ' ')}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, wordBreak: 'break-all' }}>
                            {selected.label.replace(/^.\s+/, '')}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Graph
