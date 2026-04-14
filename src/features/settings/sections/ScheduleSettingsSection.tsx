import type { TimeSlot } from '../../../types/schedule'

export type TimeSlotFormValues = {
  id?: string
  label: string
  startTime: string
  endTime: string
  startUnit: number
  endUnit: number
  order: number
}

type ScheduleSettingsSectionProps = {
  currentProfileName: string
  timeSlots: TimeSlot[]
  timeSlotForm: TimeSlotFormValues
  editingTimeSlotId: string | null
  onEditTimeSlot: (slot: TimeSlot) => void
  onTimeSlotFormChange: (updater: (current: TimeSlotFormValues) => TimeSlotFormValues) => void
  onSaveTimeSlot: () => void
  onResetTimeSlotForm: () => void
}

export function ScheduleSettingsSection({
  currentProfileName,
  timeSlots,
  timeSlotForm,
  editingTimeSlotId,
  onEditTimeSlot,
  onTimeSlotFormChange,
  onSaveTimeSlot,
  onResetTimeSlotForm,
}: ScheduleSettingsSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Schedule profile / TimeSlot
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            View current schedule profile and manage class periods.
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
          {currentProfileName}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {timeSlots.map((slot) => (
          <div
            key={slot.id}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{slot.label}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {slot.startTime} - {slot.endTime} | order {slot.order}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onEditTimeSlot(slot)}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 active:bg-slate-200"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
        <h3 className="text-sm font-semibold text-slate-900">
          {editingTimeSlotId ? 'Edit time slot' : 'Add time slot'}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-600">Label</span>
            <input
              value={timeSlotForm.label}
              onChange={(event) =>
                onTimeSlotFormChange((current) => ({
                  ...current,
                  label: event.target.value,
                }))
              }
              placeholder="e.g. 1-2"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            />
            <span className="block text-[11px] leading-5 text-slate-500">
              Short text shown in the row header.
            </span>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-600">Order</span>
            <input
              type="number"
              min={1}
              value={timeSlotForm.order}
              onChange={(event) =>
                onTimeSlotFormChange((current) => ({
                  ...current,
                  order: Number(event.target.value) || 1,
                }))
              }
              placeholder="Order"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            />
            <span className="block text-[11px] leading-5 text-slate-500">
              Smaller numbers appear earlier in the day.
            </span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-600">Start time</span>
            <input
              type="time"
              value={timeSlotForm.startTime}
              onChange={(event) =>
                onTimeSlotFormChange((current) => ({
                  ...current,
                  startTime: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            />
            <span className="block text-[11px] leading-5 text-slate-500">
              When this row begins on the clock.
            </span>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-600">End time</span>
            <input
              type="time"
              value={timeSlotForm.endTime}
              onChange={(event) =>
                onTimeSlotFormChange((current) => ({
                  ...current,
                  endTime: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            />
            <span className="block text-[11px] leading-5 text-slate-500">
              When this row ends on the clock.
            </span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-600">Start unit</span>
            <input
              type="number"
              min={1}
              value={timeSlotForm.startUnit}
              onChange={(event) =>
                onTimeSlotFormChange((current) => ({
                  ...current,
                  startUnit: Number(event.target.value) || 1,
                }))
              }
              placeholder="Start unit"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            />
            <span className="block text-[11px] leading-5 text-slate-500">
              First period number in this slot.
            </span>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-600">End unit</span>
            <input
              type="number"
              min={1}
              value={timeSlotForm.endUnit}
              onChange={(event) =>
                onTimeSlotFormChange((current) => ({
                  ...current,
                  endUnit: Number(event.target.value) || 1,
                }))
              }
              placeholder="End unit"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            />
            <span className="block text-[11px] leading-5 text-slate-500">
              Last period number in this slot.
            </span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onSaveTimeSlot}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white active:opacity-90"
          >
            {editingTimeSlotId ? 'Save changes' : 'Add time slot'}
          </button>
          <button
            type="button"
            onClick={onResetTimeSlotForm}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 active:bg-slate-100"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  )
}
