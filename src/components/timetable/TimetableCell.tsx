import type { TimetableEvent } from './types'

type TimetableCellProps = {
  events?: readonly TimetableEvent[]
  onSelectEvent: (event: TimetableEvent) => void
  onSelectEventGroup: (events: TimetableEvent[]) => void
}

export function TimetableCell({
  events = [],
  onSelectEvent,
  onSelectEventGroup,
}: TimetableCellProps) {
  const primaryEvent = events[0]
  const extraCount = Math.max(events.length - 1, 0)

  if (!primaryEvent) {
    return (
      <div className="h-full min-h-20 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-1">
        <div className="text-[11px] text-slate-300"> </div>
      </div>
    )
  }

  function handleClick() {
    if (events.length > 1) {
      onSelectEventGroup([...events])
      return
    }

    onSelectEvent(primaryEvent)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex h-full min-h-20 w-full flex-col rounded-lg border px-1.5 py-1.5 text-left active:scale-[0.99] active:opacity-90"
      style={{
        backgroundColor: `${primaryEvent.color}18`,
        borderColor: `${primaryEvent.color}50`,
      }}
    >
      <span
        className="line-clamp-2 text-[10px] font-semibold leading-3.5 text-slate-900"
        title={primaryEvent.title}
      >
        {primaryEvent.title}
      </span>
      {extraCount > 0 ? (
        <span className="mt-1 text-[10px] font-medium text-slate-700">
          +{extraCount} more
        </span>
      ) : null}
    </button>
  )
}
