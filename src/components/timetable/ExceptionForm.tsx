import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { TimetableEvent } from './types'
import type { EventException } from '../../types/event'
import type { TimeSlot } from '../../types/schedule'
import { validateEventExceptionConflict } from '../../features/timetable/exceptionConflictGuard'

export type ExceptionFormPayload = Pick<
  EventException,
  'actionType' | 'newDate' | 'newTimeSlotId' | 'newLocation' | 'note'
>

type ExceptionFormProps = {
  actionType: EventException['actionType']
  event: TimetableEvent | null
  timeSlots: readonly TimeSlot[]
  mode?: 'create' | 'edit'
  initialValues?: EventException | null
  existingExceptions?: readonly EventException[]
  currentWeekEvents?: readonly TimetableEvent[]
  onClose: () => void
  onSubmit?: (payload: ExceptionFormPayload) => void
}

type ExceptionFormValues = {
  newDate: string
  newTimeSlotId: string
  newLocation: string
  note: string
}

type ExceptionFormErrors = Partial<Record<keyof ExceptionFormValues, string>>

function getActionTitle(actionType: EventException['actionType']) {
  switch (actionType) {
    case 'cancel':
      return 'Cancel occurrence'
    case 'relocate':
      return 'Relocate occurrence'
    case 'reschedule':
      return 'Reschedule occurrence'
    case 'extra':
      return 'Add extra occurrence'
  }
}

function getActionDescription(actionType: EventException['actionType']) {
  switch (actionType) {
    case 'cancel':
      return 'Mark this one occurrence as cancelled.'
    case 'relocate':
      return 'Update the location for this occurrence only.'
    case 'reschedule':
      return 'Move this occurrence to a different date or slot.'
    case 'extra':
      return 'Add one extra occurrence for this event.'
  }
}

function buildInitialValues(
  actionType: EventException['actionType'],
  event: TimetableEvent | null,
  initialValues: EventException | null,
): ExceptionFormValues {
  if (initialValues) {
    return {
      newDate: initialValues.newDate ?? '',
      newTimeSlotId: initialValues.newTimeSlotId ?? '',
      newLocation: initialValues.newLocation ?? '',
      note: initialValues.note,
    }
  }

  return {
    newDate: actionType === 'cancel' || actionType === 'relocate'
      ? ''
      : event?.occurrenceDate ?? '',
    newTimeSlotId: actionType === 'cancel' || actionType === 'relocate'
      ? ''
      : event?.timeSlotId ?? '',
    newLocation: actionType === 'relocate' ? event?.location ?? '' : '',
    note: '',
  }
}

function validate(
  actionType: EventException['actionType'],
  values: ExceptionFormValues,
  timeSlots: readonly TimeSlot[],
): ExceptionFormErrors {
  const errors: ExceptionFormErrors = {}

  if (actionType === 'relocate' && !values.newLocation.trim()) {
    errors.newLocation = 'New location is required.'
  }

  if (actionType === 'reschedule' || actionType === 'extra') {
    if (!values.newDate) {
      errors.newDate = 'New date is required.'
    }

    if (!values.newTimeSlotId) {
      errors.newTimeSlotId = 'Time slot is required.'
    } else if (!timeSlots.some((slot) => slot.id === values.newTimeSlotId)) {
      errors.newTimeSlotId = 'Choose a valid time slot.'
    }
  }

  return errors
}

