import AiChatPanel from '../../components/ai/AiChatPanel'

/**
 * Dedicated AI assistant workspace. Available directly from the sidebar the
 * moment a user signs in — a full-screen home for working alongside Gamyam AI
 * (answering from live data, opening pages, and performing actions like leave
 * approvals or adding employees with a confirmation step).
 */
export default function Assistant() {
  return (
    <div className="flex h-[calc(100vh-8.5rem)] w-full flex-col">
      <AiChatPanel />
    </div>
  )
}
