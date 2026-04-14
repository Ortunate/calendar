import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Event } from '../../types/event'
import type { RecurringEventRule, WeekMode, Weekday } from '../../types/schedule'

type TimeSlotOption = {
  id: string
  label: string
  startTime: string
  endTime: string
  startUnit?: number
  endUnit?: number
}

type EventFormValues = {
  title: string
  location: string
  weekday: Weekday
  timeSlot: string
  startWeek: number
  endWeek: number
  weekMode: WeekMode
  customWeeks: number[]
  color: string
  note: string
}

type EventFormErrors = Partial<Record<keyof EventFormValues, string>>

export type EventFormPayload = {
  event: Event
  recurringRule: RecurringEventRule
}

export type EventFormInitialValues = {
  event: Event
  recurringRule: RecurringEventRule
}

type EventFormProps = {
  timeSlots: readonly TimeSlotOption[]
  totalWeeks: number
  semesterId?: string
  mode?: 'create' | 'edit' | 'append'
  initialValues?: EventFormInitialValues | null
  onSubmit?: (payload: EventFormPayload) => void
}

const WEEKDAY_OPTIONS: Array<{ value: Weekday; label: string }> = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
]

const DEFAULT_VALUES: EventFormValues = {
  title: '',
  location: '',
  weekday: 1,
  timeSlot: '',
  startWeek: 1,
  endWeek: 16,
  weekMode: 'all',
  customWeeks: [],
  color: '#2563eb',
  note: '',
}

function buildInitialValues(totalWeeks: number, timeSlots: readonly TimeSlotOption[]) {
  return {
    ...DEFAULT_VALUES,
    endWeek: totalWeeks,
    timeSlot: timeSlots[0]?.id ?? '',
  }
}

function buildValuesFromInitialValues(
  initialValues: EventFormInitialValues,
  totalWeeks: number,
  timeSlots: readonly TimeSlotOption[],
): EventFormValues {
  const fallbackValues = buildInitialValues(totalWeeks, timeSlots)
  const validTimeSlot = timeSlots.some(
    (timeSlot) => timeSlot.id === initialValues.recurringRule.timeSlotId,
  )

  return {
    title: initialValues.event.title,
    location: initialValues.event.location,
    weekday: initialValues.recurringRule.weekday,
    timeSlot: validTimeSlot
      ? initialValues.recurringRule.timeSlotId
      : fallbackValues.timeSlot,
    startWeek: initialValues.recurringRule.startWeek,
    endWeek: initialValues.recurringRule.endWeek,
    weekMode: initialValues.recurringRule.weekMode,
    customWeeks: [...initialValues.recurringRule.customWeeks],
    color: initialValues.event.color,
    note: initialValues.event.note,
  }
}

function toggleWeek(currentWeeks: number[], week: number) {
  return currentWeeks.includes(week)
    ? currentWeeks.filter((item) => item !== week)
    : [...currentWeeks, week].sort((left, right) => left - right)
}

function validate(values: EventFormValues): EventFormErrors {
  const errors: EventFormErrors = {}

  if (!values.title.trim()) {
    errors.title = 'Title is required.'
  }

  if (!values.timeSlot) {
    errors.timeSlot = 'Choose a TimeSlot first.'
  }

  if (values.startWeek > values.endWeek) {
    errors.startWeek = 'Start week must be before or equal to end week.'
    errors.endWeek = 'End week must be after or equal to start week.'
  }

  if (values.weekMode === 'custom' && values.customWeeks.length === 0) {
    errors.customWeeks = 'Select at least one week in custom mode.'
  }

  return errors
}

