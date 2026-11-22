import type { Taxon } from '../data/taxon'
import { ChoiceOption, type OptionState } from './ChoiceOption'
import styles from './Quiz.module.css'

type ChoiceOptionsProps = {
  options: readonly Taxon[]
  correctTaxonId: string
  chosenTaxonId: string | null
  onChoose: (taxon: Taxon) => void
}

const getOptionState = (
  taxonId: string,
  correctTaxonId: string,
  chosenTaxonId: string | null,
): OptionState => {
  if (chosenTaxonId === null) {
    return 'idle'
  }
  if (taxonId === correctTaxonId) {
    return 'correct'
  }

  return taxonId === chosenTaxonId ? 'wrong' : 'dimmed'
}

export const ChoiceOptions = ({
  options,
  correctTaxonId,
  chosenTaxonId,
  onChoose,
}: ChoiceOptionsProps) => (
  <ol className={styles.choices} data-testid="quiz-choices">
    {options.map((taxon, index) => (
      <ChoiceOption
        key={taxon.id}
        taxon={taxon}
        shortcut={index + 1}
        state={getOptionState(taxon.id, correctTaxonId, chosenTaxonId)}
        isDisabled={chosenTaxonId !== null}
        onChoose={onChoose}
      />
    ))}
  </ol>
)
