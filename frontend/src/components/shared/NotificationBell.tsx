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
        aria-label={`Notifications${unseenCount > 0 ? ` (${unseenCount} new)` : ''}`}
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
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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
