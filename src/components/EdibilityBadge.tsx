import type { Edibility } from '../data/taxon'
import { TEXTS } from '../texts/csTexts'
import styles from './EdibilityBadge.module.css'

type EdibilityBadgeProps = {
  edibility: Edibility
  testId: string
}

export const EdibilityBadge = ({ edibility, testId }: EdibilityBadgeProps) => {
  const { symbol, label } = TEXTS.edibility[edibility]

  return (
    <span className={styles.badge} data-edibility={edibility} title={label} data-testid={testId}>
      <span aria-hidden="true">{symbol}</span> {label}
    </span>
  )
}
