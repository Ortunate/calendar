export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type WeekMode = 'all' | 'odd' | 'even' | 'custom'

export type ScheduleProfile = {
  id: string
  name: string
  semesterId: string
  description: string
}

export type TimeSlot = {
  id: string
  scheduleProfileId: string
  label: string
  startTime: string
  endTime: string
  startUnit: number
  endUnit: number
  order: number
}

export type RecurringEventRule = {
  id: string
  eventId: string
  weekday: Weekday
  timeSlotId: string
  startWeek: number
  endWeek: number
  weekMode: WeekMode
  customWeeks: number[]
}
