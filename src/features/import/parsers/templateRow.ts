import type { EventType } from '../../../types/event'
import type { Weekday } from '../../../types/schedule'
import type {
  ImportPreviewResult,
  ImportRowError,
  ImportRowWarning,
  ParsedImportRow,
  RawImportRow,
} from '../types'

const WEEKDAY_MAP: Record<string, Weekday> = {
  '1': 1,
  mon: 1,
  monday: 1,
  zhouyi: 1,
  xingqiyi: 1,
  zhou1: 1,
  xingqi1: 1,
  zhouyi_: 1,
  '2': 2,
  tue: 2,
  tues: 2,
  tuesday: 2,
  zhouer: 2,
  xingqier: 2,
  zhou2: 2,
  xingqi2: 2,
  '3': 3,
  wed: 3,
  wednesday: 3,
  zhousan: 3,
  xingqisan: 3,
  zhou3: 3,
  xingqi3: 3,
  '4': 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  zhousi: 4,
  xingqisi: 4,
  zhou4: 4,
  xingqi4: 4,
  '5': 5,
  fri: 5,
  friday: 5,
  zhouwu: 5,
  xingqiwu: 5,
  zhou5: 5,
  xingqi5: 5,
  '6': 6,
  sat: 6,
  saturday: 6,
  zhouliu: 6,
  xingqiliu: 6,
  zhou6: 6,
  xingqi6: 6,
  '7': 7,
  sun: 7,
  sunday: 7,
  zhouri: 7,
  zhoutian: 7,
  xingqiri: 7,
  xingqitian: 7,
  zhou7: 7,
  xingqi7: 7,
}

const TYPE_MAP: Record<string, EventType> = {
  course: 'course',
  exam: 'exam',
  meeting: 'meeting',
  activity: 'activity',
  custom: 'custom',
}

function toTrimmedString(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).trim()
}

function normalizeWeekdayKey(value: string) {
  return value
    .toLowerCase()
    .replace(/星期/g, 'xingqi')
    .replace(/周/g, 'zhou')
    .replace(/一/g, 'yi')
    .replace(/二/g, 'er')
    .replace(/三/g, 'san')
    .replace(/四/g, 'si')
    .replace(/五/g, 'wu')
    .replace(/六/g, 'liu')
    .replace(/日/g, 'ri')
    .replace(/天/g, 'tian')
    .replace(/\s+/g, '')
}

export function normalizeWeekday(value: string | number | null | undefined): Weekday | null {
  const rawValue = toTrimmedString(value)

  if (!rawValue) {
    return null
  }

  return WEEKDAY_MAP[normalizeWeekdayKey(rawValue)] ?? null
}

export function parseWeeksText(value: string | number | null | undefined): number[] | null {
  const rawValue = toTrimmedString(value)

  if (!rawValue) {
    return null
  }

  const chunks = rawValue
    .split(',')
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  const weeks = new Set<number>()

  for (const chunk of chunks) {
    if (chunk.includes('-')) {
      const [startText, endText] = chunk.split('-').map((part) => part.trim())
      const start = Number(startText)
      const end = Number(endText)

      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 1 ||
        end < 1 ||
        start > end
      ) {
        return null
      }

      for (let week = start; week <= end; week += 1) {
        weeks.add(week)
      }

      continue
    }

    const week = Number(chunk)

    if (!Number.isInteger(week) || week < 1) {
      return null
    }

    weeks.add(week)
  }

  return Array.from(weeks).sort((left, right) => left - right)
}

export function normalizeColor(
  value: string | number | null | undefined,
): { color: string | null; warning: ImportRowWarning | null } {
  const rawValue = toTrimmedString(value)

  if (!rawValue) {
    return {
      color: null,
      warning: null,
    }
  }

  const normalizedValue = rawValue.startsWith('#') ? rawValue : `#${rawValue}`

  if (/^#[0-9a-fA-F]{3}$/.test(normalizedValue) || /^#[0-9a-fA-F]{6}$/.test(normalizedValue)) {
    return {
      color: normalizedValue.toLowerCase(),
      warning: null,
    }
  }

  return {
    color: null,
    warning: {
      field: 'color',
      code: 'invalid_color',
      message: 'Color is invalid and will be ignored.',
    },
  }
}

