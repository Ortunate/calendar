import { db } from './schema'
import type { DeadlineItem } from '../types/deadline'
import type { Event } from '../types/event'
import type { RecurringEventRule, ScheduleProfile, TimeSlot } from '../types/schedule'
import type { Semester } from '../types/semester'

const DEMO_SEMESTER_ID = 'semester-demo-2026-spring'
const DEMO_PROFILE_ID = 'schedule-profile-demo'

const DEMO_SEMESTER: Semester = {
  id: DEMO_SEMESTER_ID,
  name: '2026 Spring Semester',
  startDate: '2026-02-23',
  endDate: '2026-07-05',
  weekOneStartDate: '2026-02-23',
  totalWeeks: 20,
  scheduleProfileId: DEMO_PROFILE_ID,
  isCurrent: true,
}

const DEMO_PROFILE: ScheduleProfile = {
  id: DEMO_PROFILE_ID,
  name: 'Default schedule',
  semesterId: DEMO_SEMESTER_ID,
  description: 'Standard weekday timetable',
}

const DEMO_TIME_SLOTS: TimeSlot[] = [
  {
    id: 'slot-1',
    scheduleProfileId: DEMO_PROFILE_ID,
    label: '1-2',
    startTime: '08:00',
    endTime: '09:35',
    startUnit: 1,
    endUnit: 2,
    order: 1,
  },
  {
    id: 'slot-2',
    scheduleProfileId: DEMO_PROFILE_ID,
    label: '3-4',
    startTime: '10:00',
    endTime: '11:35',
    startUnit: 3,
    endUnit: 4,
    order: 2,
  },
  {
    id: 'slot-3',
    scheduleProfileId: DEMO_PROFILE_ID,
    label: '5-6',
    startTime: '14:00',
    endTime: '15:35',
    startUnit: 5,
    endUnit: 6,
    order: 3,
  },
  {
    id: 'slot-4',
    scheduleProfileId: DEMO_PROFILE_ID,
    label: '7-8',
    startTime: '16:00',
    endTime: '17:35',
    startUnit: 7,
    endUnit: 8,
    order: 4,
  },
  {
    id: 'slot-5',
    scheduleProfileId: DEMO_PROFILE_ID,
    label: '9-10',
    startTime: '19:00',
    endTime: '20:35',
    startUnit: 9,
    endUnit: 10,
    order: 5,
  },
]

const NOW = '2026-04-08T09:00:00.000Z'

const DEMO_EVENTS: Event[] = [
  {
    id: 'event-advanced-math',
    title: 'Advanced Math',
    type: 'course',
    location: 'A-203',
    description: '',
    note: 'Bring quiz sheet.',
    color: '#2563eb',
    priority: 2,
    semesterId: DEMO_SEMESTER_ID,
    isAllDay: false,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'event-data-structures',
    title: 'Data Structures',
    type: 'course',
    location: 'Lab 402',
    description: '',
    note: 'C implementation review.',
    color: '#059669',
    priority: 2,
    semesterId: DEMO_SEMESTER_ID,
    isAllDay: false,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'event-english-seminar',
    title: 'English Seminar',
    type: 'meeting',
    location: 'B-105',
    description: '',
    note: 'Presentation rehearsal.',
    color: '#7c3aed',
    priority: 2,
    semesterId: DEMO_SEMESTER_ID,
    isAllDay: false,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'event-physics-experiment',
    title: 'Physics Experiment',
    type: 'course',
    location: 'Science 201',
    description: '',
    note: 'Wear lab coat.',
    color: '#ea580c',
    priority: 2,
    semesterId: DEMO_SEMESTER_ID,
    isAllDay: false,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'event-club-meeting',
    title: 'Club Meeting',
    type: 'activity',
    location: 'Student Center',
    description: '',
    note: 'Budget planning.',
    color: '#dc2626',
    priority: 2,
    semesterId: DEMO_SEMESTER_ID,
    isAllDay: false,
    createdAt: NOW,
    updatedAt: NOW,
  },
]

