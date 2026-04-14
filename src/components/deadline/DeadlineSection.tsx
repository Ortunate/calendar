import { DeadlineItemCard } from './DeadlineItemCard'
import type { DeadlineGroup, DeadlineListItem } from './types'

type DeadlineSectionProps = {
  group: DeadlineGroup
  onToggleStatus: (id: string) => void
  onOpen: (item: DeadlineListItem) => void
}

export function DeadlineSection({
  group,
  onToggleStatus,
  onOpen,
}: DeadlineSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800">{group.title}</h2>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
          {group.items.length} item{group.items.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {group.items.length > 0 ? (
          group.items.map((item) => (
            <DeadlineItemCard
              key={item.id}
              item={item}
              onToggleStatus={onToggleStatus}
              onOpen={onOpen}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-400">
            No deadlines in this group.
          </div>
        )}
      </div>
    </section>
  )
}
