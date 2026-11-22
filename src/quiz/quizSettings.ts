import type { QuizFocus, QuizMode } from './quizQuestions'

export const MODE_PARAM = 'mode'
export const COUNT_PARAM = 'count'
export const FOCUS_PARAM = 'focus'

export const COUNT_OPTIONS: readonly (number | null)[] = Object.freeze([10, 20, 50, null])
const DEFAULT_COUNT = 20
const ALL_COUNT_VALUE = 'all'

export type QuizSettings = {
  mode: QuizMode
  count: number | null
  focus: QuizFocus
}

const parseCount = (value: string | null) => {
  if (value === ALL_COUNT_VALUE) {
    return null
  }
  const count = Number(value)

  return Number.isInteger(count) && count > 0 ? count : DEFAULT_COUNT
}

export const parseQuizSettings = (params: URLSearchParams): QuizSettings => ({
  mode: params.get(MODE_PARAM) === 'typing' ? 'typing' : 'choice',
  count: parseCount(params.get(COUNT_PARAM)),
  focus: params.get(FOCUS_PARAM) === 'weak' ? 'weak' : 'random',
})

export const serializeCount = (count: number | null) =>
  count === null ? ALL_COUNT_VALUE : String(count)
