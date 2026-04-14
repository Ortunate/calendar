import { db } from '../../db/schema'
import type { DeadlineItem } from '../../types/deadline'
import type { Event, EventException } from '../../types/event'
import type { RecurringEventRule, ScheduleProfile, TimeSlot } from '../../types/schedule'
import type { DisplaySettingsRecord } from '../../types/settings'
import type { Semester } from '../../types/semester'

export type CampusPlannerJsonBackup = {
  version: 1
  exportedAt: string
  data: {
    semesters: Semester[]
    scheduleProfiles: ScheduleProfile[]
    timeSlots: TimeSlot[]
    events: Event[]
    recurringEventRules: RecurringEventRule[]
    eventExceptions: EventException[]
    deadlines: DeadlineItem[]
    displaySettings: DisplaySettingsRecord[]
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export async function exportAllDataAsJson(): Promise<CampusPlannerJsonBackup> {
  const [
    semesters,
    scheduleProfiles,
    timeSlots,
    events,
    recurringEventRules,
    eventExceptions,
    deadlines,
    displaySettings,
  ] = await Promise.all([
    db.semesters.toArray(),
    db.scheduleProfiles.toArray(),
    db.timeSlots.toArray(),
    db.events.toArray(),
    db.recurringEventRules.toArray(),
    db.eventExceptions.toArray(),
    db.deadlines.toArray(),
    db.displaySettings.toArray(),
  ])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      semesters,
      scheduleProfiles,
      timeSlots,
      events,
      recurringEventRules,
      eventExceptions,
      deadlines,
      displaySettings,
    },
  }
}

export function stringifyBackup(backup: CampusPlannerJsonBackup): string {
  return JSON.stringify(backup, null, 2)
}

export function parseBackupJson(rawText: string): CampusPlannerJsonBackup {
  const parsed: unknown = JSON.parse(rawText)

  if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.data)) {
    throw new Error('Invalid backup format.')
  }

  const data = parsed.data

  if (
    !isArray(data.semesters) ||
    !isArray(data.scheduleProfiles) ||
    !isArray(data.timeSlots) ||
    !isArray(data.events) ||
    !isArray(data.recurringEventRules) ||
    !isArray(data.eventExceptions) ||
    !isArray(data.deadlines) ||
    !isArray(data.displaySettings)
  ) {
    throw new Error('Backup data is incomplete.')
  }

  return parsed as CampusPlannerJsonBackup
}

export async function importAllDataFromJson(
  backup: CampusPlannerJsonBackup,
): Promise<void> {
  await db.eventExceptions.clear()
  await db.recurringEventRules.clear()
  await db.deadlines.clear()
  await db.events.clear()
  await db.timeSlots.clear()
  await db.scheduleProfiles.clear()
  await db.semesters.clear()
  await db.displaySettings.clear()

  if (backup.data.semesters.length > 0) {
    await db.semesters.bulkAdd(backup.data.semesters)
  }

  if (backup.data.scheduleProfiles.length > 0) {
    await db.scheduleProfiles.bulkAdd(backup.data.scheduleProfiles)
  }

  if (backup.data.timeSlots.length > 0) {
    await db.timeSlots.bulkAdd(backup.data.timeSlots)
  }

  if (backup.data.events.length > 0) {
    await db.events.bulkAdd(backup.data.events)
  }

  if (backup.data.recurringEventRules.length > 0) {
    await db.recurringEventRules.bulkAdd(backup.data.recurringEventRules)
  }

  if (backup.data.eventExceptions.length > 0) {
    await db.eventExceptions.bulkAdd(backup.data.eventExceptions)
  }

  if (backup.data.deadlines.length > 0) {
    await db.deadlines.bulkAdd(backup.data.deadlines)
  }

  if (backup.data.displaySettings.length > 0) {
    await db.displaySettings.bulkAdd(backup.data.displaySettings)
  }
}
