import type { ChangeEvent, RefObject } from 'react'

type ImportExportSettingsSectionProps = {
  fileInputRef: RefObject<HTMLInputElement | null>
  onExportJson: () => void
  onImportFile: (event: ChangeEvent<HTMLInputElement>) => void
  onOpenCourseImport: () => void
}

export function ImportExportSettingsSection({
  fileInputRef,
  onExportJson,
  onImportFile,
  onOpenCourseImport,
}: ImportExportSettingsSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h2 className="text-sm font-semibold text-slate-900">Import and export</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Export a full JSON backup or restore from a previous backup file.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={onExportJson}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
        >
          Export all data as JSON
        </button>
        <button
          type="button"
          onClick={onOpenCourseImport}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
        >
          Import courses from template
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
        >
          Import data from JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={onImportFile}
          className="hidden"
        />
      </div>
    </section>
  )
}
