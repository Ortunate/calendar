import type { TimetableEvent } from './types'

type EventSelectionSheetProps = {
  events: TimetableEvent[]
  onClose: () => void
  onSelect: (event: TimetableEvent) => void
}

export function EventSelectionSheet({
  events,
  onClose,
  onSelect,
}: EventSelectionSheetProps) {
  if (events.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-3 pb-3">
      <div
        className="absolute inset-0 -top-[100vh] bg-slate-900/20"
        onClick={onClose}
        aria-hidden="true"
      />
      <section className="relative rounded-3xl border border-slate-200 bg-white p-4 shadow-lg">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Cell events
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">
              {events.length} events in this slot
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelect(event)}
              className="w-full rounded-2xl border px-3 py-3 text-left"
              style={{
                backgroundColor: `${event.color}14`,
                borderColor: `${event.color}40`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {event.title}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-600">
                    {event.location || 'No location'}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-slate-500">
                  {event.type}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
