import type { Event, EventType } from '../../types/event'
import type { RecurringEventRule, TimeSlot, Weekday } from '../../types/schedule'

export type RawImportRow = {
  title?: string | number | null
  weekday?: string | number | null
  startSlot?: string | number | null
  endSlot?: string | number | null
  weeks?: string | number | null
  location?: string | number | null
  teacher?: string | number | null
  note?: string | number | null
  color?: string | number | null
  type?: string | number | null
}

export type ParsedImportRow = {
  title: string
  weekday: Weekday
  startSlot: number
  endSlot: number
  weeks: number[]
  location: string
  teacher: string
  note: string
  color: string | null
  type: EventType
}

export type ImportRowIssueCode =
  | 'missing_required_field'
  | 'invalid_weekday'
  | 'invalid_slot'
  | 'invalid_weeks'
  | 'invalid_color'
  | 'invalid_type'
  | 'possible_duplicate'

export type ImportRowError = {
  field: keyof RawImportRow
  code: ImportRowIssueCode
  message: string
}

export type ImportRowWarning = {
  field: keyof RawImportRow
  code: ImportRowIssueCode
  message: string
}

export type ImportPreviewStatus = 'success' | 'warning' | 'error'

export type ImportPreviewResult = {
  rawRow: RawImportRow
  parsedRow: ParsedImportRow | null
  errors: ImportRowError[]
  warnings: ImportRowWarning[]
  status: ImportPreviewStatus
}

export type ImportCandidate = {
  // Parsed row is the normalized import input after template parsing succeeds.
  parsedRow: ParsedImportRow

  // Match result: which existing TimeSlot this row resolves to, if any.
  matchedTimeSlot: TimeSlot | null

  // Pre-write payloads: these are ready-to-insert objects, not persisted entities yet.
  eventPayload: Event | null
  recurringRulePayload: RecurringEventRule | null

  // Warnings are non-blocking hints. Errors block import for this row.
  warnings: ImportRowWarning[]
  errors: ImportRowError[]

  // A row can import only when required matching succeeds and no blocking errors remain.
  canImport: boolean
}
