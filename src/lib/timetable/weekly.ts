import dayjs from 'dayjs'
import type { TimetableDay, TimetableEvent } from '../../components/timetable/types'
import type { Event, EventException } from '../../types/event'
import type { RecurringEventRule, TimeSlot, Weekday } from '../../types/schedule'
import type { Semester } from '../../types/semester'
import { isRuleActiveInWeek } from '../recurrence/isRuleActiveInWeek'
import { applyEventExceptionsToWeek } from './exceptions'

const WEEKDAY_META: Record<Weekday, { key: string; label: string }> = {
  1: { key: 'mon', label: 'Mon' },
  2: { key: 'tue', label: 'Tue' },
  3: { key: 'wed', label: 'Wed' },
  4: { key: 'thu', label: 'Thu' },
  5: { key: 'fri', label: 'Fri' },
  6: { key: 'sat', label: 'Sat' },
  7: { key: 'sun', label: 'Sun' },
}

export type WeekDateRange = {
  startDate: string
  endDate: string
  days: TimetableDay[]
}

export type WeeklyTimetableResult = {
  weekIndex: number | null
  weekLabel: string
  dateRange: WeekDateRange | null
  events: TimetableEvent[]
}

export function getWeekIndexByDate(
  currentDate: string | Date,
  semester: Semester,
): number | null {
  const targetDate = dayjs(currentDate).startOf('day')
  const weekOneStart = dayjs(semester.weekOneStartDate).startOf('day')
  const diffDays = targetDate.diff(weekOneStart, 'day')

  if (diffDays < 0) {
    return null
  }

  const weekIndex = Math.floor(diffDays / 7) + 1

  if (weekIndex < 1 || weekIndex > semester.totalWeeks) {
    return null
  }

  return weekIndex
}

export function getWeekDateRange(
  semester: Semester,
  weekIndex: number,
): WeekDateRange | null {
  if (weekIndex < 1 || weekIndex > semester.totalWeeks) {
    return null
  }

  const start = dayjs(semester.weekOneStartDate)
    .startOf('day')
    .add(weekIndex - 1, 'week')

  const days: TimetableDay[] = ([1, 2, 3, 4, 5, 6, 7] as Weekday[]).map(
    (weekday, index) => ({
      key: WEEKDAY_META[weekday].key,
      weekdayLabel: WEEKDAY_META[weekday].label,
      dateLabel: start.add(index, 'day').format('MM/DD'),
      fullDate: start.add(index, 'day').format('YYYY-MM-DD'),
    }),
  )

  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: start.add(6, 'day').format('YYYY-MM-DD'),
    days,
  }
}

type BuildWeeklyTimetableEventsInput = {
  currentDate: string | Date
  semester: Semester
  timeSlots: TimeSlot[]
  events: Event[]
  recurringRules: RecurringEventRule[]
  eventExceptions?: EventException[]
}

export function buildWeeklyTimetableEvents({
  currentDate,
  semester,
  timeSlots,
  events,
  recurringRules,
  eventExceptions = [],
}: BuildWeeklyTimetableEventsInput): WeeklyTimetableResult {
  const weekIndex = getWeekIndexByDate(currentDate, semester)

  if (weekIndex === null) {
    return {
      weekIndex: null,
      weekLabel: 'Out of semester',
      dateRange: null,
      events: [],
    }
  }

  const dateRange = getWeekDateRange(semester, weekIndex)

  if (!dateRange) {
    return {
      weekIndex: null,
      weekLabel: 'Out of semester',
      dateRange: null,
      events: [],
    }
  }

  const timeSlotIdSet = new Set(timeSlots.map((slot) => slot.id))
  const eventMap = new Map(
    events
      .filter((event) => event.semesterId === semester.id)
      .map((event) => [event.id, event]),
  )

  const weeklyEvents = recurringRules
    .filter((rule) => timeSlotIdSet.has(rule.timeSlotId))
    .filter((rule) => isRuleActiveInWeek(rule, weekIndex))
    .map((rule) => {
      const event = eventMap.get(rule.eventId)
      const occurrenceDate = dayjs(dateRange.startDate)
        .add(rule.weekday - 1, 'day')
        .format('YYYY-MM-DD')

      if (!event) {
        return null
      }

      return {
        id: `${event.id}:${occurrenceDate}:${rule.timeSlotId}`,
        eventId: event.id,
        title: event.title,
        type: event.type,
        location: event.location,
        note: event.note,
        color: event.color,
        dayKey: WEEKDAY_META[rule.weekday].key,
        timeSlotId: rule.timeSlotId,
        occurrenceDate,
        originalDate: occurrenceDate,
      }
    })
    .filter((event): event is TimetableEvent => event !== null)

  const finalEvents = applyEventExceptionsToWeek({
    baseEvents: weeklyEvents,
    events,
    exceptions: eventExceptions,
    weekStartDate: dateRange.startDate,
    weekEndDate: dateRange.endDate,
    timeSlots,
  })

  return {
    weekIndex,
    weekLabel: `Week ${String(weekIndex).padStart(2, '0')}`,
    dateRange,
    events: finalEvents,
  }
}
