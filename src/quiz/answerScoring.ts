import type { Taxon } from '../data/taxon'
import { normalizeName } from '../taxa/normalizeName'

export type AnswerResult = 'correct' | 'partial' | 'wrong'

export const POINTS: Readonly<Record<AnswerResult, number>> = Object.freeze({
  correct: 1,
  partial: 0.5,
  wrong: 0,
})

/** Names this long tolerate two typos, shorter ones one; very short none. */
const LONG_NAME_LENGTH = 12
const SHORT_NAME_LENGTH = 5

const editDistance = (left: string, right: string) => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  const current = new Array<number>(right.length + 1).fill(0)
  for (let row = 1; row <= left.length; row += 1) {
    current[0] = row
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1
      current[column] = Math.min(
        (current[column - 1] ?? 0) + 1,
        (previous[column] ?? 0) + 1,
        (previous[column - 1] ?? 0) + cost,
      )
    }
    previous.splice(0, previous.length, ...current)
  }

  return previous[right.length] ?? 0
}

const allowedTypos = (name: string) => {
  if (name.length >= LONG_NAME_LENGTH) {
    return 2
  }

  return name.length >= SHORT_NAME_LENGTH ? 1 : 0
}

const matchesAny = (input: string, names: readonly string[]) =>
  names.some((name) => {
    const normalized = normalizeName(name)

    return normalized !== '' && editDistance(input, normalized) <= allowedTypos(normalized)
  })

export const getAcceptedNames = (taxon: Taxon) => [
  taxon.czechName,
  ...taxon.czechSynonyms,
  taxon.latinName,
  ...taxon.latinSynonyms,
]

const firstWord = (name: string) => normalizeName(name).split(' ')[0] ?? ''

/** Names that earn half a point: the genus for a species, the family (or order) for a genus. */
const getHalfPointNames = (taxon: Taxon): string[] => {
  if (taxon.rank === 'species') {
    const genusNames = taxon.genus
      ? [...taxon.genus.czechNames, ...taxon.genus.latinNames]
      : [taxon.czechName, taxon.latinName].map(firstWord)

    return genusNames.filter(Boolean)
  }
  if (taxon.rank === 'genus' && taxon.higherTaxon) {
    return [taxon.higherTaxon.czechName, taxon.higherTaxon.latinName]
  }

  return []
}

/** Scores a typed answer like the Biological Olympiad: exact 1 point, genus (or family) half. */
export const scoreTypedAnswer = (taxon: Taxon, answer: string): AnswerResult => {
  const input = normalizeName(answer)
  if (!input) {
    return 'wrong'
  }
  if (matchesAny(input, getAcceptedNames(taxon))) {
    return 'correct'
  }
  const inputWords = input.split(' ')
  const isSpecies = taxon.rank === 'species'
  const hasHalfPoint = getHalfPointNames(taxon).some((name) => {
    const nameWordCount = normalizeName(name).split(' ').length
    // A species answer counts by its leading genus words ("ptačí zob obecný" → "ptačí zob").
    const candidate = isSpecies ? inputWords.slice(0, nameWordCount).join(' ') : input

    return matchesAny(candidate, [name])
  })

  return hasHalfPoint ? 'partial' : 'wrong'
}