const DEMO_RULES: RecurringEventRule[] = [
  {
    id: 'rule-advanced-math',
    eventId: 'event-advanced-math',
    weekday: 1,
    timeSlotId: 'slot-1',
    startWeek: 1,
    endWeek: 20,
    weekMode: 'all',
    customWeeks: [],
  },
  {
    id: 'rule-data-structures',
    eventId: 'event-data-structures',
    weekday: 2,
    timeSlotId: 'slot-2',
    startWeek: 1,
    endWeek: 20,
    weekMode: 'all',
    customWeeks: [],
  },
  {
    id: 'rule-english-seminar',
    eventId: 'event-english-seminar',
    weekday: 3,
    timeSlotId: 'slot-3',
    startWeek: 1,
    endWeek: 20,
    weekMode: 'all',
    customWeeks: [],
  },
  {
    id: 'rule-physics-experiment',
    eventId: 'event-physics-experiment',
    weekday: 4,
    timeSlotId: 'slot-4',
    startWeek: 1,
    endWeek: 20,
    weekMode: 'all',
    customWeeks: [],
  },
  {
    id: 'rule-club-meeting',
    eventId: 'event-club-meeting',
    weekday: 5,
    timeSlotId: 'slot-5',
    startWeek: 1,
    endWeek: 20,
    weekMode: 'all',
    customWeeks: [],
  },
]

const DEMO_DEADLINES: DeadlineItem[] = [
  {
    id: 'ddl-1',
    title: 'Math homework chapter 6',
    category: 'assignment',
    courseEventId: 'event-advanced-math',
    dueAt: '2026-04-08T23:59:00',
    priority: 4,
    status: 'pending',
    description: 'Finish all problem sets for chapter 6 and upload PDF.',
    note: 'Double check the derivation on question 4.',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'ddl-2',
    title: 'Submit internship application',
    category: 'application',
    courseEventId: null,
    dueAt: '2026-04-09T18:00:00',
    priority: 3,
    status: 'pending',
    description: 'Upload resume, transcript, and personal statement.',
    note: 'Use the latest resume version.',
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: 'ddl-3',
    title: 'Data Structures lab report',
    category: 'project',
    courseEventId: 'event-data-structures',
    dueAt: '2026-04-10T20:00:00',
    priority: 5,
    status: 'pending',
    description: 'Write the experiment summary and complexity analysis.',
    note: 'Screenshots of output are required.',
    createdAt: NOW,
    updatedAt: NOW,
  },
]

export async function ensureDemoData(): Promise<void> {
  const semesterCount = await db.semesters.count()
  const eventCount = await db.events.count()
  const deadlineCount = await db.deadlines.count()

  if (semesterCount > 0 || eventCount > 0 || deadlineCount > 0) {
    return
  }

  await db.semesters.add(DEMO_SEMESTER)
  await db.scheduleProfiles.add(DEMO_PROFILE)
  await db.timeSlots.bulkAdd(DEMO_TIME_SLOTS)
  await db.events.bulkAdd(DEMO_EVENTS)
  await db.recurringEventRules.bulkAdd(DEMO_RULES)
  await db.deadlines.bulkAdd(DEMO_DEADLINES)
}

export async function addDemoCourse(): Promise<void> {
  const timestamp = new Date().toISOString()
  const count = await db.events.count()
  const index = count + 1
  const eventId = `event-demo-extra-${index}`
  const slotId = DEMO_TIME_SLOTS[index % DEMO_TIME_SLOTS.length]?.id ?? 'slot-1'
  const weekday = ((index % 7) + 1) as RecurringEventRule['weekday']

  await db.events.add({
    id: eventId,
    title: `Demo Course ${index}`,
    type: 'course',
    location: `Room ${100 + index}`,
    description: '',
    note: 'Inserted for demo testing.',
    color: '#0f766e',
    priority: 2,
    semesterId: DEMO_SEMESTER_ID,
    isAllDay: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  await db.recurringEventRules.add({
    id: `rule-demo-extra-${index}`,
    eventId,
    weekday,
    timeSlotId: slotId,
    startWeek: 1,
    endWeek: 20,
    weekMode: 'all',
    customWeeks: [],
  })
}

export async function addDemoDeadline(): Promise<void> {
  const timestamp = new Date().toISOString()
  const count = await db.deadlines.count()
  const index = count + 1

  await db.deadlines.add({
    id: `ddl-demo-${index}`,
    title: `Demo DDL ${index}`,
    category: 'custom',
    courseEventId: null,
    dueAt: `2026-04-${String(10 + index).padStart(2, '0')}T18:00:00`,
    priority: index % 4 === 0 ? 4 : 2,
    status: 'pending',
    description: 'Inserted for demo testing.',
    note: 'Can be toggled done/pending.',
    createdAt: timestamp,
    updatedAt: timestamp,
  })
}
