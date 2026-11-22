import type { Taxon } from '../data/taxon'
import type { ProgressMap } from '../progress/progressStore'
import { hasPhoto, pickPhotoIndex, shuffle } from '../taxa/taxonSelection'

export type QuizMode = 'choice' | 'typing'
export type QuizFocus = 'random' | 'weak'

export type QuizQuestion = {
  taxon: Taxon
  photoIndex: number
  /** Four options including the answer; only in choice mode. */
  options: Taxon[] | null
}

const OPTION_COUNT = 4
/** At most this many distractors are close relatives, the rest come from the whole group. */
const MAX_RELATIVE_DISTRACTORS = 2

const relativeKey = (taxon: Taxon) =>
  taxon.genus?.latinNames[0] ?? taxon.higherTaxon?.latinName ?? taxon.sectionName ?? ''

const pickDistractors = (taxon: Taxon, pool: readonly Taxon[]): Taxon[] => {
  const usedNames = new Set([taxon.czechName])
  const isUsable = (candidate: Taxon) =>
    candidate.id !== taxon.id &&
    candidate.rank === taxon.rank &&
    !usedNames.has(candidate.czechName)
  const take = (candidates: readonly Taxon[], limit: number) => {
    const picked: Taxon[] = []
    for (const candidate of shuffle(candidates)) {
      if (picked.length >= limit) {
        break
      }
      if (isUsable(candidate)) {
        usedNames.add(candidate.czechName)
        picked.push(candidate)
      }
    }

    return picked
  }

  const key = relativeKey(taxon)
  const relatives = take(
    pool.filter((candidate) => relativeKey(candidate) === key),
    MAX_RELATIVE_DISTRACTORS,
  )
  const sameGroup = take(
    pool.filter((candidate) => candidate.groupId === taxon.groupId),
    OPTION_COUNT - 1 - relatives.length,
  )
  const picked = [...relatives, ...sameGroup]
  const missing = OPTION_COUNT - 1 - picked.length

  return missing > 0 ? [...picked, ...take(pool, missing)] : picked
}

const weaknessScore = (taxon: Taxon, progress: ProgressMap) => {
  const entry = progress[taxon.id]
  if (!entry) {
    return 1
  }

  return entry.wrongCount - entry.correctCount - entry.box
}

const orderTaxa = (taxa: readonly Taxon[], focus: QuizFocus, progress: ProgressMap) => {
  const shuffled = shuffle(taxa)
  if (focus === 'random') {
    return shuffled
  }

  return shuffled.sort(
    (left, right) => weaknessScore(right, progress) - weaknessScore(left, progress),
  )
}

export const buildQuizQuestions = (
  taxa: readonly Taxon[],
  allTaxa: readonly Taxon[],
  options: { mode: QuizMode; count: number | null; focus: QuizFocus; progress: ProgressMap },
): QuizQuestion[] => {
  const withPhotos = taxa.filter(hasPhoto)
  const ordered = orderTaxa(withPhotos, options.focus, options.progress)
  const selected = options.count ? ordered.slice(0, options.count) : ordered
  const distractorPool = allTaxa.filter(hasPhoto)

  return shuffle(selected).map((taxon) => ({
    taxon,
    photoIndex: pickPhotoIndex(taxon),
    options:
      options.mode === 'choice'
        ? shuffle([taxon, ...pickDistractors(taxon, distractorPool)])
        : null,
  }))
}