export function EventForm({
  timeSlots,
  totalWeeks,
  semesterId = 'semester-placeholder',
  mode = 'create',
  initialValues = null,
  onSubmit,
}: EventFormProps) {
  const [values, setValues] = useState<EventFormValues>(() =>
    initialValues
      ? buildValuesFromInitialValues(initialValues, totalWeeks, timeSlots)
      : buildInitialValues(totalWeeks, timeSlots),
  )
  const [errors, setErrors] = useState<EventFormErrors>({})
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [submittedPayload, setSubmittedPayload] = useState<EventFormPayload | null>(
    null,
  )

  useEffect(() => {
    setValues(
      initialValues
        ? buildValuesFromInitialValues(initialValues, totalWeeks, timeSlots)
        : buildInitialValues(totalWeeks, timeSlots),
    )
    setErrors({})
    setSubmittedPayload(null)
  }, [initialValues, timeSlots, totalWeeks])

  useEffect(() => {
    if (values.weekMode !== 'custom') {
      return
    }

    setValues((current) => ({
      ...current,
      customWeeks: current.customWeeks.filter(
        (week) => week >= current.startWeek && week <= current.endWeek,
      ),
    }))
  }, [values.endWeek, values.startWeek, values.weekMode])

  const selectableWeeks = useMemo(() => {
    if (values.startWeek > values.endWeek) {
      return []
    }

    return Array.from(
      { length: values.endWeek - values.startWeek + 1 },
      (_, index) => values.startWeek + index,
    )
  }, [values.endWeek, values.startWeek])

  function updateField<K extends keyof EventFormValues>(
    field: K,
    nextValue: EventFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: nextValue,
    }))

    setErrors((current) => {
      if (!current[field]) {
        return current
      }

      return {
        ...current,
        [field]: undefined,
      }
    })
  }

  function handleWeekModeChange(nextMode: WeekMode) {
    setValues((current) => {
      const nextCustomWeeks =
        nextMode === 'custom'
          ? current.customWeeks.length > 0
            ? current.customWeeks.filter(
                (week) => week >= current.startWeek && week <= current.endWeek,
              )
            : Array.from(
                { length: current.endWeek - current.startWeek + 1 },
                (_, index) => current.startWeek + index,
              )
          : []

      return {
        ...current,
        weekMode: nextMode,
        customWeeks: nextCustomWeeks,
      }
    })
    setErrors((current) => ({
      ...current,
      weekMode: undefined,
      customWeeks: undefined,
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validate(values)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const timestamp = new Date().toISOString()
    const eventId = initialValues?.event.id ?? 'event-preview'

    const payload: EventFormPayload = {
      event: {
        id: eventId,
        title: values.title.trim(),
        type: 'course',
        location: values.location.trim(),
        description: '',
        note: values.note.trim(),
        color: values.color,
        priority: 2,
        semesterId,
        isAllDay: false,
        createdAt: initialValues?.event.createdAt ?? timestamp,
        updatedAt: timestamp,
      },
      recurringRule: {
        id: initialValues?.recurringRule.id ?? 'rule-preview',
        eventId,
        weekday: values.weekday,
        timeSlotId: values.timeSlot,
        startWeek: values.startWeek,
        endWeek: values.endWeek,
        weekMode: values.weekMode,
        customWeeks:
          values.weekMode === 'custom' ? values.customWeeks : [],
      },
    }

    setSubmittedPayload(payload)
    setErrors({})
    onSubmit?.(payload)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {mode === 'edit' ? 'Edit course event' : 'New course event'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {mode === 'edit'
                ? 'Update the event body and repeat rule together.'
                : mode === 'append'
                  ? 'Reuse this course and add one more weekly rule.'
                  : 'Fast entry first, repeat rule included.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600 active:bg-slate-100"
          >
            {showAdvanced ? 'Hide advanced' : 'Show advanced'}
          </button>
        </div>
      </div>

      <form className="space-y-4 px-4 py-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600" htmlFor="event-title">
            Title
          </label>
          <input
            id="event-title"
            value={values.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="e.g. Advanced Math"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
          />
          {errors.title ? (
            <p className="text-xs text-rose-600">{errors.title}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label
            className="text-xs font-medium text-slate-600"
            htmlFor="event-location"
          >
            Location
          </label>
          <input
            id="event-location"
            value={values.location}
            onChange={(event) => updateField('location', event.target.value)}
            placeholder="e.g. A-203"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600" htmlFor="event-weekday">
              Weekday
            </label>
            <select
              id="event-weekday"
              value={values.weekday}
              onChange={(event) =>
                updateField('weekday', Number(event.target.value) as Weekday)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none"
            >
              {WEEKDAY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-600">Time slot</span>
            {timeSlots.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {timeSlots.map((slot) => {
                  const selected = values.timeSlot === slot.id

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => updateField('timeSlot', slot.id)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-sm ${
                        selected
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 active:bg-slate-50'
                      }`}
                    >
                      <div className="font-medium">{slot.label}</div>
                      <div
                        className={`mt-1 text-xs ${
                          selected ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        {slot.startTime}-{slot.endTime}
                        {typeof slot.startUnit === 'number' &&
                        typeof slot.endUnit === 'number'
                          ? ` · units ${slot.startUnit}-${slot.endUnit}`
                          : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-700">
                No TimeSlot available yet. Add periods in Settings first.
              </div>
            )}
            {errors.timeSlot ? (
              <p className="text-xs text-rose-600">{errors.timeSlot}</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-slate-600"
              htmlFor="event-start-week"
            >
              Start week
            </label>
            <input
              id="event-start-week"
              type="number"
              min={1}
              max={totalWeeks}
              value={values.startWeek}
              onChange={(event) =>
                updateField('startWeek', Number(event.target.value) || 1)
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
            />
            {errors.startWeek ? (
              <p className="text-xs text-rose-600">{errors.startWeek}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-slate-600"
              htmlFor="event-end-week"
            >
              End week
            </label>
            <input
              id="event-end-week"
              type="number"
              min={1}
              max={totalWeeks}
              value={values.endWeek}
              onChange={(event) =>
                updateField('endWeek', Number(event.target.value) || 1)
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
            />
            {errors.endWeek ? (
              <p className="text-xs text-rose-600">{errors.endWeek}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium text-slate-600">Week mode</span>
          <div className="grid grid-cols-4 gap-2">
            {(['all', 'odd', 'even', 'custom'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleWeekModeChange(mode)}
                className={`rounded-xl border px-2 py-2 text-xs font-medium ${
                  values.weekMode === mode
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600 active:bg-slate-100'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {values.weekMode === 'custom' ? (
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div>
              <p className="text-xs font-medium text-slate-700">Custom weeks</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Select exact weeks within the chosen range.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {selectableWeeks.map((week) => {
                const selected = values.customWeeks.includes(week)

                return (
                  <button
                    key={week}
                    type="button"
                    onClick={() =>
                      updateField('customWeeks', toggleWeek(values.customWeeks, week))
                    }
                    className={`rounded-xl border px-2 py-2 text-xs font-medium ${
                      selected
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 active:bg-slate-50'
                    }`}
                  >
                    W{week}
                  </button>
                )
              })}
            </div>

            {errors.customWeeks ? (
              <p className="text-xs text-rose-600">{errors.customWeeks}</p>
            ) : null}
          </div>
        ) : null}

        {showAdvanced ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <div className="space-y-1.5">
                <label
                  className="text-xs font-medium text-slate-600"
                  htmlFor="event-color"
                >
                  Color
                </label>
                <input
                  id="event-color"
                  type="text"
                  value={values.color}
                  onChange={(event) => updateField('color', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
                />
              </div>
              <input
                type="color"
                value={values.color}
                onChange={(event) => updateField('color', event.target.value)}
                className="h-11 w-14 rounded-xl border border-slate-200 bg-white p-1"
                aria-label="Choose event color"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600" htmlFor="event-note">
                Note
              </label>
              <textarea
                id="event-note"
                value={values.note}
                onChange={(event) => updateField('note', event.target.value)}
                rows={3}
                placeholder="Optional note"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
              />
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white active:opacity-90"
        >
          {mode === 'edit'
            ? 'Save changes'
            : mode === 'append'
              ? 'Add weekly occurrence'
              : 'Create course event'}
        </button>
      </form>

      {submittedPayload ? (
        <div className="border-t border-slate-200 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Payload preview</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
              Local only
            </span>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-3 text-[11px] leading-5 text-slate-100">
            {JSON.stringify(submittedPayload, null, 2)}
          </pre>
        </div>
      ) : null}
    </section>
  )
}
