import type { EventException } from '../../types/event'
import type { TimetableEvent } from './types'

type EventExceptionManagerSheetProps = {
  event: TimetableEvent | null
  exceptions: EventException[]
  onClose: () => void
  onEdit: (exception: EventException) => void
  onDelete: (exception: EventException) => void
}

function formatExceptionTitle(actionType: EventException['actionType']) {
  switch (actionType) {
    case 'cancel':
      return 'Cancel'
    case 'relocate':
      return 'Relocate'
    case 'reschedule':
      return 'Reschedule'
    case 'extra':
      return 'Extra'
  }
}

export function EventExceptionManagerSheet({
  event,
  exceptions,
  onClose,
  onEdit,
  onDelete,
}: EventExceptionManagerSheetProps) {
  if (!event) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-3 pb-3">
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
              Manage exceptions
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">
              {event.title}
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
          {exceptions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No exceptions for this event yet.
            </div>
          ) : null}

          {exceptions.map((exception) => (
            <article
              key={exception.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatExceptionTitle(exception.actionType)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Original: {exception.originalDate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(exception)}
                    className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(exception)}
                    className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <dl className="mt-3 space-y-2">
                {exception.newDate ? (
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      New date
                    </dt>
                    <dd className="mt-1 text-sm text-slate-800">{exception.newDate}</dd>
                  </div>
                ) : null}
                {exception.newTimeSlotId ? (
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      New slot
                    </dt>
                    <dd className="mt-1 text-sm text-slate-800">
                      {exception.newTimeSlotId}
                    </dd>
                  </div>
                ) : null}
                {exception.newLocation ? (
                  <div>
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      New location
                    </dt>
                    <dd className="mt-1 text-sm text-slate-800">
                      {exception.newLocation}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Note
                  </dt>
                  <dd className="mt-1 text-sm text-slate-800">
                    {exception.note || 'No note'}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
