import { useCallback } from 'react'
import type { Taxon } from '../data/taxon'
import styles from './Quiz.module.css'

export type OptionState = 'idle' | 'correct' | 'wrong' | 'dimmed'

type ChoiceOptionProps = {
  taxon: Taxon
  shortcut: number
  state: OptionState
  isDisabled: boolean
  onChoose: (taxon: Taxon) => void
}

export const ChoiceOption = ({
  taxon,
  shortcut,
  state,
  isDisabled,
  onChoose,
}: ChoiceOptionProps) => {
  const handleClick = useCallback(() => onChoose(taxon), [onChoose, taxon])

  return (
    <li>
      <button
        type="button"
        className={styles.choice}
        data-state={state}
        disabled={isDisabled}
        onClick={handleClick}
        data-testid={`quiz-choices--${taxon.id}`}
      >
        <span className={styles.shortcut}>{shortcut}</span>
        <span className={styles.choiceNames}>
          <span>{taxon.czechName}</span>
          <i className={styles.choiceLatin}>{taxon.latinName}</i>
        </span>
      </button>
    </li>
  )
}
