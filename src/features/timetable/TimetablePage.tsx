import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { EventForm } from '../../components/forms/EventForm'
import type {
  EventFormInitialValues,
  EventFormPayload,
  EventFormSubmitOptions,
} from '../../components/forms/EventForm'
import { ExceptionForm } from '../../components/timetable/ExceptionForm'
import type { ExceptionFormPayload } from '../../components/timetable/ExceptionForm'
import { EventDetailSheet } from '../../components/timetable/EventDetailSheet'
import { EventExceptionManagerSheet } from '../../components/timetable/EventExceptionManagerSheet'
import { EventSelectionSheet } from '../../components/timetable/EventSelectionSheet'
import { TimetableGrid } from '../../components/timetable/TimetableGrid'
import { TimetableHeader } from '../../components/timetable/TimetableHeader'
import type { TimetableDay, TimetableEvent } from '../../components/timetable/types'
import { addDemoCourse } from '../../db/demoData'
import { buildWeeklyTimetableEvents } from '../../lib/timetable/weekly'
import type { Event, EventException } from '../../types/event'
import type { RecurringEventRule, TimeSlot } from '../../types/schedule'
import type { DisplaySettings } from '../../types/settings'
import type { Semester } from '../../types/semester'
import {
  addRecurringRuleToEvent,
  createCourseFromPayload,
  createExceptionForEvent,
  deleteExceptionById,
  deleteCourseById,
  loadTimetableSnapshot,
  updateExceptionById,
  updateCourseFromPayload,
} from './timetableData'

function formatSavedSummary(
  payload: EventFormPayload,
  slots: TimeSlot[],
) {
  const weekdayLabel =
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][payload.recurringRule.weekday - 1] ??
    'Mon'
  const slot =
    slots.find((item) => item.id === payload.recurringRule.timeSlotId)?.label ?? 'Unknown slot'
  const weekSummary =
    payload.recurringRule.weekMode === 'custom' && payload.recurringRule.customWeeks.length > 0
      ? `Custom weeks ${payload.recurringRule.customWeeks.join(', ')}`
      : `Weeks ${payload.recurringRule.startWeek}-${payload.recurringRule.endWeek}`

  return `Saved to ${weekdayLabel} · ${slot} · ${weekSummary}`
}

type TimetablePageProps = {
  displaySettings: DisplaySettings
}

