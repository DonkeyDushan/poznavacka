import { useCallback, type FormEvent } from 'react'
import { TEXTS } from '../texts/csTexts'
import styles from './Quiz.module.css'

type TypingAnswerFormProps = {
  onSubmit: (answer: string) => void
}

const ANSWER_FIELD = 'answer'

export const TypingAnswerForm = ({ onSubmit }: TypingAnswerFormProps) => {
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const answer = new FormData(event.currentTarget).get(ANSWER_FIELD)
      onSubmit(typeof answer === 'string' ? answer : '')
    },
    [onSubmit],
  )
  const handleDontKnow = useCallback(() => onSubmit(''), [onSubmit])

  return (
    <form className={styles.typing} onSubmit={handleSubmit} data-testid="quiz-typing">
      <label className={styles.typingLabel}>
        <span className={styles.visuallyHidden}>{TEXTS.quiz.typingLabel}</span>
        <input
          name={ANSWER_FIELD}
          className={styles.typingInput}
          placeholder={TEXTS.quiz.typingPlaceholder}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          autoFocus
          data-testid="quiz-typing--input"
        />
      </label>
      <div className={styles.typingActions}>
        <button type="submit" className={styles.primaryButton} data-testid="quiz-typing--submit">
          {TEXTS.quiz.submit}
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleDontKnow}
          data-testid="quiz-typing--dont-know"
        >
          {TEXTS.quiz.dontKnow}
        </button>
      </div>
    </form>
  )
}
