type TimetableHeaderProps = {
  semesterName: string
  currentWeekLabel: string
  showWeekday: boolean
  showDate: boolean
  showSlotLabel: boolean
  showTime: boolean
  onPrevWeek: () => void
  onNextWeek: () => void
  onToggleWeekday: () => void
  onToggleDate: () => void
  onToggleSlotLabel: () => void
  onToggleTime: () => void
}

type ToggleChipProps = {
  label: string
  active: boolean
  onClick: () => void
}

function ToggleChip({ label, active, onClick }: ToggleChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[11px] font-medium ${
        active
          ? 'border-slate-900 bg-slate-900 text-white'
          : 'border-slate-200 bg-white text-slate-500 active:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}

export function TimetableHeader({
  semesterName,
  currentWeekLabel,
  showWeekday,
  showDate,
  showSlotLabel,
  showTime,
  onPrevWeek,
  onNextWeek,
  onToggleWeekday,
  onToggleDate,
  onToggleSlotLabel,
  onToggleTime,
}: TimetableHeaderProps) {
  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Current semester
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              {semesterName}
            </h2>
          </div>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            {currentWeekLabel}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onPrevWeek}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 active:bg-slate-100"
          >
            Prev week
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 active:bg-slate-100"
          >
            Next week
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap gap-2">
          <ToggleChip
            label="Weekday"
            active={showWeekday}
            onClick={onToggleWeekday}
          />
          <ToggleChip label="Date" active={showDate} onClick={onToggleDate} />
          <ToggleChip
            label="Slot"
            active={showSlotLabel}
            onClick={onToggleSlotLabel}
          />
          <ToggleChip label="Time" active={showTime} onClick={onToggleTime} />
        </div>
      </section>
    </div>
  )
}
