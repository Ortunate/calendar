import dayjs from 'dayjs'
import type { DeadlineFormPayload } from '../../components/forms/DeadlineForm'
import type {
  DeadlineGroup,
  DeadlineGroupKey,
  DeadlineListItem,
} from '../../components/deadline/types'
import { addDemoDeadline, ensureDemoData } from '../../db/demoData'
import { deadlineRepository } from '../../db/repositories/deadlineRepository'
import { db } from '../../db/schema'
import type { DeadlineItem } from '../../types/deadline'

const NOW = dayjs('2026-04-08T09:00:00')

export type DeadlineSnapshot = {
  rawDeadlines: DeadlineItem[]
  items: DeadlineListItem[]
}

function getGroupKey(item: DeadlineListItem): DeadlineGroupKey {
  const due = dayjs(item.dueAt)

  if (due.isSame(NOW, 'day')) {
    return 'today'
  }

  if (due.isSame(NOW.add(1, 'day'), 'day')) {
    return 'tomorrow'
  }

  if (
    due.isAfter(NOW.endOf('day')) &&
    due.isBefore(NOW.endOf('week').add(1, 'millisecond'))
  ) {
    return 'thisWeek'
  }

  return 'later'
}

export function buildDeadlineGroups(items: DeadlineListItem[]): DeadlineGroup[] {
  const grouped: Record<DeadlineGroupKey, DeadlineListItem[]> = {
    today: [],
    tomorrow: [],
    thisWeek: [],
    later: [],
  }

  items.forEach((item) => {
    grouped[getGroupKey(item)].push(item)
  })

  return [
    { key: 'today', title: 'Today', items: grouped.today },
    { key: 'tomorrow', title: 'Tomorrow', items: grouped.tomorrow },
    { key: 'thisWeek', title: 'This Week', items: grouped.thisWeek },
    { key: 'later', title: 'Later', items: grouped.later },
  ]
}

export async function loadDeadlineSnapshot(): Promise<DeadlineSnapshot> {
  await ensureDemoData()

  const [deadlines, events] = await Promise.all([
    deadlineRepository.list(),
    db.events.toArray(),
  ])

  const eventMap = new Map(events.map((event) => [event.id, event.title]))

  return {
    rawDeadlines: deadlines,
    items: deadlines.map((deadline) => ({
      id: deadline.id,
      title: deadline.title,
      dueAt: dayjs(deadline.dueAt).format('YYYY-MM-DD HH:mm'),
      priority: deadline.priority,
      status: deadline.status,
      category: deadline.category,
      description: deadline.description,
      note: deadline.note,
      courseName: deadline.courseEventId
        ? (eventMap.get(deadline.courseEventId) ?? null)
        : null,
    })),
  }
}

export async function toggleDeadlineStatusById(id: string) {
  const current = await deadlineRepository.getById(id)

  if (!current) {
    return
  }

  await deadlineRepository.update(id, {
    status: current.status === 'done' ? 'pending' : 'done',
    updatedAt: new Date().toISOString(),
  })
}

export async function createDeadlineFromPayload(payload: DeadlineFormPayload) {
  const timestamp = new Date().toISOString()

  await deadlineRepository.create({
    ...payload,
    id: crypto.randomUUID(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })
}

export async function updateDeadlineFromPayload(
  editingDeadline: DeadlineItem,
  payload: DeadlineFormPayload,
) {
  await deadlineRepository.update(editingDeadline.id, {
    title: payload.title,
    category: payload.category,
    courseEventId: payload.courseEventId,
    dueAt: payload.dueAt,
    priority: payload.priority,
    description: payload.description,
    note: payload.note,
    updatedAt: new Date().toISOString(),
  })
}

export async function deleteDeadlineById(id: string) {
  await deadlineRepository.remove(id)
}

export { addDemoDeadline }
