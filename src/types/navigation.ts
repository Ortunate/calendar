export type AppTabKey = 'timetable' | 'deadlines' | 'settings'

export type TabItem = {
  key: AppTabKey
  label: string
}

export type TabPanel = {
  title: string
  subtitle: string
}

export const TAB_ITEMS: TabItem[] = [
  { key: 'timetable', label: 'Timetable' },
  { key: 'deadlines', label: 'Deadlines' },
  { key: 'settings', label: 'Settings' },
]

export const TAB_PANELS: Record<AppTabKey, TabPanel> = {
  timetable: {
    title: 'Timetable',
    subtitle: 'Today and next classes at a glance.',
  },
  deadlines: {
    title: 'Deadlines',
    subtitle: 'Assignments and events you should not miss.',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Preferences, import, and local data options.',
  },
}
