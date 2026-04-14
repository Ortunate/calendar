export type EventType = 'course' | 'exam' | 'meeting' | 'activity' | 'custom'

export type EventExceptionActionType =
  | 'cancel'
  | 'reschedule'
  | 'relocate'
  | 'extra'

export type Event = {
  id: string
  title: string
  type: EventType
  location: string
  description: string
  note: string
  color: string
  priority: number
  semesterId: string
  isAllDay: boolean
  createdAt: string
  updatedAt: string
}

export type EventException = {
  id: string
  eventId: string
  originalDate: string
  actionType: EventExceptionActionType
  newDate: string | null
  newTimeSlotId: string | null
  newLocation: string | null
  note: string
}
