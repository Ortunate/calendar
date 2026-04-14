type ImportSummaryProps = {
  total: number
  successCount: number
  warningCount: number
  errorCount: number
}

export function ImportSummary({
  total,
  successCount,
  warningCount,
  errorCount,
}: ImportSummaryProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Preview summary</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Total
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{total}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
            Success
          </p>
          <p className="mt-1 text-lg font-semibold text-emerald-800">
            {successCount}
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">
            Warning
          </p>
          <p className="mt-1 text-lg font-semibold text-amber-800">
            {warningCount}
          </p>
        </div>
        <div className="rounded-xl bg-rose-50 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-rose-700">
            Error
          </p>
          <p className="mt-1 text-lg font-semibold text-rose-800">{errorCount}</p>
        </div>
      </div>
    </section>
  )
}