export function ExceptionForm({
  actionType,
  event,
  timeSlots,
  mode = 'create',
  initialValues = null,
  existingExceptions = [],
  currentWeekEvents = [],
  onClose,
  onSubmit,
}: ExceptionFormProps) {
  const [values, setValues] = useState<ExceptionFormValues>(() =>
    buildInitialValues(actionType, event, initialValues),
  )
  const [errors, setErrors] = useState<ExceptionFormErrors>({})

  useEffect(() => {
    setValues(buildInitialValues(actionType, event, initialValues))
    setErrors({})
  }, [actionType, event, initialValues])

  const showDateAndSlotFields = actionType === 'reschedule' || actionType === 'extra'
  const showLocationField = actionType === 'relocate' || showDateAndSlotFields
  const conflictResult = useMemo(() => {
    if (!event) {
      return {
        blockingErrors: [],
        warnings: [],
      }
    }

    return validateEventExceptionConflict({
      actionType,
      eventId: event.eventId,
      originalDate: initialValues?.originalDate ?? event.occurrenceDate,
      newDate: showDateAndSlotFields ? values.newDate || null : null,
      newTimeSlotId: showDateAndSlotFields ? values.newTimeSlotId || null : null,
      newLocation: values.newLocation.trim() ? values.newLocation.trim() : null,
      existingExceptions,
      currentWeekEvents,
      currentExceptionId: initialValues?.id ?? null,
    })
  }, [
    actionType,
    currentWeekEvents,
    event,
    existingExceptions,
    initialValues,
    showDateAndSlotFields,
    values.newDate,
    values.newLocation,
    values.newTimeSlotId,
  ])
  const submitLabel = useMemo(() => {
    switch (actionType) {
      case 'cancel':
        return mode === 'edit' ? 'Save changes' : 'Save cancellation'
      case 'relocate':
        return mode === 'edit' ? 'Save changes' : 'Save relocation'
      case 'reschedule':
        return mode === 'edit' ? 'Save changes' : 'Save reschedule'
      case 'extra':
        return mode === 'edit' ? 'Save changes' : 'Add extra occurrence'
    }
  }, [actionType, mode])

  function updateField<K extends keyof ExceptionFormValues>(
    field: K,
    nextValue: ExceptionFormValues[K],
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

  function handleSubmit(eventObject: FormEvent<HTMLFormElement>) {
    eventObject.preventDefault()

    const nextErrors = validate(actionType, values, timeSlots)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    if (conflictResult.blockingErrors.length > 0) {
      return
    }

    onSubmit?.({
      actionType,
      newDate: showDateAndSlotFields ? values.newDate : null,
      newTimeSlotId: showDateAndSlotFields ? values.newTimeSlotId : null,
      newLocation: values.newLocation.trim() ? values.newLocation.trim() : null,
      note: values.note.trim(),
    })
  }

  if (!event) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-3 pb-3">
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
              Exception action
            </p>
            <h3 className="mt-1 text-base font-semibold text-slate-900">
              {getActionTitle(actionType)}
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {mode === 'edit'
                ? 'Update the saved exception for this event.'
                : getActionDescription(actionType)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
          >
            Close
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-medium text-slate-700">{event.title}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {event.occurrenceDate} · {event.timeSlotId} · {event.location}
          </p>
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          {showDateAndSlotFields ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600" htmlFor="exception-date">
                  New date
                </label>
                <input
                  id="exception-date"
                  type="date"
                  value={values.newDate}
                  onChange={(nextEvent) => updateField('newDate', nextEvent.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
                />
                {errors.newDate ? (
                  <p className="text-xs text-rose-600">{errors.newDate}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600" htmlFor="exception-slot">
                  New time slot
                </label>
                <select
                  id="exception-slot"
                  value={values.newTimeSlotId}
                  onChange={(nextEvent) =>
                    updateField('newTimeSlotId', nextEvent.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none"
                >
                  <option value="">Select a time slot</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.label} ({slot.startTime}-{slot.endTime})
                    </option>
                  ))}
                </select>
                {errors.newTimeSlotId ? (
                  <p className="text-xs text-rose-600">{errors.newTimeSlotId}</p>
                ) : null}
              </div>
            </>
          ) : null}

          {showLocationField ? (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600" htmlFor="exception-location">
                {actionType === 'relocate' ? 'New location' : 'Location override'}
              </label>
              <input
                id="exception-location"
                value={values.newLocation}
                onChange={(nextEvent) => updateField('newLocation', nextEvent.target.value)}
                placeholder={event.location || 'Optional location'}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
              />
              {errors.newLocation ? (
                <p className="text-xs text-rose-600">{errors.newLocation}</p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600" htmlFor="exception-note">
              Note
            </label>
            <textarea
              id="exception-note"
              value={values.note}
              onChange={(nextEvent) => updateField('note', nextEvent.target.value)}
              rows={3}
              placeholder="Optional note for this exception"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
            />
          </div>

          {conflictResult.blockingErrors.length > 0 ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                Blocking conflict
              </p>
              <ul className="mt-2 space-y-1 text-sm text-rose-700">
                {conflictResult.blockingErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {conflictResult.warnings.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Warning
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-700">
                {conflictResult.warnings.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            {submitLabel}
          </button>
        </form>
      </section>
    </div>
  )
}