export function TimetablePage({ displaySettings }: TimetablePageProps) {
  const [managedEvent, setManagedEvent] = useState<TimetableEvent | null>(null)
  const [pendingException, setPendingException] = useState<{
    actionType: EventException['actionType']
    event: TimetableEvent
    exceptionId?: string
    initialValues?: EventException | null
  } | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [showWeekday, setShowWeekday] = useState(displaySettings.showWeekdayInHeader)
  const [showDate, setShowDate] = useState(displaySettings.showDateInHeader)
  const [showSlotLabel, setShowSlotLabel] = useState(
    displaySettings.showSlotLabelInRowHeader,
  )
  const [showTime, setShowTime] = useState(displaySettings.showTimeInRowHeader)
  const [selectedCellEvents, setSelectedCellEvents] = useState<TimetableEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<TimetableEvent | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<EventFormInitialValues | null>(null)
  const [appendRuleCourse, setAppendRuleCourse] = useState<EventFormInitialValues | null>(
    null,
  )
  const [currentSemester, setCurrentSemester] = useState<Semester | null>(null)
  const [semesterName, setSemesterName] = useState('Current Semester')
  const [currentWeekLabel, setCurrentWeekLabel] = useState('Week --')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [days, setDays] = useState<TimetableDay[]>([])
  const [weekEvents, setWeekEvents] = useState<TimetableEvent[]>([])
  const [rawEvents, setRawEvents] = useState<Event[]>([])
  const [rawRules, setRawRules] = useState<RecurringEventRule[]>([])
  const [rawExceptions, setRawExceptions] = useState<EventException[]>([])
  const [currentWeekIndex, setCurrentWeekIndex] = useState<number | null>(null)
  const [saveSummary, setSaveSummary] = useState('')

  useEffect(() => {
    setShowWeekday(displaySettings.showWeekdayInHeader)
    setShowDate(displaySettings.showDateInHeader)
    setShowSlotLabel(displaySettings.showSlotLabelInRowHeader)
    setShowTime(displaySettings.showTimeInRowHeader)
  }, [displaySettings])

  useEffect(() => {
    void refreshTimetable()
  }, [weekOffset])

  async function refreshTimetable() {
    const snapshot = await loadTimetableSnapshot()
    const activeSemester = snapshot.semester
    const nextSemesterName = activeSemester?.name ?? 'Current Semester'

    setCurrentSemester(activeSemester)
    setSemesterName(nextSemesterName)
    setTimeSlots(snapshot.timeSlots)
    setRawEvents(snapshot.events)
    setRawRules(snapshot.rules)
    setRawExceptions(snapshot.exceptions)

    if (!activeSemester) {
      setCurrentWeekLabel('Week --')
      setCurrentWeekIndex(null)
      setDays([])
      setWeekEvents([])
      return
    }

    const today = dayjs().startOf('day')
    const semesterStart = dayjs(activeSemester.weekOneStartDate).startOf('day')
    const semesterEnd = dayjs(activeSemester.endDate).endOf('day')
    const baseDate = today.isBefore(semesterStart)
      ? semesterStart
      : today.isAfter(semesterEnd)
        ? semesterEnd.startOf('day')
        : today
    const currentDate = baseDate.add(weekOffset, 'week').toISOString()
    const weeklyTimetable = buildWeeklyTimetableEvents({
      currentDate,
      semester: activeSemester,
      timeSlots: snapshot.timeSlots,
      events: snapshot.events,
      recurringRules: snapshot.rules,
      eventExceptions: snapshot.exceptions,
    })

    setCurrentWeekLabel(weeklyTimetable.weekLabel)
    setCurrentWeekIndex(weeklyTimetable.weekIndex)
    setDays(weeklyTimetable.dateRange?.days ?? [])
    setWeekEvents(weeklyTimetable.events)
  }

  async function handleAddDemoCourse() {
    await addDemoCourse()
    await refreshTimetable()
  }

  async function handleCreateCourse(
    payload: EventFormPayload,
    options: EventFormSubmitOptions,
  ) {
    const createdCourse = await createCourseFromPayload(payload)
    setSaveSummary(formatSavedSummary(payload, timeSlots))
    setAppendRuleCourse(options.addAnother ? createdCourse : null)
    setEditingCourse(null)
    setShowForm(options.addAnother)
    await refreshTimetable()
  }

  async function handleUpdateCourse(payload: EventFormPayload) {
    if (!editingCourse) {
      return
    }

    await updateCourseFromPayload(editingCourse, payload, currentSemester?.id)
    setSaveSummary(formatSavedSummary(payload, timeSlots))
    setEditingCourse(null)
    setAppendRuleCourse(null)
    setShowForm(false)
    await refreshTimetable()
  }

  async function handleAppendRule(payload: EventFormPayload) {
    if (!appendRuleCourse) {
      return
    }

    await addRecurringRuleToEvent(appendRuleCourse.event.id, payload)
    setSaveSummary(formatSavedSummary(payload, timeSlots))
    setAppendRuleCourse(null)
    setShowForm(false)
    await refreshTimetable()
  }

  async function handleDeleteCourse(eventId: string) {
    await deleteCourseById(eventId)
    setSelectedEvent(null)
    await refreshTimetable()
  }

  function handleStartCreateCourse() {
    setEditingCourse(null)
    setAppendRuleCourse(null)
    setSaveSummary('')
    setShowForm((current) => !current)
  }

  function handleStartEditCourse(event: TimetableEvent) {
    const matchedEvent = rawEvents.find((item) => item.id === event.eventId)
    const matchedRule = rawRules.find((rule) => rule.eventId === event.eventId)

    if (!matchedEvent || !matchedRule) {
      return
    }

    setEditingCourse({
      event: matchedEvent,
      recurringRule: matchedRule,
    })
    setAppendRuleCourse(null)
    setSelectedEvent(null)
    setSaveSummary('')
    setShowForm(true)
  }

  function handleStartAppendRule(event: TimetableEvent) {
    const matchedEvent = rawEvents.find((item) => item.id === event.eventId)
    const matchedRule = rawRules.find((rule) => rule.eventId === event.eventId)

    if (!matchedEvent || !matchedRule) {
      return
    }

    setEditingCourse(null)
    setAppendRuleCourse({
      event: matchedEvent,
      recurringRule: matchedRule,
    })
    setSelectedEvent(null)
    setSaveSummary('')
    setShowForm(true)
  }

  function handleStartCreateException(
    actionType: EventException['actionType'],
    event: TimetableEvent,
  ) {
    setSelectedEvent(null)
    setPendingException({
      actionType,
      event,
      initialValues: null,
    })
  }

  async function handleSubmitException(payload: ExceptionFormPayload) {
    if (!pendingException) {
      return
    }

    if (pendingException.exceptionId) {
      await updateExceptionById(pendingException.exceptionId, payload)
    } else {
      await createExceptionForEvent(pendingException.event, payload)
    }

    setPendingException(null)
    await refreshTimetable()
  }

  function handleOpenExceptionManager(event: TimetableEvent) {
    setSelectedEvent(null)
    setManagedEvent(event)
  }

  function handleStartEditException(exception: EventException) {
    if (!managedEvent) {
      return
    }

    setManagedEvent(null)
    setPendingException({
      actionType: exception.actionType,
      event: managedEvent,
      exceptionId: exception.id,
      initialValues: exception,
    })
  }

  async function handleDeleteException(exception: EventException) {
    const confirmed = window.confirm(
      'Remove this exception? The timetable will return to the original rule.',
    )

    if (!confirmed) {
      return
    }

    await deleteExceptionById(exception.id)
    await refreshTimetable()
  }

  const managedExceptions = managedEvent
    ? rawExceptions.filter((exception) => exception.eventId === managedEvent.eventId)
    : []

  function handleSelectEventGroup(events: TimetableEvent[]) {
    setSelectedEvent(null)
    setSelectedCellEvents(events)
  }

  function handleSelectEventFromGroup(event: TimetableEvent) {
    setSelectedCellEvents([])
    setSelectedEvent(event)
  }

  return (
    <div className="space-y-4">
      <TimetableHeader
        semesterName={semesterName}
        currentWeekLabel={currentWeekLabel}
        showWeekday={showWeekday}
        showDate={showDate}
        showSlotLabel={showSlotLabel}
        showTime={showTime}
        onPrevWeek={() => setWeekOffset((value) => value - 1)}
        onNextWeek={() => setWeekOffset((value) => value + 1)}
        onToggleWeekday={() => setShowWeekday((value) => !value)}
        onToggleDate={() => setShowDate((value) => !value)}
        onToggleSlotLabel={() => setShowSlotLabel((value) => !value)}
        onToggleTime={() => setShowTime((value) => !value)}
      />

      <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs font-medium text-sky-800">
        Active semester: {semesterName}
      </div>

      <TimetableGrid
        days={days}
        slots={timeSlots}
        events={weekEvents}
        showWeekday={showWeekday}
        showDate={showDate}
        showSlotLabel={showSlotLabel}
        showTime={showTime}
        onSelectEvent={setSelectedEvent}
        onSelectEventGroup={handleSelectEventGroup}
      />

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Quick add</h3>
            <p className="mt-1 text-xs text-slate-500">
              Create a recurring course activity.
            </p>
          </div>
          <button
            type="button"
            onClick={handleStartCreateCourse}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white active:opacity-90"
          >
            {showForm && !editingCourse && !appendRuleCourse ? 'Hide form' : 'Add event'}
          </button>
        </div>
        {saveSummary ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-900">
            {saveSummary}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => void handleAddDemoCourse()}
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 active:bg-slate-100"
        >
          Add demo course
        </button>
      </section>

      {showForm ? (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md px-3 pb-3">
          <div
            className="absolute inset-0 -top-[100vh] bg-slate-900/20"
            onClick={() => {
              setShowForm(false)
              setEditingCourse(null)
              setAppendRuleCourse(null)
            }}
            aria-hidden="true"
          />
          <section className="relative max-h-[88vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-lg">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {editingCourse
                      ? 'Edit event'
                      : appendRuleCourse
                        ? 'Add weekly occurrence'
                        : 'New event'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingCourse(null)
                    setAppendRuleCourse(null)
                  }}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 active:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-3">
              <EventForm
                timeSlots={timeSlots}
                totalWeeks={currentSemester?.totalWeeks ?? 20}
                semesterId={currentSemester?.id}
                currentVisibleWeek={currentWeekIndex}
                mode={editingCourse ? 'edit' : appendRuleCourse ? 'append' : 'create'}
                initialValues={editingCourse ?? appendRuleCourse}
                onSubmit={(payload, options) =>
                  void (editingCourse
                    ? handleUpdateCourse(payload)
                    : appendRuleCourse
                      ? handleAppendRule(payload)
                      : handleCreateCourse(payload, options))
                }
              />
            </div>
          </section>
        </div>
      ) : null}

      <ExceptionForm
        actionType={pendingException?.actionType ?? 'cancel'}
        event={pendingException?.event ?? null}
        timeSlots={timeSlots}
        mode={pendingException?.exceptionId ? 'edit' : 'create'}
        initialValues={pendingException?.initialValues ?? null}
        existingExceptions={rawExceptions}
        currentWeekEvents={weekEvents}
        onClose={() => setPendingException(null)}
        onSubmit={(payload) => void handleSubmitException(payload)}
      />

      <EventExceptionManagerSheet
        event={managedEvent}
        exceptions={managedExceptions}
        onClose={() => setManagedEvent(null)}
        onEdit={handleStartEditException}
        onDelete={(exception) => void handleDeleteException(exception)}
      />

      <EventSelectionSheet
        events={selectedCellEvents}
        onClose={() => setSelectedCellEvents([])}
        onSelect={handleSelectEventFromGroup}
      />

      <EventDetailSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={handleStartEditCourse}
        onAddWeeklyOccurrence={handleStartAppendRule}
        onManageExceptions={handleOpenExceptionManager}
        onDelete={(eventId) => void handleDeleteCourse(eventId)}
        onCancelOccurrence={(event) => handleStartCreateException('cancel', event)}
        onRelocateOccurrence={(event) =>
          handleStartCreateException('relocate', event)
        }
        onRescheduleOccurrence={(event) =>
          handleStartCreateException('reschedule', event)
        }
        onAddExtraOccurrence={(event) => handleStartCreateException('extra', event)}
      />
    </div>
  )
}
