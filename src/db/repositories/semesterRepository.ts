import { db } from '../schema'
import type { Semester } from '../../types/semester'

export const semesterRepository = {
  async list(): Promise<Semester[]> {
    return db.semesters.orderBy('startDate').toArray()
  },

  async getById(id: string): Promise<Semester | undefined> {
    return db.semesters.get(id)
  },

  async getCurrent(): Promise<Semester | undefined> {
    return db.semesters.filter((semester) => semester.isCurrent).first()
  },

  async create(semester: Semester): Promise<string> {
    await db.semesters.add(semester)
    return semester.id
  },

  async update(id: string, changes: Partial<Semester>): Promise<number> {
    return db.semesters.update(id, changes)
  },

  async remove(id: string): Promise<void> {
    await db.semesters.delete(id)
  },
}
