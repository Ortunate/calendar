import type { Event } from '../../types/event'
import type { RecurringEventRule, TimeSlot, WeekMode } from '../../types/schedule'
import type { Semester } from '../../types/semester'
import type {
  ImportCandidate,
  ImportRowError,
  ImportRowWarning,
  ParsedImportRow,
} from './types'

function createError(
  field: 'startSlot' | 'endSlot' | 'weeks',
  message: string,
): ImportRowError {
  return {
    field,
    code: field === 'weeks' ? 'invalid_weeks' : 'invalid_slot',
    message,
  }
}

export function resolveTimeSlotByUnits(
  timeSlots: readonly TimeSlot[],
  startSlot: number,
  endSlot: number,
): TimeSlot | null {
  return (
    timeSlots.find(
      (timeSlot) =>
        timeSlot.startUnit === startSlot && timeSlot.endUnit === endSlot,
    ) ?? null
  )
}

function resolveWeeksRule(weeks: number[]) {
  const sortedWeeks = [...weeks].sort((left, right) => left - right)
  const startWeek = sortedWeeks[0]
  const endWeek = sortedWeeks[sortedWeeks.length - 1]
  const isContinuousRange = sortedWeeks.every(
    (week, index) => week === startWeek + index,
  )

  return {
    startWeek,
    endWeek,
    weekMode: isContinuousRange ? ('all' as const) : ('custom' as const),
    customWeeks: isContinuousRange ? [] : sortedWeeks,
  }
}

function expandWeeks(
  startWeek: number,
  endWeek: number,
  weekMode: WeekMode,
  customWeeks: number[],
) {
  if (weekMode === 'custom') {
    return customWeeks
  }

  const weeks: number[] = []

  for (let week = startWeek; week <= endWeek; week += 1) {
    if (weekMode === 'odd' && week % 2 === 0) {
      continue
    }

    if (weekMode === 'even' && week % 2 !== 0) {
      continue
    }

    weeks.push(week)
  }

  return weeks
}

function hasWeekOverlap(
  existingRule: RecurringEventRule,
  nextRule: Pick<
    RecurringEventRule,
    'startWeek' | 'endWeek' | 'weekMode' | 'customWeeks'
  >,
) {
  const existingWeeks = new Set(
    expandWeeks(
      existingRule.startWeek,
      existingRule.endWeek,
      existingRule.weekMode,
      existingRule.customWeeks,
    ),
  )
  const nextWeeks = expandWeeks(
    nextRule.startWeek,
    nextRule.endWeek,
    nextRule.weekMode,
    nextRule.customWeeks,
  )

  return nextWeeks.some((week) => existingWeeks.has(week))
}

export function buildEventPayload(
  parsedRow: ParsedImportRow,
  semesterId: string,
): Event {
  // Build the future Event insert payload from parsed template input.
  // The returned object is only a pre-write payload for preview/import, not a persisted row yet.
  const timestamp = new Date().toISOString()

  return {
    id: `import-event-${crypto.randomUUID()}`,
    title: parsedRow.title,
    type: parsedRow.type,
    location: parsedRow.location,
    description: parsedRow.teacher,
    note: parsedRow.note,
    color: parsedRow.color ?? '#2563eb',
    priority: 2,
    semesterId,
    isAllDay: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function buildRecurringRulePayload(
  parsedRow: ParsedImportRow,
  eventId: string,
  timeSlotId: string,
): RecurringEventRule {
  // Build the future recurring rule insert payload after weekday/weeks/time-slot matching succeeds.
  // Like eventPayload, this is still only a pre-write object.
  const weekRule = resolveWeeksRule(parsedRow.weeks)

  return {
    id: `import-rule-${crypto.randomUUID()}`,
    eventId,
    weekday: parsedRow.weekday,
    timeSlotId,
    startWeek: weekRule.startWeek,
    endWeek: weekRule.endWeek,
    weekMode: weekRule.weekMode,
    customWeeks: weekRule.customWeeks,
  }
}

export function mapParsedRowToImportCandidate(
  parsedRow: ParsedImportRow,
  semester: Semester | null,
  timeSlots: readonly TimeSlot[],
  existingEvents: readonly Event[] = [],
  existingRules: readonly RecurringEventRule[] = [],
  inheritedWarnings: ImportRowWarning[] = [],
): ImportCandidate {
  // Candidate mapping takes parsed input, resolves local matches, prepares insert payloads,
  // and separates non-blocking warnings from blocking errors.
  // canImport is true only when semester context exists, a TimeSlot match is found,
  // and no blocking errors remain for this row.
  const errors: ImportRowError[] = []
  const warnings = [...inheritedWarnings]

  if (!semester) {
    errors.push(
      createError('weeks', 'No current semester is available for course import.'),
    )

    return {
      parsedRow,
      matchedTimeSlot: null,
      eventPayload: null,
      recurringRulePayload: null,
      warnings,
      errors,
      canImport: false,
    }
  }

  const matchedTimeSlot = resolveTimeSlotByUnits(
    timeSlots,
    parsedRow.startSlot,
    parsedRow.endSlot,
  )

  if (!matchedTimeSlot) {
    errors.push(
      createError(
        'startSlot',
        `No TimeSlot matches units ${parsedRow.startSlot}-${parsedRow.endSlot}.`,
      ),
    )
  }

  if (parsedRow.weeks.length === 0) {
    errors.push(createError('weeks', 'Weeks cannot be empty after parsing.'))
  }

  if (!matchedTimeSlot || errors.length > 0) {
    return {
      parsedRow,
      matchedTimeSlot,
      eventPayload: null,
      recurringRulePayload: null,
      warnings,
      errors,
      canImport: false,
    }
  }

  const eventPayload = buildEventPayload(parsedRow, semester.id)
  const recurringRulePayload = buildRecurringRulePayload(
    parsedRow,
    eventPayload.id,
    matchedTimeSlot.id,
  )

  const possibleDuplicate = existingEvents.some((existingEvent) => {
    if (existingEvent.semesterId !== semester.id || existingEvent.title !== parsedRow.title) {
      return false
    }

    return existingRules.some(
      (rule) =>
        rule.eventId === existingEvent.id &&
        rule.weekday === recurringRulePayload.weekday &&
        rule.timeSlotId === recurringRulePayload.timeSlotId &&
        hasWeekOverlap(rule, recurringRulePayload),
    )
  })

  if (possibleDuplicate) {
    warnings.push({
      field: 'title',
      code: 'possible_duplicate',
      message:
        'Possible duplicate: same title, weekday, slot, and overlapping weeks found.',
    })
  }

  return {
    parsedRow,
    matchedTimeSlot,
    eventPayload,
    recurringRulePayload,
    warnings,
    errors,
    canImport: true,
  }
}
