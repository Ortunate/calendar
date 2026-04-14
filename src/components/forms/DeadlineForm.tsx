import { useEffect, useState, type FormEvent } from 'react'
import type { DeadlineCategory, DeadlineItem } from '../../types/deadline'

type DeadlineFormValues = {
  title: string
  category: DeadlineCategory
  dueAt: string
  priority: number
  description: string
  note: string
  courseEventId: string
}

type DeadlineFormErrors = Partial<Record<keyof DeadlineFormValues, string>>

export type DeadlineFormPayload = DeadlineItem

type DeadlineFormProps = {
  mode?: 'create' | 'edit'
  initialValues?: DeadlineItem | null
  onSubmit?: (payload: DeadlineFormPayload) => void
}

const CATEGORY_OPTIONS: Array<{ value: DeadlineCategory; label: string }> = [
  { value: 'assignment', label: 'Assignment' },
  { value: 'project', label: 'Project' },
  { value: 'exam', label: 'Exam' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'application', label: 'Application' },
  { value: 'custom', label: 'Custom' },
]

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Medium' },
  { value: 3, label: 'High' },
  { value: 4, label: 'Urgent' },
]

const DEFAULT_VALUES: DeadlineFormValues = {
  title: '',
  category: 'assignment',
  dueAt: '',
  priority: 2,
  description: '',
  note: '',
  courseEventId: '',
}

