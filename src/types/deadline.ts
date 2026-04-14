export type DeadlineCategory =
  | 'assignment'
  | 'project'
  | 'exam'
  | 'meeting'
  | 'application'
  | 'custom'

export type DeadlineStatus = 'pending' | 'done'

export type DeadlineItem = {
  id: string
  title: string
  category: DeadlineCategory
  courseEventId: string | null
  dueAt: string
  priority: number
  status: DeadlineStatus
  description: string
  note: string
  createdAt: string
  updatedAt: string
}
