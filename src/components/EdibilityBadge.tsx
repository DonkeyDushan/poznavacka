import type { Edibility } from '../data/taxon'
import { TEXTS } from '../texts/csTexts'
import styles from './EdibilityBadge.module.css'

type EdibilityBadgeProps = {
  edibility: Edibility
  testId: string
}

/** Coloured symbol only; the word stays in the tooltip and for screen readers. */
export const EdibilityBadge = ({ edibility, testId }: EdibilityBadgeProps) => {
  const { symbol, label } = TEXTS.edibility[edibility]

  return (
    <span
      className={styles.badge}
      data-edibility={edibility}
      title={label}
      role="img"
      aria-label={label}
      data-testid={testId}
    >
      {symbol}
    </span>
  )
}
