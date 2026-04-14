import { useEffect, useMemo, useState } from 'react'
import { db } from '../../db/schema'
import type { Event } from '../../types/event'
import type { RecurringEventRule, TimeSlot } from '../../types/schedule'
import type { Semester } from '../../types/semester'
import { mapParsedRowToImportCandidate } from './candidateBuilders'
import { ImportFilePicker } from './components/ImportFilePicker'
import { ImportPreviewList } from './components/ImportPreviewList'
import { ImportSummary } from './components/ImportSummary'
import type { ImportSheetRow } from './fileReaders'
import { readCsvRows, readImportWorkbook, readSheetRows } from './fileReaders'
import { parseTemplateRow } from './parsers/templateRow'
import type { ImportCandidate, RawImportRow } from './types'

type CourseImportPageProps = {
  onBack: () => void
}

type ImportResultSummary = {
  totalRows: number
  imported: number
  blockedCandidates: number
  parseErrors: number
  warnings: number
}

const WEEKDAY_LABELS = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
} as const

function normalizeHeaderKey(header: string) {
  return header.toLowerCase().replace(/[\s_-]+/g, '')
}

function mapSheetRowToRawImportRow(row: ImportSheetRow): RawImportRow {
  const normalizedRow = new Map(
    Object.entries(row).map(([key, value]) => [normalizeHeaderKey(key), value]),
  )

  return {
    title: normalizedRow.get('title') ?? '',
    weekday: normalizedRow.get('weekday') ?? '',
    startSlot: normalizedRow.get('startslot') ?? '',
    endSlot: normalizedRow.get('endslot') ?? '',
    weeks: normalizedRow.get('weeks') ?? '',
    location: normalizedRow.get('location') ?? '',
    teacher: normalizedRow.get('teacher') ?? '',
    note: normalizedRow.get('note') ?? '',
    color: normalizedRow.get('color') ?? '',
    type: normalizedRow.get('type') ?? '',
  }
}

function isXlsxFile(file: File) {
  return file.name.toLowerCase().endsWith('.xlsx')
}

function formatWeekdayLabel(weekday: keyof typeof WEEKDAY_LABELS) {
  return WEEKDAY_LABELS[weekday]
}

function isContinuousWeeks(weeks: number[]) {
  if (weeks.length === 0) {
    return false
  }

  const sortedWeeks = [...weeks].sort((left, right) => left - right)

  return sortedWeeks.every((week, index) => week === sortedWeeks[0] + index)
}

function formatWeeksSummary(candidate: ImportCandidate) {
  if (candidate.errors.some((error) => error.field === 'weeks')) {
    return candidate.errors.find((error) => error.field === 'weeks')?.message ?? 'Weeks could not be imported.'
  }

  if (candidate.recurringRulePayload) {
    if (candidate.recurringRulePayload.weekMode === 'custom') {
      return `Custom weeks: ${candidate.recurringRulePayload.customWeeks.join(', ')}`
    }

    return `Weeks ${candidate.recurringRulePayload.startWeek}-${candidate.recurringRulePayload.endWeek}`
  }

  if (candidate.parsedRow.weeks.length === 0) {
    return 'Weeks could not be parsed for import.'
  }

  if (isContinuousWeeks(candidate.parsedRow.weeks)) {
    return `Weeks ${candidate.parsedRow.weeks[0]}-${candidate.parsedRow.weeks[candidate.parsedRow.weeks.length - 1]}`
  }

  return `Custom weeks: ${candidate.parsedRow.weeks.join(', ')}`
}

function formatCandidatePlacement(candidate: ImportCandidate) {
  const weekdayLabel = formatWeekdayLabel(candidate.parsedRow.weekday)

  if (!candidate.matchedTimeSlot) {
    const blockingReason = candidate.errors[0]?.message ?? 'No matching TimeSlot was found.'

    return {
      headline: `${weekdayLabel} · Blocked`,
      detail: blockingReason,
    }
  }

  return {
    headline: `${weekdayLabel} · ${candidate.matchedTimeSlot.label}`,
    detail: `Matched to TimeSlot ${candidate.matchedTimeSlot.startUnit}-${candidate.matchedTimeSlot.endUnit} · ${candidate.matchedTimeSlot.startTime}-${candidate.matchedTimeSlot.endTime}`,
  }
}

