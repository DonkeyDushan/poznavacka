import { useCallback, useMemo } from 'react'
import { GroupPicker } from '../components/GroupPicker'
import type { TaxaData } from '../data/taxon'
import { resetProgress, useProgress } from '../progress/progressStore'
import { filterByGroups, GROUPS_PARAM, hasPhoto, parseGroupIds } from '../taxa/taxonSelection'
import { TEXTS } from '../texts/csTexts'
import { getFlashcardStats } from './flashcardQueue'
import { FlashcardSession } from './FlashcardSession'
import styles from './Flashcards.module.css'

type FlashcardsPageProps = {
  data: TaxaData
  params: URLSearchParams
}

export const FlashcardsPage = ({ data, params }: FlashcardsPageProps) => {
  const progress = useProgress()

  const groupsValue = params.get(GROUPS_PARAM)
  const selectedGroupIds = useMemo(
    () => parseGroupIds(groupsValue, data.groups),
    [data.groups, groupsValue],
  )
  const taxa = useMemo(
    () => filterByGroups(data.taxa, selectedGroupIds).filter(hasPhoto),
    [data.taxa, selectedGroupIds],
  )
  const stats = getFlashcardStats(taxa, progress, Date.now())

  const handleReset = useCallback(() => {
    if (window.confirm(TEXTS.flashcards.resetConfirm)) {
      resetProgress()
    }
  }, [])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{TEXTS.flashcards.title}</h1>
      <p className={styles.intro}>{TEXTS.flashcards.intro}</p>
      <GroupPicker groups={data.groups} taxa={data.taxa} selectedGroupIds={selectedGroupIds} />
      <p className={styles.stats} data-testid="flashcards-stats">
        {TEXTS.flashcards.stats(stats.dueCount, stats.newCount, stats.learnedCount)}
      </p>
      <FlashcardSession key={groupsValue ?? 'all'} taxa={taxa} />
      <button
        type="button"
        className={styles.reset}
        onClick={handleReset}
        data-testid="flashcards-reset"
      >
        {TEXTS.flashcards.reset}
      </button>
    </div>
  )
}
