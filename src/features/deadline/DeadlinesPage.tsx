import { useEffect, useState } from 'react'
import type { DeadlineFormPayload } from '../../components/forms/DeadlineForm'
import { DeadlineDetailSheet } from '../../components/deadline/DeadlineDetailSheet'
import { DeadlineSection } from '../../components/deadline/DeadlineSection'
import type { DeadlineListItem } from '../../components/deadline/types'
import type { DeadlineItem } from '../../types/deadline'
import { DeadlineEditorSheet } from './DeadlineEditorSheet'
import {
  addDemoDeadline,
  buildDeadlineGroups,
  createDeadlineFromPayload,
  deleteDeadlineById,
  loadDeadlineSnapshot,
  toggleDeadlineStatusById,
  updateDeadlineFromPayload,
} from './deadlineData'

export function DeadlinesPage() {
  const [items, setItems] = useState<DeadlineListItem[]>([])
  const [rawDeadlines, setRawDeadlines] = useState<DeadlineItem[]>([])
  const [selectedItem, setSelectedItem] = useState<DeadlineListItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<DeadlineItem | null>(null)
  const [saveMessage, setSaveMessage] = useState('')
  const [recentlyUpdatedDeadlineId, setRecentlyUpdatedDeadlineId] = useState<string | null>(
    null,
  )

  const groups = buildDeadlineGroups(items)

  useEffect(() => {
    void refreshDeadlines()
  }, [])

  async function refreshDeadlines() {
    const snapshot = await loadDeadlineSnapshot()

    setRawDeadlines(snapshot.rawDeadlines)
    setItems(snapshot.items)
    setSelectedItem((current) =>
      current ? snapshot.items.find((item) => item.id === current.id) ?? null : null,
    )
  }

  async function handleToggleStatus(id: string) {
    await toggleDeadlineStatusById(id)
    await refreshDeadlines()
  }

  async function handleAddDemoDeadline() {
    await addDemoDeadline()
    await refreshDeadlines()
  }

  async function handleCreateDeadline(payload: DeadlineFormPayload) {
    await createDeadlineFromPayload(payload)
    setSaveMessage('Deadline created')
    setRecentlyUpdatedDeadlineId(null)
    setShowForm(false)
    await refreshDeadlines()
  }

  async function handleUpdateDeadline(payload: DeadlineFormPayload) {
    if (!editingDeadline) {
      return
    }

    await updateDeadlineFromPayload(editingDeadline, payload)
    setSaveMessage('Deadline updated')
    setRecentlyUpdatedDeadlineId(editingDeadline.id)
    setEditingDeadline(null)
    setShowForm(false)
    await refreshDeadlines()
  }

  async function handleDeleteDeadline(id: string) {
    await deleteDeadlineById(id)
    setSelectedItem(null)
    setRecentlyUpdatedDeadlineId((current) => (current === id ? null : current))
    await refreshDeadlines()
  }

  function handleStartCreateDeadline() {
    setEditingDeadline(null)
    setSaveMessage('')
    setRecentlyUpdatedDeadlineId(null)
    setShowForm((current) => !current)
  }

  function handleStartEditDeadline(item: DeadlineListItem) {
    const matchedDeadline = rawDeadlines.find((deadline) => deadline.id === item.id)

    if (!matchedDeadline) {
      return
    }

    setEditingDeadline(matchedDeadline)
    setSelectedItem(null)
    setSaveMessage('')
    setRecentlyUpdatedDeadlineId(null)
    setShowForm(true)
  }

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Quick add</h3>
            <p className="mt-1 text-xs text-slate-500">
              Create a deadline and see it appear immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={handleStartCreateDeadline}
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
          >
            {showForm && !editingDeadline ? 'Hide form' : 'Add DDL'}
          </button>
        </div>
        <button
          type="button"
          onClick={() => void handleAddDemoDeadline()}
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          Add demo DDL
        </button>
        {saveMessage ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-900">
            {saveMessage}
          </div>
        ) : null}
      </section>

      <DeadlineEditorSheet
        visible={showForm}
        editingDeadline={editingDeadline}
        onSubmit={(payload) =>
          void (editingDeadline
            ? handleUpdateDeadline(payload)
            : handleCreateDeadline(payload))
        }
      />

      {groups.map((group) => (
        <DeadlineSection
          key={group.key}
          group={group}
          recentlyUpdatedId={recentlyUpdatedDeadlineId}
          onToggleStatus={handleToggleStatus}
          onOpen={setSelectedItem}
        />
      ))}

      <DeadlineDetailSheet
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onEdit={handleStartEditDeadline}
        onDelete={(id) => void handleDeleteDeadline(id)}
      />
    </div>
  )
}
