import { CalendarDays, ListChecks, Settings } from 'lucide-react'
import type { AppTabKey, TabItem } from '../../types/navigation'

type BottomTabBarProps = {
  items: TabItem[]
  activeTab: AppTabKey
  onTabChange: (tab: AppTabKey) => void
}

function tabIcon(tab: AppTabKey) {
  if (tab === 'timetable') return CalendarDays
  if (tab === 'deadlines') return ListChecks
  return Settings
}

export function BottomTabBar({
  items,
  activeTab,
  onTabChange,
}: BottomTabBarProps) {
  return (
    <nav className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-3 py-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur">
      <ul className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const isActive = item.key === activeTab
          const Icon = tabIcon(item.key)

          return (
            <li key={item.key}>
              <button
                type="button"
                className={`flex w-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
                onClick={() => onTabChange(item.key)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
