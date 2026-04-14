import type { TimetableEvent } from '../../components/timetable/types'
import type { EventException } from '../../types/event'

export type EventExceptionConflictResult = {
  blockingErrors: string[]
  warnings: string[]
}

type ValidateEventExceptionConflictInput = {
  actionType: EventException['actionType']
  eventId: string
  originalDate: string
  newDate: string | null
  newTimeSlotId: string | null
  newLocation: string | null
  existingExceptions: readonly EventException[]
  currentWeekEvents: readonly TimetableEvent[]
  currentExceptionId?: string | null
}

function addUnique(messages: string[], message: string) {
  if (!messages.includes(message)) {
    messages.push(message)
  }
}

function isMainCoverageAction(actionType: EventException['actionType']) {
  return (
    actionType === 'cancel' ||
    actionType === 'relocate' ||
    actionType === 'reschedule'
  )
}

export function validateEventExceptionConflict({
  actionType,
  eventId,
  originalDate,
  newDate,
  newTimeSlotId,
  newLocation,
  existingExceptions,
  currentWeekEvents,
  currentExceptionId = null,
}: ValidateEventExceptionConflictInput): EventExceptionConflictResult {
  const blockingErrors: string[] = []
  const warnings: string[] = []

  const sameOccurrenceExceptions = existingExceptions.filter(
    (exception) =>
      exception.id !== currentExceptionId &&
      exception.eventId === eventId &&
      exception.originalDate === originalDate,
  )

  if (isMainCoverageAction(actionType)) {
    if (
      actionType !== 'cancel' &&
      sameOccurrenceExceptions.some((exception) => exception.actionType === 'cancel')
    ) {
      addUnique(
        blockingErrors,
        'This occurrence is already cancelled. Relocate or reschedule would conflict with that cancel.',
      )
    }

    if (
      actionType !== 'reschedule' &&
      sameOccurrenceExceptions.some(
        (exception) => exception.actionType === 'reschedule',
      ) &&
      (actionType === 'cancel' || actionType === 'relocate')
    ) {
      addUnique(
        blockingErrors,
        'This occurrence is already rescheduled. Cancel or relocate would conflict with that reschedule.',
      )
    }

    if (
      actionType !== 'relocate' &&
      sameOccurrenceExceptions.some((exception) => exception.actionType === 'relocate') &&
      (actionType === 'cancel' || actionType === 'reschedule')
    ) {
      addUnique(
        blockingErrors,
        'This occurrence already has a relocation exception. Cancel or reschedule would conflict with that relocation.',
      )
    }

    if (
      sameOccurrenceExceptions.some(
        (exception) => exception.actionType === actionType,
      )
    ) {
      addUnique(
        blockingErrors,
        `A ${actionType} exception already exists for this occurrence.`,
      )
    }
  }

  if (
    actionType === 'relocate' &&
    sameOccurrenceExceptions.some((exception) => exception.actionType === 'relocate')
  ) {
    addUnique(
      warnings,
      'This occurrence already has another relocation record. Double-check which location should win.',
    )
  }

  if (
    (actionType === 'extra' || actionType === 'reschedule') &&
    newDate &&
    newTimeSlotId
  ) {
    const occupiedEvents = currentWeekEvents.filter(
      (event) =>
        event.occurrenceDate === newDate &&
        event.timeSlotId === newTimeSlotId &&
        !(actionType === 'reschedule' &&
          event.eventId === eventId &&
          event.originalDate === originalDate),
    )

    if (occupiedEvents.length > 0) {
      addUnique(
        warnings,
        'The target timetable cell already has event content in the current week view.',
      )
    }
  }

  if (
    actionType === 'extra' &&
    newDate &&
    newTimeSlotId &&
    existingExceptions.some(
      (exception) =>
        exception.id !== currentExceptionId &&
        exception.eventId === eventId &&
        exception.actionType === 'extra' &&
        exception.newDate === newDate &&
        exception.newTimeSlotId === newTimeSlotId,
    )
  ) {
    addUnique(
      warnings,
      'Another extra occurrence for this event already points to the same date and time slot.',
    )
  }

  if (
    actionType === 'relocate' &&
    newLocation &&
    sameOccurrenceExceptions.some(
      (exception) =>
        exception.actionType === 'relocate' &&
        exception.newLocation &&
        exception.newLocation !== newLocation,
    )
  ) {
    addUnique(
      warnings,
      'This occurrence has another saved location change with a different target location.',
    )
  }

  return {
    blockingErrors,
    warnings,
  }
}
