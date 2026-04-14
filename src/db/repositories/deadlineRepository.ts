import { db } from '../schema'
import type { DeadlineItem, DeadlineStatus } from '../../types/deadline'

export const deadlineRepository = {
  async list(): Promise<DeadlineItem[]> {
    return db.deadlines.orderBy('dueAt').toArray()
  },

  async listByStatus(status: DeadlineStatus): Promise<DeadlineItem[]> {
    return db.deadlines.where('status').equals(status).sortBy('dueAt')
  },

  async getById(id: string): Promise<DeadlineItem | undefined> {
    return db.deadlines.get(id)
  },

  async create(deadline: DeadlineItem): Promise<string> {
    await db.deadlines.add(deadline)
    return deadline.id
  },

  async update(id: string, changes: Partial<DeadlineItem>): Promise<number> {
    return db.deadlines.update(id, changes)
  },

  async remove(id: string): Promise<void> {
    await db.deadlines.delete(id)
  },
}
