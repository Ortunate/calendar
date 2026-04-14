import type { ImportPreviewResult } from '../types'

type ImportPreviewListProps = {
  results: ImportPreviewResult[]
}

function statusClasses(status: ImportPreviewResult['status']) {
  switch (status) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50'
    case 'warning':
      return 'border-amber-200 bg-amber-50'
    case 'error':
      return 'border-rose-200 bg-rose-50'
  }
}

export function ImportPreviewList({ results }: ImportPreviewListProps) {
  return (
    <section className="space-y-3">
      {results.map((result, index) => (
        <article
          key={`${result.rawRow.title ?? 'row'}-${index}`}
          className={`rounded-2xl border p-4 ${statusClasses(result.status)}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Row {index + 1}
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-900">
                {String(result.rawRow.title ?? '').trim() || 'Untitled row'}
              </h3>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {result.status}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div>weekday: {String(result.rawRow.weekday ?? '') || '-'}</div>
            <div>
              slots: {String(result.rawRow.startSlot ?? '') || '-'} -{' '}
              {String(result.rawRow.endSlot ?? '') || '-'}
            </div>
            <div className="col-span-2">
              weeks: {String(result.rawRow.weeks ?? '') || '-'}
            </div>
          </div>

          {result.parsedRow ? (
            <div className="mt-3 rounded-xl border border-white/70 bg-white/70 px-3 py-3 text-xs text-slate-700">
              <p className="font-medium text-slate-900">Parsed</p>
              <p className="mt-1">
                Weekday {result.parsedRow.weekday} · Slots {result.parsedRow.startSlot}-
                {result.parsedRow.endSlot}
              </p>
              <p className="mt-1">Weeks: {result.parsedRow.weeks.join(', ')}</p>
              <p className="mt-1">
                Type: {result.parsedRow.type}
                {result.parsedRow.location ? ` · ${result.parsedRow.location}` : ''}
              </p>
            </div>
          ) : null}

          {result.warnings.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Warnings
              </p>
              <ul className="mt-1 space-y-1 text-sm text-amber-800">
                {result.warnings.map((warning, warningIndex) => (
                  <li key={`${warning.code}-${warningIndex}`}>{warning.message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.errors.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                Errors
              </p>
              <ul className="mt-1 space-y-1 text-sm text-rose-800">
                {result.errors.map((error, errorIndex) => (
                  <li key={`${error.code}-${errorIndex}`}>{error.message}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ))}
    </section>
  )
}