function normalizeType(
  value: string | number | null | undefined,
): { type: EventType; warning: ImportRowWarning | null } {
  const rawValue = toTrimmedString(value).toLowerCase()

  if (!rawValue) {
    return {
      type: 'course',
      warning: null,
    }
  }

  const normalizedType = TYPE_MAP[rawValue]

  if (normalizedType) {
    return {
      type: normalizedType,
      warning: null,
    }
  }

  return {
    type: 'course',
    warning: {
      field: 'type',
      code: 'invalid_type',
      message: 'Type is invalid and has been normalized to course.',
    },
  }
}

function parsePositiveInteger(value: string | number | null | undefined): number | null {
  const rawValue = toTrimmedString(value)

  if (!rawValue) {
    return null
  }

  const parsedValue = Number(rawValue)

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return null
  }

  return parsedValue
}

export function validateImportRow(rawRow: RawImportRow): {
  errors: ImportRowError[]
  warnings: ImportRowWarning[]
  parsedRow: ParsedImportRow | null
} {
  const errors: ImportRowError[] = []
  const warnings: ImportRowWarning[] = []

  const title = toTrimmedString(rawRow.title)
  const weekday = normalizeWeekday(rawRow.weekday)
  const startSlot = parsePositiveInteger(rawRow.startSlot)
  const endSlot = parsePositiveInteger(rawRow.endSlot)
  const weeks = parseWeeksText(rawRow.weeks)
  const { color, warning: colorWarning } = normalizeColor(rawRow.color)
  const { type, warning: typeWarning } = normalizeType(rawRow.type)

  if (!title) {
    errors.push({
      field: 'title',
      code: 'missing_required_field',
      message: 'Title is required.',
    })
  }

  if (weekday === null) {
    errors.push({
      field: 'weekday',
      code: 'invalid_weekday',
      message: 'Weekday is required and must be a supported value.',
    })
  }

  if (startSlot === null) {
    errors.push({
      field: 'startSlot',
      code: 'invalid_slot',
      message: 'Start slot is required and must be a positive integer.',
    })
  }

  if (endSlot === null) {
    errors.push({
      field: 'endSlot',
      code: 'invalid_slot',
      message: 'End slot is required and must be a positive integer.',
    })
  }

  if (startSlot !== null && endSlot !== null && startSlot > endSlot) {
    errors.push({
      field: 'endSlot',
      code: 'invalid_slot',
      message: 'End slot must be greater than or equal to start slot.',
    })
  }

  if (weeks === null || weeks.length === 0) {
    errors.push({
      field: 'weeks',
      code: 'invalid_weeks',
      message: 'Weeks is required and must be a supported range/list format.',
    })
  }

  if (colorWarning) {
    warnings.push(colorWarning)
  }

  if (typeWarning) {
    warnings.push(typeWarning)
  }

  if (errors.length > 0 || weekday === null || startSlot === null || endSlot === null || !weeks || !title) {
    return {
      errors,
      warnings,
      parsedRow: null,
    }
  }

  return {
    errors,
    warnings,
    parsedRow: {
      title,
      weekday,
      startSlot,
      endSlot,
      weeks,
      location: toTrimmedString(rawRow.location),
      teacher: toTrimmedString(rawRow.teacher),
      note: toTrimmedString(rawRow.note),
      color,
      type,
    },
  }
}

export function parseTemplateRow(rawRow: RawImportRow): ImportPreviewResult {
  const { errors, warnings, parsedRow } = validateImportRow(rawRow)

  return {
    rawRow,
    parsedRow,
    errors,
    warnings,
    status:
      errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success',
  }
}
