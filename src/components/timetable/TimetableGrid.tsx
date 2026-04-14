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

      <div className="overflow-x-auto px-3 py-3">
        <div className="min-w-[760px]">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: '70px repeat(7, minmax(88px, 1fr))' }}
          >
            <div className="rounded-xl bg-slate-50 px-2 py-3 text-center text-[11px] font-medium text-slate-400">
              Slot
            </div>

            {days.map((day) => (
              <div
                key={day.key}
                className="rounded-xl bg-slate-50 px-2 py-3 text-center"
              >
                {showWeekday ? (
                  <div className="text-[11px] font-semibold text-slate-700">
                    {day.weekdayLabel}
                  </div>
                ) : null}
                {showDate ? (
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {day.dateLabel}
                  </div>
                ) : null}
              </div>
            ))}

            {slots.map((slot) => (
              <div key={slot.id} className="contents">
                <div className="flex min-h-24 flex-col justify-center rounded-xl bg-slate-50 px-2 text-center">
                  {showSlotLabel || !showTime ? (
                    <span className="text-xs font-semibold text-slate-700">
                      {slot.label}
                    </span>
                  ) : null}
                  {showTime || !showSlotLabel ? (
                    <span className="mt-1 text-[11px] leading-4 text-slate-500">
                      {slot.startTime}
                      <br />
                      {slot.endTime}
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
