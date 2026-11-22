import { useCallback, useEffect, useState } from 'react'
import { TaxonAnswer } from '../components/TaxonAnswer'
import { TaxonPhoto } from '../components/TaxonPhoto'
import type { Taxon } from '../data/taxon'
import { recordGrade, type Grade } from '../progress/progressStore'
import { TEXTS } from '../texts/csTexts'
import { scoreTypedAnswer, type AnswerResult } from './answerScoring'
import { ChoiceOptions } from './ChoiceOptions'
import styles from './Quiz.module.css'
import type { QuizQuestion } from './quizQuestions'
import { TypingAnswerForm } from './TypingAnswerForm'

export type AnswerRecord = {
  taxonId: string
  result: AnswerResult
  givenAnswer: string
  chosenTaxonId: string | null
}

type QuizQuestionViewProps = {
  question: QuizQuestion
  questionNumber: number
  questionCount: number
  scoreText: string
  onAnswer: (record: AnswerRecord) => void
  onNext: () => void
  onQuit: () => void
}

const GRADE_BY_RESULT: Readonly<Record<AnswerResult, Grade>> = Object.freeze({
  correct: 'good',
  partial: 'hard',
  wrong: 'again',
})

const FEEDBACK_BY_RESULT: Readonly<Record<AnswerResult, string>> = Object.freeze({
  correct: TEXTS.quiz.correct,
  partial: TEXTS.quiz.partial,
  wrong: TEXTS.quiz.wrong,
})

export const QuizQuestionView = ({
  question,
  questionNumber,
  questionCount,
  scoreText,
  onAnswer,
  onNext,
  onQuit,
}: QuizQuestionViewProps) => {
  const [record, setRecord] = useState<AnswerRecord | null>(null)

  const { taxon, options } = question
  const isLast = questionNumber === questionCount

  const handleRecord = useCallback(
    (nextRecord: AnswerRecord) => {
      setRecord(nextRecord)
      recordGrade(nextRecord.taxonId, GRADE_BY_RESULT[nextRecord.result])
      onAnswer(nextRecord)
    },
    [onAnswer],
  )
  const handleChoose = useCallback(
    (chosen: Taxon) =>
      handleRecord({
        taxonId: taxon.id,
        result: chosen.id === taxon.id ? 'correct' : 'wrong',
        givenAnswer: chosen.czechName,
        chosenTaxonId: chosen.id,
      }),
    [handleRecord, taxon.id],
  )
  const handleTyped = useCallback(
    (answer: string) =>
      handleRecord({
        taxonId: taxon.id,
        result: scoreTypedAnswer(taxon, answer),
        givenAnswer: answer.trim(),
        chosenTaxonId: null,
      }),
    [handleRecord, taxon],
  )

  useEffect(() => {
    if (record || !options) {
      return
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      const option = options[Number(event.key) - 1]
      if (option && !event.ctrlKey && !event.metaKey && !event.altKey) {
        handleChoose(option)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleChoose, options, record])

  return (
    <section className={styles.question} data-testid="quiz-question">
      <header className={styles.questionHeader}>
        <span>{TEXTS.quiz.questionOf(questionNumber, questionCount)}</span>
        <span className={styles.score}>{scoreText}</span>
        <button
          type="button"
          className={styles.linkButton}
          onClick={onQuit}
          data-testid="quiz-question--quit"
        >
          {TEXTS.quiz.quit}
        </button>
      </header>
      <div className={styles.prompt}>
        <strong>{TEXTS.rankPrompt[taxon.rank]}</strong>
        {taxon.note && <span className={styles.promptNote}>({taxon.note})</span>}
      </div>
      <TaxonPhoto
        photos={taxon.photos}
        initialIndex={question.photoIndex}
        alt={record ? taxon.czechName : ''}
        testId="quiz-question--photo"
      />
      {options ? (
        <ChoiceOptions
          options={options}
          correctTaxonId={taxon.id}
          chosenTaxonId={record?.chosenTaxonId ?? null}
          onChoose={handleChoose}
        />
      ) : (
        !record && <TypingAnswerForm onSubmit={handleTyped} />
      )}
      {record && (
        <div className={styles.feedback} data-result={record.result} data-testid="quiz-feedback">
          <p className={styles.feedbackTitle}>{FEEDBACK_BY_RESULT[record.result]}</p>
          {!options && record.givenAnswer && (
            <p className={styles.givenAnswer}>
              {TEXTS.quiz.yourAnswer}: <q>{record.givenAnswer}</q>
            </p>
          )}
          <TaxonAnswer taxon={taxon} testId="quiz-feedback--answer" />
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onNext}
            autoFocus
            data-testid="quiz-feedback--next"
          >
            {isLast ? TEXTS.quiz.finish : TEXTS.quiz.next}
          </button>
        </div>
      )}
      {options && !record && <p className={styles.hint}>{TEXTS.quiz.keyboardHint}</p>}
    </section>
  )
}
