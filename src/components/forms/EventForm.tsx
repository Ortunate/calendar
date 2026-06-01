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
  description: string
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

export type EventFormSubmitOptions = {
  addAnother: boolean
}

export type EventFormInitialValues = {
  event: Event
  recurringRule: RecurringEventRule
}

type EventFormProps = {
  timeSlots: readonly TimeSlotOption[]
  totalWeeks: number
  semesterId?: string
  currentVisibleWeek?: number | null
  mode?: 'create' | 'edit' | 'append'
  initialValues?: EventFormInitialValues | null
  onSubmit?: (payload: EventFormPayload, options: EventFormSubmitOptions) => void
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
  description: '',
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
    description: initialValues.event.description,
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

function clampWeek(value: number, totalWeeks: number) {
  return Math.min(Math.max(value, 1), totalWeeks)
}

function parseWeekInput(value: string, fallback: number, totalWeeks: number) {
  const digits = value.replace(/[^\d]/g, '')

  if (!digits) {
    return fallback
  }

  return clampWeek(Number(digits), totalWeeks)
}

function formatWeekSummary(values: EventFormValues) {
  if (values.weekMode === 'custom') {
    return values.customWeeks.length > 0
      ? `Custom weeks ${values.customWeeks.join(', ')}`
      : 'Custom weeks not selected'
  }

  return `Weeks ${values.startWeek}-${values.endWeek}`
}

function getWeekdayLabel(weekday: Weekday) {
  return WEEKDAY_OPTIONS.find((option) => option.value === weekday)?.label ?? 'Mon'
}

function formatTimeSlotDetail(slot: TimeSlotOption) {
  const timeText =
    slot.startTime && slot.endTime
      ? `${slot.startTime}-${slot.endTime}`
      : slot.startTime || slot.endTime || 'time not set'
  const unitText =
    typeof slot.startUnit === 'number' && typeof slot.endUnit === 'number'
      ? ` · units ${slot.startUnit}-${slot.endUnit}`
      : ''

  return `${timeText}${unitText}`
}

function buildQuickWeekActions(
  currentVisibleWeek: number | null,
  totalWeeks: number,
) {
  const nextWeek =
    currentVisibleWeek && currentVisibleWeek < totalWeeks ? currentVisibleWeek + 1 : null

  return [
    {
      key: 'this-week',
      label: 'This week',
      value: currentVisibleWeek,
      disabled: currentVisibleWeek === null,
    },
    {
      key: 'next-week',
      label: 'Next week',
      value: nextWeek,
      disabled: nextWeek === null,
    },
    {
      key: 'full-semester',
      label: 'Full semester',
      value: null,
      disabled: false,
    },
  ] as const
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
  currentVisibleWeek = null,
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
  const [submittedSummary, setSubmittedSummary] = useState('')
  const [submitIntent, setSubmitIntent] = useState<'save' | 'addAnother'>('save')
  const quickWeekActions = useMemo(
    () => buildQuickWeekActions(currentVisibleWeek, totalWeeks),
    [currentVisibleWeek, totalWeeks],
  )

  useEffect(() => {
    setValues(
      initialValues
        ? buildValuesFromInitialValues(initialValues, totalWeeks, timeSlots)
        : buildInitialValues(totalWeeks, timeSlots),
    )
    setErrors({})
    setSubmittedPayload(null)
    setSubmittedSummary('')
    setSubmitIntent('save')
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

  function applyWeekPreset(preset: 'this-week' | 'next-week' | 'full-semester') {
    if (preset === 'full-semester') {
      updateField('startWeek', 1)
      updateField('endWeek', totalWeeks)
      return
    }

    const targetWeek =
      preset === 'this-week'
        ? currentVisibleWeek
        : currentVisibleWeek && currentVisibleWeek < totalWeeks
          ? currentVisibleWeek + 1
          : null

    if (!targetWeek) {
      return
    }

    updateField('startWeek', targetWeek)
    updateField('endWeek', targetWeek)
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
        description: values.description.trim(),
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
    const selectedSlot = timeSlots.find((slot) => slot.id === values.timeSlot)
    const slotLabel = selectedSlot?.label ?? 'Unknown slot'
    setSubmittedSummary(
      `Saved to ${getWeekdayLabel(values.weekday)} · ${slotLabel} · ${formatWeekSummary(values)}`,
    )
    setErrors({})
    onSubmit?.(payload, {
      addAnother: submitIntent === 'addAnother',
    })
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {mode === 'edit'
                ? 'Edit course event'
                : mode === 'append'
                  ? 'Add weekly occurrence'
                  : 'New course event'}
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
          <label className="text-xs font-medium text-slate-600" htmlFor="event-description">
            Details
          </label>
          <textarea
            id="event-description"
            value={values.description}
            onChange={(event) => updateField('description', event.target.value)}
            rows={2}
            placeholder="Visible course/activity description"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
          />
          <p className="text-[11px] leading-5 text-slate-500">
            Use this for course summary, teacher, or anything you want to see later.
          </p>
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
            <span className="text-xs font-medium text-slate-600">
              Weekday
            </span>
            <div className="grid grid-cols-4 gap-2">
              {WEEKDAY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateField('weekday', option.value)}
                  className={`rounded-xl border px-2 py-2 text-xs font-medium ${
                    values.weekday === option.value
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-700 active:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
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
                        {formatTimeSlotDetail(slot)}
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

        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-700">Week range</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">Manual adjust below.</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
              {formatWeekSummary(values)}
            </span>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
            <div className="grid grid-cols-3 gap-2">
              {quickWeekActions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={() =>
                    applyWeekPreset(
                      action.key as 'this-week' | 'next-week' | 'full-semester',
                    )
                  }
                  disabled={action.disabled}
                  className={`rounded-xl border px-2 py-2 text-xs font-medium ${
                    action.disabled
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                      : 'border-slate-200 bg-white text-slate-700 active:bg-slate-100'
                  }`}
                >
                  {action.label}
                </button>
              ))}
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateField('startWeek', clampWeek(values.startWeek - 1, totalWeeks))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 active:bg-slate-50"
                aria-label="Decrease start week"
              >
                -
              </button>
              <input
                id="event-start-week"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={String(values.startWeek)}
                onChange={(event) =>
                  updateField('startWeek', parseWeekInput(event.target.value, values.startWeek, totalWeeks))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-center text-sm text-slate-900 outline-none"
              />
              <button
                type="button"
                onClick={() => updateField('startWeek', clampWeek(values.startWeek + 1, totalWeeks))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 active:bg-slate-50"
                aria-label="Increase start week"
              >
                +
              </button>
            </div>
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateField('endWeek', clampWeek(values.endWeek - 1, totalWeeks))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 active:bg-slate-50"
                aria-label="Decrease end week"
              >
                -
              </button>
              <input
                id="event-end-week"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={String(values.endWeek)}
                onChange={(event) =>
                  updateField('endWeek', parseWeekInput(event.target.value, values.endWeek, totalWeeks))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-center text-sm text-slate-900 outline-none"
              />
              <button
                type="button"
                onClick={() => updateField('endWeek', clampWeek(values.endWeek + 1, totalWeeks))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 active:bg-slate-50"
                aria-label="Increase end week"
              >
                +
              </button>
            </div>
            {errors.endWeek ? (
              <p className="text-xs text-rose-600">{errors.endWeek}</p>
            ) : null}
          </div>
        </div>
          <p className="text-[11px] leading-5 text-slate-500">
            Current range: Weeks {values.startWeek}-{values.endWeek}
          </p>
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
                Private note
              </label>
              <textarea
                id="event-note"
                value={values.note}
                onChange={(event) => updateField('note', event.target.value)}
                rows={3}
                placeholder="Optional internal note"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
              />
              <p className="text-[11px] leading-5 text-slate-500">
                Keep quick reminders here if you do not want them in the main details field.
              </p>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <button
            type="submit"
            onClick={() => setSubmitIntent('save')}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white active:opacity-90"
          >
            {mode === 'edit'
              ? 'Save changes'
              : mode === 'append'
                ? 'Add weekly occurrence'
                : 'Create course event'}
          </button>
          {mode === 'create' ? (
            <button
              type="submit"
              onClick={() => setSubmitIntent('addAnother')}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 active:bg-slate-50"
            >
              Create and add another weekly occurrence
            </button>
          ) : null}
        </div>
      </form>

      {submittedPayload ? (
        <div className="border-t border-slate-200 px-4 py-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3">
            <p className="text-xs font-semibold text-emerald-800">Saved</p>
            <p className="mt-1 text-sm text-emerald-900">{submittedSummary}</p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