function normalizeDateTimeLocalValue(value: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return ''
  }

  const match = normalizedValue.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/)

  if (match) {
    return match[1]
  }

  const parsedDate = new Date(normalizedValue)

  if (Number.isNaN(parsedDate.getTime())) {
    return normalizedValue
  }

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getDate()).padStart(2, '0')
  const hour = String(parsedDate.getHours()).padStart(2, '0')
  const minute = String(parsedDate.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hour}:${minute}`
}

function buildValuesFromInitialValues(initialValues: DeadlineItem): DeadlineFormValues {
  return {
    title: initialValues.title,
    category: initialValues.category,
    dueAt: normalizeDateTimeLocalValue(initialValues.dueAt),
    priority: initialValues.priority,
    description: initialValues.description,
    note: initialValues.note,
    courseEventId: initialValues.courseEventId ?? '',
  }
}

function splitDateAndTime(value: string) {
  const normalized = normalizeDateTimeLocalValue(value)

  if (!normalized) {
    return {
      date: '',
      time: '23:59',
    }
  }

  const [datePart, timePart] = normalized.split('T')

  return {
    date: datePart ?? '',
    time: timePart ?? '23:59',
  }
}

function combineDateAndTime(date: string, time: string) {
  if (!date) {
    return ''
  }

  return `${date}T${time || '23:59'}`
}

function validate(values: DeadlineFormValues): DeadlineFormErrors {
  const errors: DeadlineFormErrors = {}

  if (!values.title.trim()) {
    errors.title = 'Title is required.'
  }

  if (!values.dueAt) {
    errors.dueAt = 'Due time is required.'
  }

  return errors
}

export function DeadlineForm({
  mode = 'create',
  initialValues = null,
  onSubmit,
}: DeadlineFormProps) {
  const [values, setValues] = useState<DeadlineFormValues>(() =>
    initialValues ? buildValuesFromInitialValues(initialValues) : DEFAULT_VALUES,
  )
  const [errors, setErrors] = useState<DeadlineFormErrors>({})
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [submittedPayload, setSubmittedPayload] =
    useState<DeadlineFormPayload | null>(null)

  useEffect(() => {
    setValues(initialValues ? buildValuesFromInitialValues(initialValues) : DEFAULT_VALUES)
    setErrors({})
    setSubmittedPayload(null)
  }, [initialValues])

  function updateField<K extends keyof DeadlineFormValues>(
    field: K,
    nextValue: DeadlineFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: nextValue,
    }))

    setErrors((current) => {
      if (!current[field]) {
        return current
      }

      return {
        ...current,
        [field]: undefined,
      }
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validate(values)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const timestamp = new Date().toISOString()
    const payload: DeadlineFormPayload = {
      id: initialValues?.id ?? 'deadline-preview',
      title: values.title.trim(),
      category: values.category,
      courseEventId: values.courseEventId.trim() || null,
      dueAt: values.dueAt,
      priority: values.priority,
      status: initialValues?.status ?? 'pending',
      description: values.description.trim(),
      note: values.note.trim(),
      createdAt: initialValues?.createdAt ?? timestamp,
      updatedAt: timestamp,
    }

    setSubmittedPayload(payload)
    setErrors({})
    onSubmit?.(payload)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {mode === 'edit' ? 'Edit deadline' : 'New deadline'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {mode === 'edit'
                ? 'Update the deadline, then return to the list.'
                : 'Keep it quick, then add detail only when needed.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-medium text-slate-600"
          >
            {showAdvanced ? 'Hide advanced' : 'Show advanced'}
          </button>
        </div>
      </div>

      <form className="space-y-4 px-4 py-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600" htmlFor="deadline-title">
            Title
          </label>
          <input
            id="deadline-title"
            value={values.title}
            onChange={(event) => updateField('title', event.target.value)}
            placeholder="e.g. Data Structures lab report"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
          />
          {errors.title ? (
            <p className="text-xs text-rose-600">{errors.title}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-slate-600"
              htmlFor="deadline-category"
            >
              Category
            </label>
            <select
              id="deadline-category"
              value={values.category}
              onChange={(event) =>
                updateField('category', event.target.value as DeadlineCategory)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-slate-600"
              htmlFor="deadline-priority"
            >
              Priority
            </label>
            <select
              id="deadline-priority"
              value={values.priority}
              onChange={(event) =>
                updateField('priority', Number(event.target.value))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600">Due at</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={splitDateAndTime(values.dueAt).date}
              onChange={(event) =>
                updateField(
                  'dueAt',
                  combineDateAndTime(
                    event.target.value,
                    splitDateAndTime(values.dueAt).time,
                  ),
                )
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
            />
            <input
              type="time"
              value={splitDateAndTime(values.dueAt).time}
              onChange={(event) =>
                updateField(
                  'dueAt',
                  combineDateAndTime(
                    splitDateAndTime(values.dueAt).date,
                    event.target.value,
                  ),
                )
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
            />
          </div>
          <p className="text-[11px] leading-5 text-slate-500">
            Pick a date, then a time. Default time stays at 23:59 until you change it.
          </p>
          {errors.dueAt ? (
            <p className="text-xs text-rose-600">{errors.dueAt}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label
            className="text-xs font-medium text-slate-600"
            htmlFor="deadline-description"
          >
            Description
          </label>
          <textarea
            id="deadline-description"
            value={values.description}
            onChange={(event) => updateField('description', event.target.value)}
            rows={3}
            placeholder="Optional context for this deadline"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
          />
        </div>

        {showAdvanced ? (
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium text-slate-600"
                htmlFor="deadline-course-event-id"
              >
                Course event ID
              </label>
              <input
                id="deadline-course-event-id"
                value={values.courseEventId}
                onChange={(event) =>
                  updateField('courseEventId', event.target.value)
                }
                placeholder="Optional linked course event"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-xs font-medium text-slate-600"
                htmlFor="deadline-note"
              >
                Note
              </label>
              <textarea
                id="deadline-note"
                value={values.note}
                onChange={(event) => updateField('note', event.target.value)}
                rows={3}
                placeholder="Optional personal note"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none"
              />
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white active:opacity-90"
        >
          {mode === 'edit' ? 'Save changes' : 'Create deadline'}
        </button>
      </form>

      {submittedPayload ? (
        <div className="border-t border-slate-200 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Payload preview</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
              Local only
            </span>
          </div>
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-3 text-[11px] leading-5 text-slate-100">
            {JSON.stringify(submittedPayload, null, 2)}
          </pre>
        </div>
      ) : null}
    </section>
  )
}