export function CourseImportPage({ onBack }: CourseImportPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [selectedSheetName, setSelectedSheetName] = useState('')
  const [rows, setRows] = useState<ImportSheetRow[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentSemester, setCurrentSemester] = useState<Semester | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [existingEvents, setExistingEvents] = useState<Event[]>([])
  const [existingRules, setExistingRules] = useState<RecurringEventRule[]>([])
  const [resultSummary, setResultSummary] = useState<ImportResultSummary | null>(null)

  useEffect(() => {
    void hydrateImportContext()
  }, [])

  async function hydrateImportContext() {
    const semester = (await db.semesters.filter((item) => item.isCurrent).first()) ?? null
    const matchedTimeSlots = semester
      ? await db.timeSlots
          .where('scheduleProfileId')
          .equals(semester.scheduleProfileId)
          .sortBy('order')
      : []
    const semesterEvents = semester
      ? await db.events.where('semesterId').equals(semester.id).toArray()
      : []
    const recurringRules = await db.recurringEventRules.toArray()

    setCurrentSemester(semester)
    setTimeSlots(matchedTimeSlots)
    setExistingEvents(semesterEvents)
    setExistingRules(recurringRules)
  }

  const previewResults = useMemo(
    () => rows.map((row) => parseTemplateRow(mapSheetRowToRawImportRow(row))),
    [rows],
  )

  const importCandidates = useMemo<ImportCandidate[]>(
    () =>
      previewResults
        .filter((result) => result.parsedRow !== null)
        .map((result) =>
          mapParsedRowToImportCandidate(
            result.parsedRow!,
            currentSemester,
            timeSlots,
            existingEvents,
            existingRules,
            result.warnings,
          ),
        ),
    [currentSemester, existingEvents, existingRules, previewResults, timeSlots],
  )

  const summary = useMemo<ImportResultSummary>(() => {
    const blockedCandidates = importCandidates.filter((candidate) => !candidate.canImport).length
    const parseErrors = previewResults.filter((result) => result.status === 'error').length
    const parseWarnings = previewResults.reduce(
      (count, result) => count + result.warnings.length,
      0,
    )
    const candidateWarnings = importCandidates.reduce(
      (count, candidate) =>
        count +
        candidate.warnings.filter((warning) => warning.code === 'possible_duplicate').length,
      0,
    )
    const warnings = parseWarnings + candidateWarnings

    return {
      totalRows: rows.length,
      imported: 0,
      blockedCandidates,
      parseErrors,
      warnings,
    }
  }, [importCandidates, previewResults, rows.length])

  async function handleFileChange(file: File | null) {
    setSelectedFile(file)
    setSheetNames([])
    setSelectedSheetName('')
    setRows([])
    setErrorMessage('')
    setResultSummary(null)

    if (!file) {
      return
    }

    setIsLoading(true)

    try {
      if (isXlsxFile(file)) {
        const workbook = await readImportWorkbook(file)
        setSheetNames(workbook.sheetNames)
        setSelectedSheetName(workbook.sheetNames[0] ?? '')
        setRows(workbook.rows)
      } else {
        const csvRows = await readCsvRows(file)
        setRows(csvRows)
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to read import file.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSheetChange(sheetName: string) {
    if (!selectedFile) {
      return
    }

    setSelectedSheetName(sheetName)
    setErrorMessage('')
    setResultSummary(null)
    setIsLoading(true)

    try {
      const nextRows = await readSheetRows(selectedFile, sheetName)
      setRows(nextRows)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to read selected sheet.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConfirmImport() {
    const validCandidates = importCandidates.filter((candidate) => candidate.canImport)

    if (validCandidates.length === 0) {
      setResultSummary({
        ...summary,
        imported: 0,
      })
      return
    }

    await db.transaction('rw', db.events, db.recurringEventRules, async () => {
      for (const candidate of validCandidates) {
        if (!candidate.eventPayload || !candidate.recurringRulePayload) {
          continue
        }

        await db.events.add(candidate.eventPayload)
        await db.recurringEventRules.add(candidate.recurringRulePayload)
      }
    })

    setResultSummary({
      ...summary,
      imported: validCandidates.length,
    })
    await hydrateImportContext()
  }

  if (resultSummary) {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h1 className="text-base font-semibold text-slate-900">Import result</h1>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Course template processing is complete for this upload.
          </p>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="text-sm font-semibold text-emerald-900">Result summary</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Total rows
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {resultSummary.totalRows}
              </p>
            </div>
            <div className="rounded-xl bg-white px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                Imported
              </p>
              <p className="mt-1 text-lg font-semibold text-emerald-900">
                {resultSummary.imported}
              </p>
            </div>
            <div className="rounded-xl bg-white px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">
                Blocked candidates
              </p>
              <p className="mt-1 text-lg font-semibold text-amber-900">
                {resultSummary.blockedCandidates}
              </p>
            </div>
            <div className="rounded-xl bg-white px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-rose-700">
                Parse errors
              </p>
              <p className="mt-1 text-lg font-semibold text-rose-900">
                {resultSummary.parseErrors}
              </p>
            </div>
            <div className="rounded-xl bg-white px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-sky-700">
                Warnings
              </p>
              <p className="mt-1 text-lg font-semibold text-sky-900">
                {resultSummary.warnings}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-emerald-900">
            You can now return to Timetable to verify imported courses.
          </p>
        </section>

        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
        >
          Back to settings
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              Import courses from template
            </h1>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Upload a standard CSV or XLSX template and review parsed rows before import.
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Expected columns: title, weekday, startSlot, endSlot, weeks, location,
              teacher, note, color, type.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
          >
            Back
          </button>
        </div>
      </section>

      <ImportFilePicker
        fileName={selectedFile?.name ?? ''}
        sheetNames={sheetNames}
        selectedSheetName={selectedSheetName}
        onFileChange={(file) => void handleFileChange(file)}
        onSheetChange={(sheetName) => void handleSheetChange(sheetName)}
      />

      {isLoading ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          Reading template...
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {errorMessage}
        </section>
      ) : null}

      {rows.length > 0 ? (
        <>
          <ImportSummary
            total={summary.totalRows}
            successCount={Math.max(
              summary.totalRows - summary.blockedCandidates - summary.parseErrors,
              0,
            )}
            warningCount={summary.warnings}
            errorCount={summary.parseErrors}
          />
          <ImportPreviewList results={previewResults} />
        </>
      ) : null}

      {importCandidates.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Import candidates</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Candidate mapping is ready. Only rows marked Ready will be imported.
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Warnings do not block import. Only blocked rows are skipped.
          </p>

          <div className="mt-3 space-y-2">
            {importCandidates.map((candidate, index) => (
              <div
                key={`${candidate.parsedRow.title}-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
              >
                {(() => {
                  const placement = formatCandidatePlacement(candidate)
                  const weeksSummary = formatWeeksSummary(candidate)
                  const primaryError = candidate.errors[0]?.message ?? ''

                  return (
                    <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {candidate.parsedRow.title}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-700">
                      {placement.headline}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {placement.detail}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    {candidate.canImport ? 'Ready' : 'Blocked'}
                  </span>
                </div>

                <div className="mt-2 space-y-1 rounded-lg bg-white px-3 py-2">
                  <p className="text-xs text-slate-700">{weeksSummary}</p>
                  {candidate.canImport ? (
                    <p className="text-xs text-slate-500">
                      Ready to import into this weekday and TimeSlot.
                    </p>
                  ) : (
                    <p className="text-xs text-rose-700">
                      Blocked: {primaryError || 'This row cannot be imported yet.'}
                    </p>
                  )}
                </div>

                {candidate.errors.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs text-rose-700">
                    {candidate.errors.map((error, errorIndex) => (
                      <li key={`${error.code}-${errorIndex}`}>{error.message}</li>
                    ))}
                  </ul>
                ) : null}

                {candidate.warnings.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-xs text-amber-700">
                    {candidate.warnings.map((warning, warningIndex) => (
                      <li key={`${warning.code}-${warningIndex}`}>{warning.message}</li>
                    ))}
                  </ul>
                ) : null}
                    </>
                  )
                })()}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void handleConfirmImport()}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            Confirm import
          </button>
        </section>
      ) : null}

    </div>
  )
}
