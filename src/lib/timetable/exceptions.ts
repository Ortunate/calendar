import dayjs from 'dayjs'
import type { TimetableEvent } from '../../components/timetable/types'
import type { Event, EventException } from '../../types/event'
import type { TimeSlot } from '../../types/schedule'

type ApplyEventExceptionsInput = {
  baseEvents: TimetableEvent[]
  events: Event[]
  exceptions: EventException[]
  weekStartDate: string
  weekEndDate: string
  timeSlots: TimeSlot[]
}

function isDateInWeek(date: string | null, weekStartDate: string, weekEndDate: string) {
  if (!date) {
    return false
  }

  const target = dayjs(date).startOf('day')
  const start = dayjs(weekStartDate).startOf('day')
  const end = dayjs(weekEndDate).startOf('day')

  return (
    target.isSame(start, 'day') ||
    target.isSame(end, 'day') ||
    (target.isAfter(start, 'day') && target.isBefore(end, 'day'))
  )
}

function buildOccurrenceId(eventId: string, occurrenceDate: string, timeSlotId: string) {
  return `${eventId}:${occurrenceDate}:${timeSlotId}`
}

function buildDayKey(occurrenceDate: string) {
  const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
  return keys[dayjs(occurrenceDate).day()]
}

export function applyEventExceptionsToWeek({
  baseEvents,
  events,
  exceptions,
  weekStartDate,
  weekEndDate,
  timeSlots,
}: ApplyEventExceptionsInput): TimetableEvent[] {
  const eventMap = new Map(events.map((event) => [event.id, event]))
  const slotIdSet = new Set(timeSlots.map((slot) => slot.id))
  const baseOccurrenceMap = new Map(
    baseEvents.map((event) => [`${event.eventId}:${event.originalDate}`, event]),
  )

  let nextEvents = [...baseEvents]

  for (const exception of exceptions) {
    const originalInWeek = isDateInWeek(
      exception.originalDate,
      weekStartDate,
      weekEndDate,
    )
    const newInWeek = isDateInWeek(exception.newDate, weekStartDate, weekEndDate)
    const matchKey = `${exception.eventId}:${exception.originalDate}`
    const sourceOccurrence = baseOccurrenceMap.get(matchKey)
    const sourceEvent = eventMap.get(exception.eventId)

    if (exception.actionType === 'cancel') {
      if (!originalInWeek) {
        continue
      }

      nextEvents = nextEvents.filter(
        (event) =>
          !(event.eventId === exception.eventId &&
            event.originalDate === exception.originalDate),
      )

      continue
    }

    if (exception.actionType === 'relocate') {
      if (!originalInWeek || !exception.newLocation) {
        continue
      }

      nextEvents = nextEvents.map((event) =>
        event.eventId === exception.eventId &&
        event.originalDate === exception.originalDate
          ? {
              ...event,
              location: exception.newLocation ?? event.location,
              isException: true,
              exceptionActionType: 'relocate',
            }
          : event,
      )

      continue
    }

    if (exception.actionType === 'reschedule') {
      if (originalInWeek) {
        nextEvents = nextEvents.filter(
          (event) =>
            !(event.eventId === exception.eventId &&
              event.originalDate === exception.originalDate),
        )
      }

      if (
        !newInWeek ||
        !sourceEvent ||
        !exception.newDate ||
        !exception.newTimeSlotId ||
        !slotIdSet.has(exception.newTimeSlotId)
      ) {
        continue
      }

      nextEvents.push({
        id: buildOccurrenceId(
          sourceEvent.id,
          exception.newDate,
          exception.newTimeSlotId,
        ),
        eventId: sourceEvent.id,
        title: sourceEvent.title,
        type: sourceEvent.type,
        location:
          exception.newLocation ?? sourceOccurrence?.location ?? sourceEvent.location,
        note: sourceEvent.note,
        color: sourceEvent.color,
        dayKey: buildDayKey(exception.newDate),
        timeSlotId: exception.newTimeSlotId,
        occurrenceDate: exception.newDate,
        originalDate: exception.originalDate,
        isException: true,
        exceptionActionType: 'reschedule',
      })

      continue
    }

    if (
      exception.actionType === 'extra' &&
      newInWeek &&
      sourceEvent &&
      exception.newDate &&
      exception.newTimeSlotId &&
      slotIdSet.has(exception.newTimeSlotId)
    ) {
      nextEvents.push({
        id: buildOccurrenceId(
          sourceEvent.id,
          exception.newDate,
          exception.newTimeSlotId,
        ),
        eventId: sourceEvent.id,
        title: sourceEvent.title,
        type: sourceEvent.type,
        location:
          exception.newLocation ?? sourceOccurrence?.location ?? sourceEvent.location,
        note: sourceEvent.note,
        color: sourceEvent.color,
        dayKey: buildDayKey(exception.newDate),
        timeSlotId: exception.newTimeSlotId,
        occurrenceDate: exception.newDate,
        originalDate: exception.originalDate,
        isException: true,
        exceptionActionType: 'extra',
      })
    }
  }

  return nextEvents
}
