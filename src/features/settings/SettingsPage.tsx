import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { db } from '../../db/schema'
import { settingsRepository } from '../../db/repositories/settingsRepository'
import {
  exportAllDataAsJson,
  importAllDataFromJson,
  parseBackupJson,
  stringifyBackup,
} from '../../lib/importExport/jsonBackup'
import { CourseImportPage } from '../import/CourseImportPage'
import type { AppTabKey } from '../../types/navigation'
import type { TimeSlot } from '../../types/schedule'
import type { DisplaySettings } from '../../types/settings'
import type { Semester } from '../../types/semester'
import {
  SemesterSettingsSection,
  type SemesterFormValues,
} from './sections/SemesterSettingsSection'
import {
  ScheduleSettingsSection,
  type TimeSlotFormValues,
} from './sections/ScheduleSettingsSection'
import { DisplaySettingsSection } from './sections/DisplaySettingsSection'
import { ImportExportSettingsSection } from './sections/ImportExportSettingsSection'

type SettingsPageProps = {
  displaySettings: DisplaySettings
  onDisplaySettingsChange: (settings: DisplaySettings) => void
}

function formatDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function buildDefaultSemesterForm(): SemesterFormValues {
  const startDate = new Date()
  const endDate = new Date(startDate)

  endDate.setDate(startDate.getDate() + 20 * 7 - 1)

  return {
    name: '',
    startDate: formatDateInputValue(startDate),
    endDate: formatDateInputValue(endDate),
    weekOneStartDate: formatDateInputValue(startDate),
    totalWeeks: 20,
  }
}

const DEFAULT_TIME_SLOT_FORM: TimeSlotFormValues = {
  label: '',
  startTime: '',
  endTime: '',
  startUnit: 1,
  endUnit: 2,
  order: 1,
}

const HOME_TAB_OPTIONS: AppTabKey[] = ['timetable', 'deadlines', 'settings']

