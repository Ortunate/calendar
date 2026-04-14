import { db } from '../schema'
import type { EventException } from '../../types/event'

export const eventExceptionRepository = {
  async listByEventId(eventId: string): Promise<EventException[]> {
    return db.eventExceptions
      .where('eventId')
      .equals(eventId)
      .sortBy('originalDate')
  },

  async getById(id: string): Promise<EventException | undefined> {
    return db.eventExceptions.get(id)
  },

  async create(exception: EventException): Promise<string> {
    await db.eventExceptions.add(exception)
    return exception.id
  },

  async update(id: string, changes: Partial<EventException>): Promise<number> {
    return db.eventExceptions.update(id, changes)
  },

  async remove(id: string): Promise<void> {
    await db.eventExceptions.delete(id)
  },
}
