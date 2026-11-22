import type { Taxon } from '../data/taxon'
import { LEARNED_BOX, type ProgressMap } from '../progress/progressStore'
import { pickRandom } from '../taxa/taxonSelection'

export type FlashcardStats = {
  dueCount: number
  newCount: number
  learnedCount: number
}

export const getFlashcardStats = (
  taxa: readonly Taxon[],
  progress: ProgressMap,
  now: number,
): FlashcardStats =>
  taxa.reduce<FlashcardStats>(
    (stats, taxon) => {
      const entry = progress[taxon.id]
      if (!entry) {
        return { ...stats, newCount: stats.newCount + 1 }
      }

      return {
        ...stats,
        dueCount: stats.dueCount + (entry.dueAt <= now ? 1 : 0),
        learnedCount: stats.learnedCount + (entry.box >= LEARNED_BOX ? 1 : 0),
      }
    },
    { dueCount: 0, newCount: 0, learnedCount: 0 },
  )

/** Due cards first (oldest first), then a random new one, then the next to become due. */
export const pickNextFlashcard = (
  taxa: readonly Taxon[],
  progress: ProgressMap,
  now: number,
  previousTaxonId: string | null,
): Taxon | null => {
  const candidates = taxa.length > 1 ? taxa.filter((taxon) => taxon.id !== previousTaxonId) : taxa
  let soonestDue: Taxon | null = null
  let soonestDueAt = Number.POSITIVE_INFINITY
  const newTaxa: Taxon[] = []
  for (const taxon of candidates) {
    const entry = progress[taxon.id]
    if (!entry) {
      newTaxa.push(taxon)
      continue
    }
    if (entry.dueAt < soonestDueAt) {
      soonestDue = taxon
      soonestDueAt = entry.dueAt
    }
  }
  if (soonestDue && soonestDueAt <= now) {
    return soonestDue
  }

  return pickRandom(newTaxa) ?? soonestDue
}