export function SettingsPage({
  displaySettings,
  onDisplaySettingsChange,
}: SettingsPageProps) {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [currentSemesterId, setCurrentSemesterId] = useState<string | null>(null)
  const [currentProfileName, setCurrentProfileName] = useState('No profile')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [semesterForm, setSemesterForm] =
    useState<SemesterFormValues>(() => buildDefaultSemesterForm())
  const [timeSlotForm, setTimeSlotForm] =
    useState<TimeSlotFormValues>(DEFAULT_TIME_SLOT_FORM)
  const [displayForm, setDisplayForm] = useState<DisplaySettings>(displaySettings)
  const [editingTimeSlotId, setEditingTimeSlotId] = useState<string | null>(null)
  const [semesterFormError, setSemesterFormError] = useState('')
  const [semesterSwitchMessage, setSemesterSwitchMessage] = useState('')
  const [timeSlotFormError, setTimeSlotFormError] = useState('')
  const [showCourseImportPage, setShowCourseImportPage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setDisplayForm(displaySettings)
  }, [displaySettings])

  useEffect(() => {
    void hydrateSettings()
  }, [])

  async function hydrateSettings() {
    const allSemesters = await db.semesters.orderBy('startDate').toArray()
    const currentSemester = allSemesters.find((semester) => semester.isCurrent) ?? null

    setSemesters(allSemesters)
    setCurrentSemesterId(currentSemester?.id ?? null)

    if (!currentSemester) {
      setCurrentProfileName('No profile')
      setTimeSlots([])
      return
    }

    const profile = await db.scheduleProfiles.get(currentSemester.scheduleProfileId)
    const nextTimeSlots = await db.timeSlots
      .where('scheduleProfileId')
      .equals(currentSemester.scheduleProfileId)
      .sortBy('order')

    setCurrentProfileName(profile?.name ?? 'Default schedule')
    setTimeSlots(nextTimeSlots)
  }

  function updateDisplayField<K extends keyof DisplaySettings>(
    field: K,
    value: DisplaySettings[K],
  ) {
    setDisplayForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSaveDisplaySettings() {
    await settingsRepository.saveDisplaySettings(displayForm)
    onDisplaySettingsChange(displayForm)
  }

  async function handleSwitchSemester(semesterId: string) {
    const nextSemesterName =
      semesters.find((semester) => semester.id === semesterId)?.name ?? 'Selected semester'
    const updates = semesters.map((semester) =>
      db.semesters.update(semester.id, {
        isCurrent: semester.id === semesterId,
      }),
    )

    await Promise.all(updates)
    setSemesterSwitchMessage(`Switched to ${nextSemesterName}`)
    await hydrateSettings()
  }

  async function handleCreateSemester() {
    if (
      !semesterForm.name.trim() ||
      !semesterForm.startDate ||
      !semesterForm.endDate
    ) {
      setSemesterFormError('Name, start date, and end date are required.')
      return
    }

    setSemesterFormError('')

    const weekOneStartDate = semesterForm.weekOneStartDate || semesterForm.startDate
    const semesterId = crypto.randomUUID()
    const profileId = crypto.randomUUID()
    const sourceSemester = semesters.find((semester) => semester.isCurrent) ?? null
    const sourceTimeSlots = sourceSemester
      ? await db.timeSlots
          .where('scheduleProfileId')
          .equals(sourceSemester.scheduleProfileId)
          .sortBy('order')
      : []

    await db.scheduleProfiles.add({
      id: profileId,
      name: `${semesterForm.name.trim()} schedule`,
      semesterId,
      description: 'Auto-created schedule profile',
    })

    await Promise.all(
      semesters.map((semester) =>
        db.semesters.update(semester.id, {
          isCurrent: false,
        }),
      ),
    )

    await db.semesters.add({
      id: semesterId,
      name: semesterForm.name.trim(),
      startDate: semesterForm.startDate,
      endDate: semesterForm.endDate,
      weekOneStartDate,
      totalWeeks: semesterForm.totalWeeks,
      scheduleProfileId: profileId,
      isCurrent: true,
    })

    if (sourceTimeSlots.length > 0) {
      await db.timeSlots.bulkAdd(
        sourceTimeSlots.map((slot) => ({
          ...slot,
          id: crypto.randomUUID(),
          scheduleProfileId: profileId,
        })),
      )
    }

    setSemesterForm(buildDefaultSemesterForm())
    setSemesterSwitchMessage(`Switched to ${semesterForm.name.trim()}`)
    await hydrateSettings()
  }

  function beginEditTimeSlot(slot: TimeSlot) {
    setEditingTimeSlotId(slot.id)
    setTimeSlotForm({
      id: slot.id,
      label: slot.label,
      startTime: slot.startTime,
      endTime: slot.endTime,
      startUnit: slot.startUnit,
      endUnit: slot.endUnit,
      order: slot.order,
    })
  }

  async function handleSaveTimeSlot() {
    if (
      !currentSemesterId ||
      !timeSlotForm.label.trim() ||
      timeSlotForm.startUnit > timeSlotForm.endUnit
    ) {
      setTimeSlotFormError(
        !currentSemesterId
          ? 'Choose a current semester first.'
          : !timeSlotForm.label.trim()
            ? 'Label is required.'
            : 'Start unit must be before or equal to end unit.',
      )
      return
    }

    setTimeSlotFormError('')

    const semester = semesters.find((item) => item.id === currentSemesterId)

    if (!semester) {
      return
    }

    const payload = {
      label: timeSlotForm.label.trim(),
      startTime: timeSlotForm.startTime,
      endTime: timeSlotForm.endTime,
      startUnit: timeSlotForm.startUnit,
      endUnit: timeSlotForm.endUnit,
      order: timeSlotForm.order,
      scheduleProfileId: semester.scheduleProfileId,
    }

    if (editingTimeSlotId) {
      await db.timeSlots.update(editingTimeSlotId, payload)
    } else {
      await db.timeSlots.add({
        id: crypto.randomUUID(),
        ...payload,
      })
    }

    setEditingTimeSlotId(null)
    setTimeSlotForm(DEFAULT_TIME_SLOT_FORM)
    await hydrateSettings()
  }

  function resetTimeSlotForm() {
    setEditingTimeSlotId(null)
    setTimeSlotForm(DEFAULT_TIME_SLOT_FORM)
    setTimeSlotFormError('')
  }

  async function handleExportJson() {
    const backup = await exportAllDataAsJson()
    const blob = new Blob([stringifyBackup(backup)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `campus-planner-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const rawText = await file.text()
      const backup = parseBackupJson(rawText)
      const confirmed = window.confirm(
        'Importing this backup will overwrite current local data. Continue?',
      )

      if (!confirmed) {
        event.target.value = ''
        return
      }

      await importAllDataFromJson(backup)
      const nextDisplaySettings = await settingsRepository.getDisplaySettings()
      onDisplaySettingsChange(nextDisplaySettings)
      setDisplayForm(nextDisplaySettings)
      await hydrateSettings()
      window.alert('Import completed.')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to import JSON backup.'
      window.alert(message)
    } finally {
      event.target.value = ''
    }
  }

  if (showCourseImportPage) {
    return <CourseImportPage onBack={() => setShowCourseImportPage(false)} />
  }

  return (
    <div className="space-y-4">
      <SemesterSettingsSection
        semesters={semesters}
        form={semesterForm}
        errorMessage={semesterFormError}
        successMessage={semesterSwitchMessage}
        onFormChange={(updater) => setSemesterForm(updater)}
        onSwitchSemester={(semesterId) => void handleSwitchSemester(semesterId)}
        onCreateSemester={() => void handleCreateSemester()}
      />

      <ScheduleSettingsSection
        currentProfileName={currentProfileName}
        timeSlots={timeSlots}
        timeSlotForm={timeSlotForm}
        errorMessage={timeSlotFormError}
        editingTimeSlotId={editingTimeSlotId}
        onEditTimeSlot={beginEditTimeSlot}
        onTimeSlotFormChange={(updater) => setTimeSlotForm(updater)}
        onSaveTimeSlot={() => void handleSaveTimeSlot()}
        onResetTimeSlotForm={resetTimeSlotForm}
      />

      <DisplaySettingsSection
        displayForm={displayForm}
        homeTabOptions={HOME_TAB_OPTIONS}
        onUpdateField={updateDisplayField}
        onSave={() => void handleSaveDisplaySettings()}
      />

      <ImportExportSettingsSection
        fileInputRef={fileInputRef}
        onExportJson={() => void handleExportJson()}
        onImportFile={(event) => void handleImportFile(event)}
        onOpenCourseImport={() => setShowCourseImportPage(true)}
      />
    </div>
  )
}
