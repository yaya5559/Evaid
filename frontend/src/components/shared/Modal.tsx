import { useEffect } from 'react'

type ModalProps = {
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: string
}

export function Modal({ title, onClose, children, width = '480px' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: width,
          background: 'var(--admin-card-bg, #1a1a2e)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{title}</h3>
          <button type="button" onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.2rem', opacity: 0.5, color: 'inherit', lineHeight: 1,
          }}>✕</button>
        </div>
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
