import type { TimetableEvent } from './types'

type EventDetailSheetProps = {
  event: TimetableEvent | null
  onClose: () => void
  onEdit?: (event: TimetableEvent) => void
  onAddWeeklyOccurrence?: (event: TimetableEvent) => void
  onManageExceptions?: (event: TimetableEvent) => void
  onDelete?: (eventId: string) => void
  onCancelOccurrence?: (event: TimetableEvent) => void
  onRelocateOccurrence?: (event: TimetableEvent) => void
  onRescheduleOccurrence?: (event: TimetableEvent) => void
  onAddExtraOccurrence?: (event: TimetableEvent) => void
}

export function EventDetailSheet({
  event,
  onClose,
  onEdit,
  onAddWeeklyOccurrence,
  onManageExceptions,
  onDelete,
  onCancelOccurrence,
  onRelocateOccurrence,
  onRescheduleOccurrence,
  onAddExtraOccurrence,
}: EventDetailSheetProps) {
  if (!event) {
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
              Event detail
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">
              {event.title}
            </h3>
          </div>
          <div className="flex gap-2">
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 active:opacity-90"
              >
                Edit
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(event.eventId)}
                className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 active:opacity-90"
              >
                Delete
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 active:bg-slate-200"
            >
              Close
            </button>
          </div>
        </div>

        <dl className="mt-4 space-y-3">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Type
            </dt>
            <dd className="mt-1 text-sm text-slate-800">{event.type}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Location
            </dt>
            <dd className="mt-1 text-sm text-slate-800">{event.location}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Note
            </dt>
            <dd className="mt-1 text-sm leading-6 text-slate-800">{event.note}</dd>
          </div>
        </dl>

        {onManageExceptions ? (
          <button
            type="button"
            onClick={() => onManageExceptions(event)}
            className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 active:bg-slate-50"
          >
            Manage exceptions
          </button>
        ) : null}

        {onAddWeeklyOccurrence ? (
          <button
            type="button"
            onClick={() => onAddWeeklyOccurrence(event)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 active:bg-slate-50"
          >
            Add another weekly occurrence
          </button>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {onCancelOccurrence ? (
            <button
              type="button"
              onClick={() => onCancelOccurrence(event)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 active:bg-slate-100"
            >
              Cancel this occurrence
            </button>
          ) : null}
          {onRelocateOccurrence ? (
            <button
              type="button"
              onClick={() => onRelocateOccurrence(event)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 active:bg-slate-100"
            >
              Relocate this occurrence
            </button>
          ) : null}
          {onRescheduleOccurrence ? (
            <button
              type="button"
              onClick={() => onRescheduleOccurrence(event)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 active:bg-slate-100"
            >
              Reschedule this occurrence
            </button>
          ) : null}
          {onAddExtraOccurrence ? (
            <button
              type="button"
              onClick={() => onAddExtraOccurrence(event)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 active:bg-slate-100"
            >
              Add extra occurrence
            </button>
          ) : null}
        </div>
      </section>
    </div>
  )
}
