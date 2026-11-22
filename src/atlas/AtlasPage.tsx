import { useCallback, useMemo, type ChangeEvent } from 'react'
import { GroupPicker } from '../components/GroupPicker'
import type { TaxaData, Taxon } from '../data/taxon'
import { updateHashParams } from '../routing/useHashRoute'
import { getAcceptedNames } from '../quiz/answerScoring'
import { normalizeName } from '../taxa/normalizeName'
import { filterByGroups, GROUPS_PARAM, parseGroupIds } from '../taxa/taxonSelection'
import { TEXTS } from '../texts/csTexts'
import styles from './Atlas.module.css'
import { AtlasSection } from './AtlasSection'
import { TaxonDetailDialog } from './TaxonDetailDialog'

type AtlasPageProps = {
  data: TaxaData
  params: URLSearchParams
}

export type AtlasSectionData = {
  key: string
  title: string
  taxa: Taxon[]
}

const SEARCH_PARAM = 'q'
const TAXON_PARAM = 'taxon'

/** Consecutive taxa with the same section heading form one section (the list is systematic). */
const groupIntoSections = (taxa: readonly Taxon[]): AtlasSectionData[] => {
  const sections: AtlasSectionData[] = []
  for (const taxon of taxa) {
    const title = taxon.sectionName ?? ''
    const last = sections.at(-1)
    if (last && last.title === title) {
      last.taxa.push(taxon)
      continue
    }
    sections.push({ key: `section-${taxon.id}`, title, taxa: [taxon] })
  }

  return sections
}

export const AtlasPage = ({ data, params }: AtlasPageProps) => {
  const groupsValue = params.get(GROUPS_PARAM)
  const search = params.get(SEARCH_PARAM) ?? ''
  const openTaxonId = params.get(TAXON_PARAM)

  const selectedGroupIds = useMemo(
    () => parseGroupIds(groupsValue, data.groups),
    [data.groups, groupsValue],
  )
  const searchIndex = useMemo(
    () =>
      new Map(
        data.taxa.map((taxon) => [taxon.id, getAcceptedNames(taxon).map(normalizeName).join('|')]),
      ),
    [data.taxa],
  )
  const sections = useMemo(() => {
    const query = normalizeName(search)
    const inGroups = filterByGroups(data.taxa, selectedGroupIds)
    const matching = query
      ? inGroups.filter((taxon) => searchIndex.get(taxon.id)?.includes(query))
      : inGroups

    return groupIntoSections(matching)
  }, [data.taxa, search, searchIndex, selectedGroupIds])
  const resultCount = sections.reduce((sum, section) => sum + section.taxa.length, 0)
  const openTaxon = openTaxonId ? data.taxa.find((taxon) => taxon.id === openTaxonId) : undefined

  const handleSearch = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      updateHashParams({ [SEARCH_PARAM]: event.currentTarget.value }),
    [],
  )
  const handleOpen = useCallback(
    (taxonId: string) => updateHashParams({ [TAXON_PARAM]: taxonId }, false),
    [],
  )
  const handleClose = useCallback(() => updateHashParams({ [TAXON_PARAM]: null }), [])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{TEXTS.atlas.title}</h1>
      <GroupPicker groups={data.groups} taxa={data.taxa} selectedGroupIds={selectedGroupIds} />
      <label className={styles.search}>
        <span>{TEXTS.atlas.searchLabel}</span>
        <input
          type="search"
          defaultValue={search}
          placeholder={TEXTS.atlas.searchPlaceholder}
          onChange={handleSearch}
          data-testid="atlas-search"
        />
      </label>
      <p className={styles.count}>{TEXTS.atlas.resultCount(resultCount)}</p>
      {sections.length === 0 && <p>{TEXTS.atlas.empty}</p>}
      {sections.map((section) => (
        <AtlasSection key={section.key} section={section} onOpen={handleOpen} />
      ))}
      {openTaxon && <TaxonDetailDialog taxon={openTaxon} onClose={handleClose} />}
    </div>
  )
}
