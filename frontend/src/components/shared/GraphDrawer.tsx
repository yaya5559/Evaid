import { useNavigate } from 'react-router-dom'

interface GraphFABProps {
  graphPath: string
}

export function GraphFAB({ graphPath }: GraphFABProps) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate(graphPath)}
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 900,
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-secondary)',
        borderRadius: 10, padding: '10px 16px', cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
        fontSize: 13, fontWeight: 500,
        color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)',
        transition: 'box-shadow 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => {
        const b = e.currentTarget as HTMLButtonElement
        b.style.boxShadow = '0 6px 24px rgba(0,0,0,0.2)'
        b.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        const b = e.currentTarget as HTMLButtonElement
        b.style.boxShadow = '0 4px 16px rgba(0,0,0,0.14)'
        b.style.transform = 'translateY(0)'
      }}
    >
      <svg width={16} height={16} viewBox="0 0 18 18" fill="none">
        <circle cx={4} cy={4} r={3} stroke="currentColor" strokeWidth={1.3} />
        <circle cx={14} cy={4} r={3} stroke="currentColor" strokeWidth={1.3} />
        <circle cx={9} cy={14} r={3} stroke="currentColor" strokeWidth={1.3} />
        <line x1={7} y1={4} x2={11} y2={4} stroke="currentColor" strokeWidth={1.1} />
        <line x1={5.5} y1={6.5} x2={7.5} y2={11.5} stroke="currentColor" strokeWidth={1.1} />
        <line x1={12.5} y1={6.5} x2={10.5} y2={11.5} stroke="currentColor" strokeWidth={1.1} />
      </svg>
      Evidence Graph
    </button>
  )
}
