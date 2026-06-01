export type TimetableDay = {
  key: string
  weekdayLabel: string
  dateLabel: string
  fullDate: string
}

export type TimetableSlot = {
  id: string
  label: string
  startTime: string
  endTime: string
}

export type TimetableEvent = {
  id: string
  eventId: string
  title: string
  type: 'course' | 'exam' | 'meeting' | 'activity' | 'custom'
  description: string
  location: string
  note: string
  color: string
  dayKey: string
  timeSlotId: string
  occurrenceDate: string
  originalDate: string
  isException?: boolean
  exceptionActionType?: 'cancel' | 'reschedule' | 'relocate' | 'extra'
}
