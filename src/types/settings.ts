import type { AppTabKey } from './navigation'

export type ReminderTargetType = 'event' | 'deadline'

export type ReminderConfig = {
  id: string
  targetType: ReminderTargetType
  targetId: string
  enabled: boolean
  minutesBefore: number
  customRules: string[]
}

export type ThemeMode = 'system' | 'light' | 'dark'

export type DisplaySettings = {
  showDateInHeader: boolean
  showWeekdayInHeader: boolean
  showTimeInRowHeader: boolean
  showSlotLabelInRowHeader: boolean
  defaultHomeTab: AppTabKey
  themeMode: ThemeMode
  accentColor: string
  backgroundImage: string | null
}

export type DisplaySettingsRecord = DisplaySettings & {
  id: string
}

export const DISPLAY_SETTINGS_ID = 'display'

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  showDateInHeader: true,
  showWeekdayInHeader: true,
  showTimeInRowHeader: true,
  showSlotLabelInRowHeader: false,
  defaultHomeTab: 'timetable',
  themeMode: 'system',
  accentColor: '#0f172a',
  backgroundImage: null,
}
