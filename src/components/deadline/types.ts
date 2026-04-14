export type DeadlineListItem = {
  id: string
  title: string
  dueAt: string
  priority: number
  status: 'pending' | 'done'
  category: 'assignment' | 'project' | 'exam' | 'meeting' | 'application' | 'custom'
  description: string
  note: string
  courseName: string | null
}

export type DeadlineGroupKey = 'today' | 'tomorrow' | 'thisWeek' | 'later'

export type DeadlineGroup = {
  key: DeadlineGroupKey
  title: string
  items: DeadlineListItem[]
}
