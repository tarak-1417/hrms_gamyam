export default function DocumentPreview({ content, title }) {
  return (
    <div className="document-preview rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 bg-neutral-50/80 px-5 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Document preview</p>
        {title && <p className="mt-0.5 text-sm font-semibold text-foreground">{title}</p>}
      </div>
      <pre className="max-h-[min(60vh,480px)] overflow-y-auto whitespace-pre-wrap px-5 py-4 font-sans text-sm leading-relaxed text-foreground">
        {content}
      </pre>
    </div>
  )
}
