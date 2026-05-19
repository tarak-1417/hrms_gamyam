import { useHrms } from '../../hooks/useHrms'

export default function Toast() {
  const { toast } = useHrms()
  if (!toast) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] rounded-xl bg-brand-black px-4 py-3 text-center text-sm font-medium text-white shadow-xl ring-1 ring-white/10 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm sm:text-left">
      {toast}
    </div>
  )
}
