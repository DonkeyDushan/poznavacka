import { useSyncExternalStore } from 'react'

export type Grade = 'again' | 'hard' | 'good'

export type TaxonProgress = {
  box: number
  dueAt: number
  correctCount: number
  wrongCount: number
}

export type ProgressMap = Readonly<Record<string, TaxonProgress>>

const STORAGE_KEY = 'poznavacka.progress.v1'
const MINUTE_MS = 60_000
const DAY_MS = 24 * 60 * MINUTE_MS
/** Leitner box waiting times; box 0 comes back within the same session. */
const BOX_INTERVALS_MS: readonly number[] = Object.freeze([
  MINUTE_MS,
  10 * MINUTE_MS,
  DAY_MS,
  3 * DAY_MS,
  7 * DAY_MS,
  21 * DAY_MS,
])
const LAST_BOX = BOX_INTERVALS_MS.length - 1
/** Box from which a taxon counts as learned. */
export const LEARNED_BOX = 3

const EMPTY_PROGRESS: ProgressMap = Object.freeze({})

const readStoredProgress = (): ProgressMap => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)

    return stored ? (JSON.parse(stored) as ProgressMap) : EMPTY_PROGRESS
  } catch {
    return EMPTY_PROGRESS
  }
}

let progress: ProgressMap = readStoredProgress()
const listeners = new Set<() => void>()

const commit = (nextProgress: ProgressMap) => {
  progress = nextProgress
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress))
  } catch {
    // Private mode or full storage: progress then lives only in memory.
  }
  listeners.forEach((listener) => listener())
}

const intervalOf = (box: number) => BOX_INTERVALS_MS[Math.min(box, LAST_BOX)] ?? MINUTE_MS

const nextBox = (box: number, grade: Grade) => {
  if (grade === 'again') {
    return 0
  }
  if (grade === 'hard') {
    return Math.max(box, 1)
  }

  return Math.min(box + 1, LAST_BOX)
}

export const recordGrade = (taxonId: string, grade: Grade) => {
  const previous = progress[taxonId]
  const box = nextBox(previous?.box ?? 0, grade)
  const isCorrect = grade !== 'again'
  commit({
    ...progress,
    [taxonId]: {
      box,
      dueAt: Date.now() + intervalOf(box),
      correctCount: (previous?.correctCount ?? 0) + (isCorrect ? 1 : 0),
      wrongCount: (previous?.wrongCount ?? 0) + (isCorrect ? 0 : 1),
    },
  })
}

export const resetProgress = () => commit(EMPTY_PROGRESS)

const subscribe = (listener: () => void) => {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

/** Current progress outside render, e.g. right after recording a grade in a handler. */
export const getProgress = () => progress

export const useProgress = (): ProgressMap => useSyncExternalStore(subscribe, getProgress)
