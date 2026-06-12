import AiChatPanel from '../../components/ai/AiChatPanel'

/**
 * Employee home — a full-screen Gamyam AI workspace. The assistant answers
 * from live HR data, opens any page, and performs actions like applying for
 * leave (with a prefilled form confirmation step).
 */
export default function AiAssistant() {
  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] w-full max-w-[1400px] flex-col">
      <AiChatPanel />
    </div>
  )
}
