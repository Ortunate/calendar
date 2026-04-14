import type { RecurringEventRule } from '../../types/schedule'

export function isRuleActiveInWeek(
  rule: RecurringEventRule,
  weekIndex: number,
): boolean {
  if (weekIndex < rule.startWeek || weekIndex > rule.endWeek) {
    return false
  }

  if (rule.weekMode === 'all') {
    return true
  }

  if (rule.weekMode === 'odd') {
    return weekIndex % 2 === 1
  }

  if (rule.weekMode === 'even') {
    return weekIndex % 2 === 0
  }

  return rule.customWeeks.includes(weekIndex)
}
