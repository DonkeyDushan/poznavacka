import { useCallback, useMemo } from 'react'
import type { GroupId, Taxon, TaxonGroup } from '../data/taxon'
import { updateHashParams } from '../routing/useHashRoute'
import { GROUPS_PARAM, serializeGroupIds } from '../taxa/taxonSelection'
import { TEXTS } from '../texts/csTexts'
import { GroupChip } from './GroupChip'
import styles from './GroupPicker.module.css'

type GroupPickerProps = {
  groups: readonly TaxonGroup[]
  taxa: readonly Taxon[]
  selectedGroupIds: readonly GroupId[]
}

export const GroupPicker = ({ groups, taxa, selectedGroupIds }: GroupPickerProps) => {
  const countByGroup = useMemo(() => {
    const counts = new Map<GroupId, number>()
    taxa.forEach((taxon) => counts.set(taxon.groupId, (counts.get(taxon.groupId) ?? 0) + 1))

    return counts
  }, [taxa])

  const selected = new Set(selectedGroupIds)
  const isAllSelected = selectedGroupIds.length === groups.length
  const selectedTaxonCount = selectedGroupIds.reduce(
    (sum, groupId) => sum + (countByGroup.get(groupId) ?? 0),
    0,
  )

  const handleToggle = useCallback(
    (groupId: GroupId) => {
      const isSelected = selectedGroupIds.includes(groupId)
      // From "all" a click narrows to the one group; the last group cannot be deselected.
      const nextIds = isAllSelected
        ? [groupId]
        : groups
            .map((group) => group.id)
            .filter((id) => (id === groupId ? !isSelected : selectedGroupIds.includes(id)))
      if (nextIds.length === 0) {
        return
      }
      updateHashParams({ [GROUPS_PARAM]: serializeGroupIds(nextIds, groups) })
    },
    [groups, isAllSelected, selectedGroupIds],
  )

  const handleSelectAll = useCallback(() => updateHashParams({ [GROUPS_PARAM]: null }), [])

  return (
    <fieldset className={styles.picker} data-testid="group-picker">
      <legend className={styles.legend}>
        {TEXTS.groups.legend}
        <span className={styles.count}>
          {TEXTS.groups.selectedCount(selectedTaxonCount, taxa.length)}
        </span>
      </legend>
      <div className={styles.chips}>
        <button
          type="button"
          className={styles.chip}
          data-selected={isAllSelected}
          onClick={handleSelectAll}
          data-testid="group-picker--all"
        >
          {TEXTS.groups.all}
        </button>
        {groups.map((group) => (
          <GroupChip
            key={group.id}
            group={group}
            count={countByGroup.get(group.id) ?? 0}
            isSelected={!isAllSelected && selected.has(group.id)}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </fieldset>
  )
}
