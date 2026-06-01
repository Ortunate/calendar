import type { TimetableDay, TimetableEvent, TimetableSlot } from './types'
import { TimetableCell } from './TimetableCell'

type TimetableGridProps = {
  days: readonly TimetableDay[]
  slots: readonly TimetableSlot[]
  events: readonly TimetableEvent[]
  showWeekday: boolean
  showDate: boolean
  showSlotLabel: boolean
  showTime: boolean
  onSelectEvent: (event: TimetableEvent) => void
  onSelectEventGroup: (events: TimetableEvent[]) => void
}

function buildCellKey(dayKey: string, slotId: string) {
  return `${dayKey}:${slotId}`
}

function formatSlotTime(startTime: string, endTime: string) {
  if (startTime && endTime) return `${startTime}\n${endTime}`
  if (startTime || endTime) return startTime || endTime
  return 'time not set'
}

export function TimetableGrid({
  days,
  slots,
  events,
  showWeekday,
  showDate,
  showSlotLabel,
  showTime,
  onSelectEvent,
  onSelectEventGroup,
}: TimetableGridProps) {
  const eventMap = new Map<string, TimetableEvent[]>()

  events.forEach((event) => {
    const key = buildCellKey(event.dayKey, event.timeSlotId)
    const currentEvents = eventMap.get(key) ?? []

    eventMap.set(key, [...currentEvents, event])
  })

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-800">Week grid</h3>
          <span className="text-[11px] text-slate-500">Tap class for detail</span>
        </div>
      </div>

      <div className="px-2 py-2 sm:px-3 sm:py-3">
        <div className="w-full">
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: '58px repeat(7, minmax(0, 1fr))' }}
          >
            <div className="rounded-lg bg-slate-50 px-1 py-2 text-center text-[10px] font-medium text-slate-400">
              Slot
            </div>

            {days.map((day) => (
              <div
                key={day.key}
                className="rounded-lg bg-slate-50 px-1 py-2 text-center"
              >
                {showWeekday ? (
                  <div className="text-[10px] font-semibold text-slate-700">
                    {day.weekdayLabel}
                  </div>
                ) : null}
                {showDate ? (
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    {day.dateLabel}
                  </div>
                ) : null}
              </div>
            ))}

            {slots.map((slot) => (
              <div key={slot.id} className="contents">
                <div className="flex min-h-20 flex-col justify-center rounded-lg bg-slate-50 px-1 text-center">
                  {showSlotLabel || !showTime ? (
                    <span className="break-words text-[9px] font-semibold leading-3 text-slate-700">
                      {slot.label}
                    </span>
                  ) : null}
                  {showTime || !showSlotLabel ? (
                    <span className="mt-1 text-[9px] leading-3 text-slate-500">
                      {formatSlotTime(slot.startTime, slot.endTime)
                        .split('\n')
                        .map((part, index) => (
                          <span key={`${part}-${index}`} className="block">
                            {part}
                          </span>
                        ))}
                    </span>
                  ) : null}
                </div>

                {days.map((day) => (
                  <TimetableCell
                    key={buildCellKey(day.key, slot.id)}
                    events={eventMap.get(buildCellKey(day.key, slot.id))}
                    onSelectEvent={onSelectEvent}
                    onSelectEventGroup={onSelectEventGroup}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
