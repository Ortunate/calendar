import Dexie, { type EntityTable } from 'dexie'
import type { DeadlineItem } from '../types/deadline'
import type { Event, EventException } from '../types/event'
import type { ScheduleProfile, RecurringEventRule, TimeSlot } from '../types/schedule'
import type { DisplaySettingsRecord, ReminderConfig } from '../types/settings'
import type { Semester } from '../types/semester'

function getDefaultUnitsForOrder(order: number) {
  const safeOrder = Number.isFinite(order) && order > 0 ? order : 1

  return {
    startUnit: safeOrder * 2 - 1,
    endUnit: safeOrder * 2,
  }
}

export class CampusPlannerDatabase extends Dexie {
  semesters!: EntityTable<Semester, 'id'>
  scheduleProfiles!: EntityTable<ScheduleProfile, 'id'>
  timeSlots!: EntityTable<TimeSlot, 'id'>
  events!: EntityTable<Event, 'id'>
  recurringEventRules!: EntityTable<RecurringEventRule, 'id'>
  eventExceptions!: EntityTable<EventException, 'id'>
  deadlines!: EntityTable<DeadlineItem, 'id'>
  reminderConfigs!: EntityTable<ReminderConfig, 'id'>
  displaySettings!: EntityTable<DisplaySettingsRecord, 'id'>

  constructor() {
    super('campusPlanner')

    this.version(1).stores({
      semesters:
        'id, isCurrent, startDate, endDate, weekOneStartDate, scheduleProfileId',
      scheduleProfiles: 'id, semesterId, [semesterId+name]',
      timeSlots: 'id, scheduleProfileId, order, [scheduleProfileId+order]',
      events:
        'id, semesterId, type, priority, createdAt, updatedAt, [semesterId+type]',
      recurringEventRules:
        'id, eventId, timeSlotId, weekday, [eventId+weekday], [weekday+timeSlotId]',
      eventExceptions:
        'id, eventId, originalDate, actionType, [eventId+originalDate]',
      deadlines:
        'id, status, dueAt, priority, courseEventId, updatedAt, [status+dueAt], [courseEventId+dueAt]',
      reminderConfigs: 'id, targetType, targetId, enabled, [targetType+targetId]',
      displaySettings: 'id',
    })

    this.version(2)
      .stores({
        semesters:
          'id, isCurrent, startDate, endDate, weekOneStartDate, scheduleProfileId',
        scheduleProfiles: 'id, semesterId, [semesterId+name]',
        timeSlots:
          'id, scheduleProfileId, order, startUnit, endUnit, [scheduleProfileId+order]',
        events:
          'id, semesterId, type, priority, createdAt, updatedAt, [semesterId+type]',
        recurringEventRules:
          'id, eventId, timeSlotId, weekday, [eventId+weekday], [weekday+timeSlotId]',
        eventExceptions:
          'id, eventId, originalDate, actionType, [eventId+originalDate]',
        deadlines:
          'id, status, dueAt, priority, courseEventId, updatedAt, [status+dueAt], [courseEventId+dueAt]',
        reminderConfigs: 'id, targetType, targetId, enabled, [targetType+targetId]',
        displaySettings: 'id',
      })
      .upgrade((transaction) =>
        transaction
          .table('timeSlots')
          .toCollection()
          .modify((timeSlot) => {
            const defaults = getDefaultUnitsForOrder(timeSlot.order)

            timeSlot.startUnit =
              typeof timeSlot.startUnit === 'number'
                ? timeSlot.startUnit
                : defaults.startUnit
            timeSlot.endUnit =
              typeof timeSlot.endUnit === 'number'
                ? timeSlot.endUnit
                : defaults.endUnit
          }),
      )
  }
}

export const db = new CampusPlannerDatabase()
