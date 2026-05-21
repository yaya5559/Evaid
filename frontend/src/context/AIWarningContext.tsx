import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { AIWarningModal } from '../components/shared/AIWarningModal'

const LS_DISABLED = 'evaid_ai_warning_disabled'
const SS_SHOWN    = 'evaid_ai_warning_shown'

interface AIWarningContextValue {
  openWarning: () => void
}

const AIWarningContext = createContext<AIWarningContextValue>({ openWarning: () => {} })

export function useAIWarning() {
  return useContext(AIWarningContext)
}

export function AIWarningProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (loading || !user) return
    const disabled = localStorage.getItem(LS_DISABLED) === 'true'
    const shownThisSession = sessionStorage.getItem(SS_SHOWN) === 'true'
    if (!disabled && !shownThisSession) {
      setIsOpen(true)
    }
  }, [user, loading])

  const openWarning = () => setIsOpen(true)

  const handleAccept = (disableAutoShow: boolean) => {
    if (disableAutoShow) localStorage.setItem(LS_DISABLED, 'true')
    sessionStorage.setItem(SS_SHOWN, 'true')
    setIsOpen(false)
  }

  return (
    <AIWarningContext.Provider value={{ openWarning }}>
      {children}
      <AIWarningModal isOpen={isOpen} onAccept={handleAccept} showDisableOption />
    </AIWarningContext.Provider>
  )
}
