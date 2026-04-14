import type { DeadlineListItem } from './types'

function priorityLabel(priority: number) {
  if (priority >= 4) return 'high'
  if (priority >= 2) return 'medium'
  return 'low'
}

type DeadlineDetailSheetProps = {
  item: DeadlineListItem | null
  onClose: () => void
  onEdit?: (item: DeadlineListItem) => void
  onDelete?: (id: string) => void
}

export function DeadlineDetailSheet({
  item,
  onClose,
  onEdit,
  onDelete,
}: DeadlineDetailSheetProps) {
  if (!item) {
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
              Deadline detail
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">
              {item.title}
            </h3>
          </div>
          <div className="flex gap-2">
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 active:opacity-90"
              >
                Edit
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(item.id)}
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
              Due
            </dt>
            <dd className="mt-1 text-sm text-slate-800">{item.dueAt}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Priority
            </dt>
            <dd className="mt-1 text-sm text-slate-800">{priorityLabel(item.priority)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Status
            </dt>
            <dd className="mt-1 text-sm text-slate-800">{item.status}</dd>
          </div>
          {item.courseName ? (
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Course
              </dt>
              <dd className="mt-1 text-sm text-slate-800">{item.courseName}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Description
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">
              {item.description}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Note
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">
              {item.note}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
