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
      <div className="h-full min-h-24 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-2">
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
      className="flex h-full min-h-24 w-full flex-col rounded-xl border px-2.5 py-2 text-left active:scale-[0.99] active:opacity-90"
      style={{
        backgroundColor: `${primaryEvent.color}18`,
        borderColor: `${primaryEvent.color}50`,
      }}
    >
      <span
        className="line-clamp-2 text-xs font-semibold leading-4 text-slate-900"
        title={primaryEvent.title}
      >
        {primaryEvent.title}
      </span>
      <span
        className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-600"
        title={primaryEvent.location}
      >
        {primaryEvent.location}
      </span>
      {extraCount > 0 ? (
        <span className="mt-2 text-[11px] font-medium text-slate-700">
          +{extraCount} more
        </span>
      ) : null}
    </button>
  )
}
