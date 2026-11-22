import { useCallback, type ChangeEvent, type FormEvent } from 'react'
import { GroupPicker } from '../components/GroupPicker'
import type { GroupId, TaxaData } from '../data/taxon'
import { updateHashParams } from '../routing/useHashRoute'
import { TEXTS } from '../texts/csTexts'
import styles from './Quiz.module.css'
import {
  COUNT_OPTIONS,
  COUNT_PARAM,
  FOCUS_PARAM,
  MODE_PARAM,
  serializeCount,
  type QuizSettings,
} from './quizSettings'

type QuizSetupProps = {
  data: TaxaData
  selectedGroupIds: readonly GroupId[]
  settings: QuizSettings
  availableCount: number
  onStart: () => void
}

const handleParamChange = (event: ChangeEvent<HTMLInputElement>) =>
  updateHashParams({ [event.currentTarget.name]: event.currentTarget.value })

export const QuizSetup = ({
  data,
  selectedGroupIds,
  settings,
  availableCount,
  onStart,
}: QuizSetupProps) => {
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      onStart()
    },
    [onStart],
  )

  return (
    <form className={styles.setup} onSubmit={handleSubmit} data-testid="quiz-setup">
      <h1 className={styles.title}>{TEXTS.quiz.setupTitle}</h1>
      <p className={styles.intro}>{TEXTS.quiz.setupIntro}</p>
      <GroupPicker groups={data.groups} taxa={data.taxa} selectedGroupIds={selectedGroupIds} />
      <fieldset className={styles.options}>
        <legend>{TEXTS.quiz.modeLegend}</legend>
        <label>
          <input
            type="radio"
            name={MODE_PARAM}
            value="choice"
            checked={settings.mode === 'choice'}
            onChange={handleParamChange}
            data-testid="quiz-setup--mode-choice"
          />
          {TEXTS.quiz.modeChoice}
        </label>
        <label>
          <input
            type="radio"
            name={MODE_PARAM}
            value="typing"
            checked={settings.mode === 'typing'}
            onChange={handleParamChange}
            data-testid="quiz-setup--mode-typing"
          />
          {TEXTS.quiz.modeTyping}
        </label>
      </fieldset>
      <fieldset className={styles.options}>
        <legend>{TEXTS.quiz.countLegend}</legend>
        {COUNT_OPTIONS.map((count) => (
          <label key={serializeCount(count)}>
            <input
              type="radio"
              name={COUNT_PARAM}
              value={serializeCount(count)}
              checked={settings.count === count}
              onChange={handleParamChange}
              data-testid={`quiz-setup--count-${serializeCount(count)}`}
            />
            {count ?? TEXTS.quiz.countAll}
          </label>
        ))}
      </fieldset>
      <fieldset className={styles.options}>
        <legend>{TEXTS.quiz.focusLegend}</legend>
        <label>
          <input
            type="radio"
            name={FOCUS_PARAM}
            value="random"
            checked={settings.focus === 'random'}
            onChange={handleParamChange}
            data-testid="quiz-setup--focus-random"
          />
          {TEXTS.quiz.focusRandom}
        </label>
        <label>
          <input
            type="radio"
            name={FOCUS_PARAM}
            value="weak"
            checked={settings.focus === 'weak'}
            onChange={handleParamChange}
            data-testid="quiz-setup--focus-weak"
          />
          {TEXTS.quiz.focusWeak}
        </label>
      </fieldset>
      {availableCount === 0 ? (
        <p className={styles.warning}>{TEXTS.quiz.notEnough}</p>
      ) : (
        <button type="submit" className={styles.primaryButton} data-testid="quiz-setup--start">
          {TEXTS.quiz.start}
        </button>
      )}
    </form>
  )
}
