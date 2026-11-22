import { useCallback } from 'react'
import type { GroupId, TaxonGroup } from '../data/taxon'
import styles from './GroupPicker.module.css'

type GroupChipProps = {
  group: TaxonGroup
  count: number
  isSelected: boolean
  onToggle: (groupId: GroupId) => void
}

export const GroupChip = ({ group, count, isSelected, onToggle }: GroupChipProps) => {
  const handleClick = useCallback(() => onToggle(group.id), [group.id, onToggle])

  return (
    <button
      type="button"
      className={styles.chip}
      data-selected={isSelected}
      aria-pressed={isSelected}
      onClick={handleClick}
      data-testid={`group-picker--${group.id}`}
    >
      {group.label}
      <span className={styles.chipCount}>{count}</span>
    </button>
  )
}
