import type { DeadlineListItem } from './types'

type DeadlineItemCardProps = {
  item: DeadlineListItem
  onToggleStatus: (id: string) => void
  onOpen: (item: DeadlineListItem) => void
}

function priorityLabel(priority: number) {
  if (priority >= 4) return 'High'
  if (priority >= 2) return 'Medium'
  return 'Low'
}

export function DeadlineItemCard({
  item,
  onToggleStatus,
  onOpen,
}: DeadlineItemCardProps) {
  const isDone = item.status === 'done'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onToggleStatus(item.id)}
          className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border ${
            isDone
              ? 'border-slate-900 bg-slate-900'
              : 'border-slate-300 bg-white'
          } active:scale-95`}
          aria-label={isDone ? 'Mark as pending' : 'Mark as done'}
        >
          <span className="sr-only">
            {isDone ? 'Mark as pending' : 'Mark as done'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onOpen(item)}
          className="min-w-0 flex-1 rounded-xl text-left active:bg-slate-50"
        >
          <div className="flex items-start justify-between gap-3">
            <h3
              className={`text-sm font-semibold leading-5 ${
                isDone ? 'text-slate-400 line-through' : 'text-slate-900'
              }`}
            >
              {item.title}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${
                isDone
                  ? 'bg-slate-100 text-slate-500'
                  : item.priority >= 4
                    ? 'bg-rose-50 text-rose-700'
                    : item.priority >= 2
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
              }`}
            >
              {priorityLabel(item.priority)}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span>{item.dueAt}</span>
            <span>{isDone ? 'Done' : 'Pending'}</span>
            {item.courseName ? <span>{item.courseName}</span> : null}
          </div>
        </button>
      </div>
    </div>
  )
}
