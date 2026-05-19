import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronLeft, MessageCircle } from 'lucide-react'
import AiChatPanel, { RobotAvatar } from './AiChatPanel'

const HIDE_AFTER_MS = 5_000

export default function FloatingAiAssistant() {
  const [revealed, setRevealed] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const hideTimerRef = useRef(null)

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [])

  const scheduleHide = useCallback(() => {
    clearHideTimer()
    hideTimerRef.current = setTimeout(() => {
      setRevealed(false)
      hideTimerRef.current = null
    }, HIDE_AFTER_MS)
  }, [clearHideTimer])

  const handlePointerEnter = useCallback(() => {
    clearHideTimer()
    setRevealed(true)
  }, [clearHideTimer])

  const handlePointerLeave = useCallback(() => {
    scheduleHide()
  }, [scheduleHide])

  useEffect(() => () => clearHideTimer(), [clearHideTimer])

  if (chatOpen) {
    return (
      <>
        <button
          type="button"
          className="ai-backdrop fixed inset-0 z-40 bg-black/30 backdrop-blur-[3px]"
          onClick={() => setChatOpen(false)}
          aria-label="Close chat"
        />
        <div className="ai-panel fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
          <AiChatPanel compact onClose={() => setChatOpen(false)} />
        </div>
      </>
    )
  }

  return (
    <div
      className="ai-fab-host fixed bottom-4 right-0 z-50 h-[7.75rem] w-[4.75rem] sm:bottom-6"
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
    >
      <div
        className={`ai-fab-arrow-tab absolute bottom-0 right-0 flex h-12 w-9 items-center justify-center rounded-l-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/30 transition-all duration-300 ease-out ${
          revealed ? 'pointer-events-none scale-50 opacity-0' : 'scale-100 opacity-100'
        }`}
        aria-hidden={revealed}
        aria-label="Show AI assistant"
      >
        <ChevronLeft className="h-5 w-5" />
      </div>

      <div
        className={`ai-fab-wrap absolute bottom-0 right-10 flex w-full flex-col items-center gap-1.5 transition-all duration-300 ease-out ${
          revealed
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-2 scale-90 opacity-0'
        }`}
      >
        <div className="relative">
          <span className="ai-pulse-ring" aria-hidden />
          <span className="ai-pulse-ring ai-pulse-ring-delay" aria-hidden />
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            className="relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/50 ring-4 ring-white transition-transform duration-300 hover:scale-110 active:scale-95"
            aria-label="Open AI assistant"
          >
            <RobotAvatar pulsing bare />
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary shadow-md">
              <MessageCircle className="h-3 w-3 animate-pulse" />
            </span>
          </button>
        </div>
        
      </div>
    </div>
  )
}
