import { toThumbnailUrl } from '../data/photoThumbnail'
import type { Taxon } from '../data/taxon'
import { TEXTS } from '../texts/csTexts'
import { POINTS } from './answerScoring'
import styles from './Quiz.module.css'
import type { AnswerRecord } from './QuizQuestionView'

type QuizSummaryProps = {
  records: readonly AnswerRecord[]
  taxonById: ReadonlyMap<string, Taxon>
  onRepeatMistakes: () => void
  onNewQuiz: () => void
}

const PERCENT = 100

export const QuizSummary = ({
  records,
  taxonById,
  onRepeatMistakes,
  onNewQuiz,
}: QuizSummaryProps) => {
  const points = records.reduce((sum, record) => sum + POINTS[record.result], 0)
  const percent = records.length > 0 ? Math.round((points / records.length) * PERCENT) : 0
  const mistakes = records.filter((record) => record.result !== 'correct')

  return (
    <section className={styles.summary} data-testid="quiz-summary">
      <h1 className={styles.title}>{TEXTS.quiz.summaryTitle}</h1>
      <p className={styles.summaryScore}>
        {TEXTS.quiz.summaryScore(points, records.length, percent)}
      </p>
      {mistakes.length === 0 ? (
        <p>{TEXTS.quiz.noMistakes}</p>
      ) : (
        <>
          <h2 className={styles.subtitle}>{TEXTS.quiz.mistakesTitle}</h2>
          <ul className={styles.mistakes}>
            {mistakes.map((record) => {
              const taxon = taxonById.get(record.taxonId)
              if (!taxon) {
                throw new Error(`Unknown taxon ${record.taxonId}`)
              }

              return (
                <li key={record.taxonId} data-result={record.result}>
                  {taxon.photos[0] && (
                    <img
                      className={styles.mistakeThumb}
                      src={toThumbnailUrl(taxon.photos[0].src)}
                      alt=""
                      loading="lazy"
                    />
                  )}
                  <span>
                    <strong>{taxon.czechName}</strong> <i>{taxon.latinName}</i>
                    {record.givenAnswer && (
                      <span className={styles.mistakeGiven}>
                        {TEXTS.quiz.yourAnswer}: {record.givenAnswer}
                      </span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
      <div className={styles.summaryActions}>
        {mistakes.length > 0 && (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onRepeatMistakes}
            data-testid="quiz-summary--repeat"
          >
            {TEXTS.quiz.repeatMistakes}
          </button>
        )}
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onNewQuiz}
          data-testid="quiz-summary--new"
        >
          {TEXTS.quiz.newQuiz}
        </button>
      </div>
    </section>
  )
}
