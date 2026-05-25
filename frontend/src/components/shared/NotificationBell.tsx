import { useSignals } from '../../context/SignalContext'
import '../../styles/Signals.css'

export function NotificationBell() {
  const { unseenCount, openPanel } = useSignals()

  return (
    <div className="signal-nc-wrapper">
      <button
        type="button"
        className="signal-nc-bell"
        onClick={openPanel}
        aria-label={`Signals${unseenCount > 0 ? ` (${unseenCount} new)` : ''}`}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* radar / signal arcs */}
          <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
          <path d="M8.5 8.5a5 5 0 0 0 0 7" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M5.5 5.5a9 9 0 0 0 0 13" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
        {unseenCount > 0 && (
          <span className="signal-nc-badge">
            {unseenCount > 99 ? '99+' : unseenCount}
          </span>
        )}
      </button>
    </div>
  )
}
