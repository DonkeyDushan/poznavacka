import { useCallback, useMemo, useState } from 'react'
import type { TaxaData, Taxon } from '../data/taxon'
import { useProgress } from '../progress/progressStore'
import { filterByGroups, GROUPS_PARAM, hasPhoto, parseGroupIds } from '../taxa/taxonSelection'
import { TEXTS } from '../texts/csTexts'
import { POINTS } from './answerScoring'
import { buildQuizQuestions, type QuizQuestion } from './quizQuestions'
import { QuizQuestionView, type AnswerRecord } from './QuizQuestionView'
import { parseQuizSettings } from './quizSettings'
import { QuizSetup } from './QuizSetup'
import { QuizSummary } from './QuizSummary'

type QuizPageProps = {
  data: TaxaData
  params: URLSearchParams
}

type QuizSession = {
  questions: QuizQuestion[]
  records: AnswerRecord[]
  index: number
}

export const QuizPage = ({ data, params }: QuizPageProps) => {
  const progress = useProgress()
  const [session, setSession] = useState<QuizSession | null>(null)

  const groupsValue = params.get(GROUPS_PARAM)
  const selectedGroupIds = useMemo(
    () => parseGroupIds(groupsValue, data.groups),
    [data.groups, groupsValue],
  )
  const selectedTaxa = useMemo(
    () => filterByGroups(data.taxa, selectedGroupIds),
    [data.taxa, selectedGroupIds],
  )
  const taxonById = useMemo(() => new Map(data.taxa.map((taxon) => [taxon.id, taxon])), [data.taxa])
  const settings = parseQuizSettings(params)
  const { mode, focus, count } = settings
  const availableCount = selectedTaxa.filter(hasPhoto).length
  const points = session?.records.reduce((sum, record) => sum + POINTS[record.result], 0) ?? 0

  const startSession = useCallback(
    (taxa: readonly Taxon[], questionCount: number | null) =>
      setSession({
        questions: buildQuizQuestions(taxa, data.taxa, {
          mode,
          focus,
          count: questionCount,
          progress,
        }),
        records: [],
        index: 0,
      }),
    [data.taxa, focus, mode, progress],
  )
  const handleStart = useCallback(
    () => startSession(selectedTaxa, count),
    [count, selectedTaxa, startSession],
  )
  const handleAnswer = useCallback(
    (record: AnswerRecord) =>
      setSession((current) => current && { ...current, records: [...current.records, record] }),
    [],
  )
  const handleNext = useCallback(
    () => setSession((current) => current && { ...current, index: current.index + 1 }),
    [],
  )
  const handleQuit = useCallback(() => setSession(null), [])
  const handleRepeatMistakes = useCallback(() => {
    if (!session) {
      return
    }
    const mistakes = session.records
      .filter((record) => record.result !== 'correct')
      .map((record) => taxonById.get(record.taxonId))
      .filter((taxon): taxon is Taxon => taxon !== undefined)
    startSession(mistakes, null)
  }, [session, startSession, taxonById])

  if (!session) {
    return (
      <QuizSetup
        data={data}
        selectedGroupIds={selectedGroupIds}
        settings={settings}
        availableCount={availableCount}
        onStart={handleStart}
      />
    )
  }

  const question = session.questions[session.index]
  if (!question) {
    return (
      <QuizSummary
        records={session.records}
        taxonById={taxonById}
        onRepeatMistakes={handleRepeatMistakes}
        onNewQuiz={handleQuit}
      />
    )
  }

  return (
    <QuizQuestionView
      key={`${question.taxon.id}-${session.index}`}
      question={question}
      questionNumber={session.index + 1}
      questionCount={session.questions.length}
      scoreText={TEXTS.quiz.score(points, session.records.length)}
      onAnswer={handleAnswer}
      onNext={handleNext}
      onQuit={handleQuit}
    />
  )
}
