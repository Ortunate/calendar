import type { AppTabKey } from '../../../types/navigation'
import type { DisplaySettings } from '../../../types/settings'

type DisplaySettingsSectionProps = {
  displayForm: DisplaySettings
  homeTabOptions: AppTabKey[]
  onUpdateField: <K extends keyof DisplaySettings>(
    field: K,
    value: DisplaySettings[K],
  ) => void
  onSave: () => void
}

export function DisplaySettingsSection({
  displayForm,
  homeTabOptions,
  onUpdateField,
  onSave,
}: DisplaySettingsSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Display settings</h2>
          <p className="mt-1 text-xs text-slate-500">
            Persist timetable visibility defaults and home tab.
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
        >
          Save
        </button>
      </div>

      <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
        <label className="flex items-center justify-between gap-3 text-sm text-slate-800">
          <span>Show date in header</span>
          <input
            type="checkbox"
            checked={displayForm.showDateInHeader}
            onChange={(event) => onUpdateField('showDateInHeader', event.target.checked)}
          />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm text-slate-800">
          <span>Show weekday in header</span>
          <input
            type="checkbox"
            checked={displayForm.showWeekdayInHeader}
            onChange={(event) => onUpdateField('showWeekdayInHeader', event.target.checked)}
          />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm text-slate-800">
          <span>Show time in row header</span>
          <input
            type="checkbox"
            checked={displayForm.showTimeInRowHeader}
            onChange={(event) => onUpdateField('showTimeInRowHeader', event.target.checked)}
          />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm text-slate-800">
          <span>Show slot label in row header</span>
          <input
            type="checkbox"
            checked={displayForm.showSlotLabelInRowHeader}
            onChange={(event) =>
              onUpdateField('showSlotLabelInRowHeader', event.target.checked)
            }
          />
        </label>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600">Default home tab</label>
          <select
            value={displayForm.defaultHomeTab}
            onChange={(event) =>
              onUpdateField('defaultHomeTab', event.target.value as AppTabKey)
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
          >
            {homeTabOptions.map((tab) => (
              <option key={tab} value={tab}>
                {tab}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  )
}
