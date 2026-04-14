type ImportFilePickerProps = {
  fileName: string
  sheetNames: string[]
  selectedSheetName: string
  onFileChange: (file: File | null) => void
  onSheetChange: (sheetName: string) => void
}

export function ImportFilePicker({
  fileName,
  sheetNames,
  selectedSheetName,
  onFileChange,
  onSheetChange,
}: ImportFilePickerProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h2 className="text-sm font-semibold text-slate-900">Upload template</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Upload a standard course template in CSV or XLSX format.
      </p>

      <div className="mt-3 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">
            File
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
          />
        </label>

        {fileName ? (
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700">
            {fileName}
          </div>
        ) : null}

        {sheetNames.length > 1 ? (
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">
              Sheet
            </span>
            <select
              value={selectedSheetName}
              onChange={(event) => onSheetChange(event.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
            >
              {sheetNames.map((sheetName) => (
                <option key={sheetName} value={sheetName}>
                  {sheetName}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </section>
  )
}
