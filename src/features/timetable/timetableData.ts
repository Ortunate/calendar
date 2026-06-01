import { addDemoCourse, ensureDemoData } from '../../db/demoData'
import { eventExceptionRepository } from '../../db/repositories/eventExceptionRepository'
import { db } from '../../db/schema'
import type { EventFormInitialValues, EventFormPayload } from '../../components/forms/EventForm'
import type { ExceptionFormPayload } from '../../components/timetable/ExceptionForm'
import type { TimetableEvent } from '../../components/timetable/types'
import type { Event, EventException } from '../../types/event'
import type { RecurringEventRule, TimeSlot } from '../../types/schedule'
import type { Semester } from '../../types/semester'

export type TimetableSnapshot = {
  semester: Semester | null
  timeSlots: TimeSlot[]
  events: Event[]
  rules: RecurringEventRule[]
  exceptions: EventException[]
}

export async function loadTimetableSnapshot(): Promise<TimetableSnapshot> {
  await ensureDemoData()

  const semester = (await db.semesters.filter((item) => item.isCurrent).first()) ?? null
  const timeSlots = semester
    ? await db.timeSlots
        .where('scheduleProfileId')
        .equals(semester.scheduleProfileId)
        .sortBy('order')
    : []
  const events = semester
    ? await db.events.where('semesterId').equals(semester.id).toArray()
    : []
  const rules = await db.recurringEventRules.toArray()
  const exceptions = await db.eventExceptions.toArray()

  return {
    semester,
    timeSlots,
    events,
    rules,
    exceptions,
  }
}

export async function createCourseFromPayload(payload: EventFormPayload) {
  const timestamp = new Date().toISOString()
  const eventId = crypto.randomUUID()
  const ruleId = crypto.randomUUID()

  const event = {
    ...payload.event,
    id: eventId,
    semesterId: (await db.semesters.filter((item) => item.isCurrent).first())?.id ??
      payload.event.semesterId,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const recurringRule = {
    ...payload.recurringRule,
    id: ruleId,
    eventId,
  }

  await db.events.add(event)
  await db.recurringEventRules.add(recurringRule)

  return {
    event,
    recurringRule,
  }
}

export async function addRecurringRuleToEvent(
  eventId: string,
  payload: EventFormPayload,
) {
  await db.events.update(eventId, {
    title: payload.event.title,
    description: payload.event.description,
    location: payload.event.location,
    note: payload.event.note,
    color: payload.event.color,
    updatedAt: new Date().toISOString(),
  })

  await db.recurringEventRules.add({
    ...payload.recurringRule,
    id: crypto.randomUUID(),
    eventId,
  })
}

export async function updateCourseFromPayload(
  editingCourse: EventFormInitialValues,
  payload: EventFormPayload,
  currentSemesterId?: string | null,
) {
  const timestamp = new Date().toISOString()

  await db.events.update(editingCourse.event.id, {
    title: payload.event.title,
    description: payload.event.description,
    location: payload.event.location,
    note: payload.event.note,
    color: payload.event.color,
    semesterId: currentSemesterId ?? editingCourse.event.semesterId,
    updatedAt: timestamp,
  })

  await db.recurringEventRules.update(editingCourse.recurringRule.id, {
    weekday: payload.recurringRule.weekday,
    timeSlotId: payload.recurringRule.timeSlotId,
    startWeek: payload.recurringRule.startWeek,
    endWeek: payload.recurringRule.endWeek,
    weekMode: payload.recurringRule.weekMode,
    customWeeks: payload.recurringRule.customWeeks,
  })
}

export async function deleteCourseById(eventId: string) {
  await db.events.delete(eventId)
  await db.recurringEventRules.where('eventId').equals(eventId).delete()
  await db.eventExceptions.where('eventId').equals(eventId).delete()
}

export async function createExceptionForEvent(
  pendingEvent: TimetableEvent,
  payload: ExceptionFormPayload,
) {
  await eventExceptionRepository.create({
    id: crypto.randomUUID(),
    eventId: pendingEvent.eventId,
    originalDate: pendingEvent.occurrenceDate,
    actionType: payload.actionType,
    newDate: payload.newDate,
    newTimeSlotId: payload.newTimeSlotId,
    newLocation: payload.newLocation,
    note: payload.note,
  })
}

export async function updateExceptionById(
  exceptionId: string,
  payload: ExceptionFormPayload,
) {
  await eventExceptionRepository.update(exceptionId, {
    actionType: payload.actionType,
    newDate: payload.newDate,
    newTimeSlotId: payload.newTimeSlotId,
    newLocation: payload.newLocation,
    note: payload.note,
  })
}

export async function deleteExceptionById(exceptionId: string) {
  await eventExceptionRepository.remove(exceptionId)
}

export { addDemoCourse }
