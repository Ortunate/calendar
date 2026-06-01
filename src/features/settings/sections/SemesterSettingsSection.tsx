import type { Semester } from '../../../types/semester'

export type SemesterFormValues = {
  name: string
  startDate: string
  endDate: string
  weekOneStartDate: string
  totalWeeks: number
}

type SemesterSettingsSectionProps = {
  semesters: Semester[]
  form: SemesterFormValues
  errorMessage?: string
  successMessage?: string
  onFormChange: (updater: (current: SemesterFormValues) => SemesterFormValues) => void
  onSwitchSemester: (semesterId: string) => void
  onCreateSemester: () => void
}

export function SemesterSettingsSection({
  semesters,
  form,
  errorMessage,
  successMessage,
  onFormChange,
  onSwitchSemester,
  onCreateSemester,
}: SemesterSettingsSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Semester settings</h2>
          <p className="mt-1 text-xs text-slate-500">
            View current semester, add one, and switch the active term.
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
          {semesters.length} total
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {semesters.map((semester) => (
          <button
            key={semester.id}
            type="button"
            onClick={() => onSwitchSemester(semester.id)}
            className={`block w-full rounded-xl border px-3 py-3 text-left ${
              semester.isCurrent
                ? 'border-slate-900 bg-white'
                : 'border-slate-200 bg-white active:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{semester.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Week one: {semester.weekOneStartDate}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                {semester.isCurrent ? 'Current' : 'Switch'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {successMessage ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-900">
          {successMessage}
        </div>
      ) : null}

      <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
        <h3 className="text-sm font-semibold text-slate-900">Add semester</h3>
        <input
          value={form.name}
          onChange={(event) =>
            onFormChange((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          placeholder="Semester name"
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
        />
        <p className="text-[11px] leading-5 text-slate-500">
          Use a short name like 2026 Fall or Spring 2027.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-600">Start date</span>
            <input
              type="date"
              value={form.startDate}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            />
            <span className="block text-[11px] leading-5 text-slate-500">
              First calendar day of the term.
            </span>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-600">End date</span>
            <input
              type="date"
              value={form.endDate}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            />
            <span className="block text-[11px] leading-5 text-slate-500">
              Last calendar day of the term.
            </span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-600">Week one starts</span>
            <input
              type="date"
              value={form.weekOneStartDate}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  weekOneStartDate: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            />
            <span className="block text-[11px] leading-5 text-slate-500">
              The Monday or first day used for week 1. If empty, start date is used.
            </span>
          </label>
          <label className="space-y-1">
            <span className="text-[11px] font-medium text-slate-600">Total weeks</span>
            <input
              type="number"
              min={1}
              value={form.totalWeeks}
              onChange={(event) =>
                onFormChange((current) => ({
                  ...current,
                  totalWeeks: Number(event.target.value) || 1,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
            />
            <span className="block text-[11px] leading-5 text-slate-500">
              Usually 16 to 20 teaching weeks.
            </span>
          </label>
        </div>
        {errorMessage ? (
          <p className="text-xs text-rose-600">{errorMessage}</p>
        ) : null}
        <button
          type="button"
          onClick={onCreateSemester}
          className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white active:opacity-90"
        >
          Create semester
        </button>
      </div>
    </section>
  )
}
