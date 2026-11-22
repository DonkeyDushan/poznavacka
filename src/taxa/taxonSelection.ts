import type { GroupId, Taxon, TaxonGroup } from '../data/taxon'

export const GROUPS_PARAM = 'groups'

export const shuffle = <TItem>(items: readonly TItem[]): TItem[] => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = result[index]
    const swapped = result[swapIndex]
    if (current === undefined || swapped === undefined) {
      throw new Error('Shuffle index out of range')
    }
    result[index] = swapped
    result[swapIndex] = current
  }

  return result
}

export const pickRandom = <TItem>(items: readonly TItem[]): TItem | undefined =>
  items[Math.floor(Math.random() * items.length)]

/** Selected groups from the URL; none selected means all of them. */
export const parseGroupIds = (value: string | null, groups: readonly TaxonGroup[]): GroupId[] => {
  const requested = new Set(value?.split(',') ?? [])
  const selected = groups.filter((group) => requested.has(group.id)).map((group) => group.id)

  return selected.length > 0 ? selected : groups.map((group) => group.id)
}

export const serializeGroupIds = (groupIds: readonly GroupId[], groups: readonly TaxonGroup[]) =>
  groupIds.length === groups.length ? null : groupIds.join(',')

export const filterByGroups = (taxa: readonly Taxon[], groupIds: readonly GroupId[]) => {
  const selected = new Set(groupIds)

  return taxa.filter((taxon) => selected.has(taxon.groupId))
}

export const hasPhoto = (taxon: Taxon) => taxon.photos.length > 0

export const pickPhotoIndex = (taxon: Taxon) => Math.floor(Math.random() * taxon.photos.length)
