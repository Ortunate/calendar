import { useEffect, useState } from 'react'
import { BottomTabBar } from './components/common/BottomTabBar'
import { ensureDemoData } from './db/demoData'
import { settingsRepository } from './db/repositories/settingsRepository'
import { DeadlinesPage } from './features/deadline/DeadlinesPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { TimetablePage } from './features/timetable/TimetablePage'
import {
  DEFAULT_DISPLAY_SETTINGS,
  type DisplaySettings,
} from './types/settings'
import {
  TAB_ITEMS,
  TAB_PANELS,
  type AppTabKey,
} from './types/navigation'

function App() {
  const [activeTab, setActiveTab] = useState<AppTabKey>('timetable')
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(
    DEFAULT_DISPLAY_SETTINGS,
  )
  const panel = TAB_PANELS[activeTab]
  const page = {
    timetable: <TimetablePage displaySettings={displaySettings} />,
    deadlines: <DeadlinesPage />,
    settings: (
      <SettingsPage
        displaySettings={displaySettings}
        onDisplaySettingsChange={setDisplaySettings}
      />
    ),
  }[activeTab]

  useEffect(() => {
    async function bootstrap() {
      await ensureDemoData()
      const nextDisplaySettings = await settingsRepository.getDisplaySettings()
      setDisplaySettings(nextDisplaySettings)
      setActiveTab(nextDisplaySettings.defaultHomeTab)
    }

    void bootstrap()
  }, [])

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white">
        <header className="border-b border-slate-200 px-4 pb-4 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Campus Planner
          </p>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">{panel.title}</h1>
              <p className="mt-1 text-sm text-slate-500">{panel.subtitle}</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              MVP
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 pb-24">{page}</main>

        <BottomTabBar
          items={TAB_ITEMS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  )
}

export default App
