import { DeadlineForm } from '../../components/forms/DeadlineForm'
import type { DeadlineFormPayload } from '../../components/forms/DeadlineForm'
import type { DeadlineItem } from '../../types/deadline'

type DeadlineEditorSheetProps = {
  visible: boolean
  editingDeadline: DeadlineItem | null
  onSubmit: (payload: DeadlineFormPayload) => void
}

export function DeadlineEditorSheet({
  visible,
  editingDeadline,
  onSubmit,
}: DeadlineEditorSheetProps) {
  if (!visible) {
    return null
  }

  return (
    <DeadlineForm
      mode={editingDeadline ? 'edit' : 'create'}
      initialValues={editingDeadline}
      onSubmit={onSubmit}
    />
  )
}
