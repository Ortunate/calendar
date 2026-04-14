import { db } from '../schema'
import type { Event } from '../../types/event'

export const eventRepository = {
  async list(): Promise<Event[]> {
    return db.events.orderBy('updatedAt').reverse().toArray()
  },

  async listBySemester(semesterId: string): Promise<Event[]> {
    return db.events.where('semesterId').equals(semesterId).sortBy('title')
  },

  async getById(id: string): Promise<Event | undefined> {
    return db.events.get(id)
  },

  async create(event: Event): Promise<string> {
    await db.events.add(event)
    return event.id
  },

  async update(id: string, changes: Partial<Event>): Promise<number> {
    return db.events.update(id, changes)
  },

  async remove(id: string): Promise<void> {
    await db.events.delete(id)
  },
}
