import { useCallback, useEffect, useState } from 'react'
import { TaxonAnswer } from '../components/TaxonAnswer'
import { TaxonPhoto } from '../components/TaxonPhoto'
import type { Taxon } from '../data/taxon'
import { getProgress, recordGrade, type Grade } from '../progress/progressStore'
import { pickPhotoIndex } from '../taxa/taxonSelection'
import { TEXTS } from '../texts/csTexts'
import { pickNextFlashcard } from './flashcardQueue'
import styles from './Flashcards.module.css'

type FlashcardSessionProps = {
  taxa: readonly Taxon[]
}

type Card = {
  taxon: Taxon
  photoIndex: number
}

const GRADE_BY_KEY: Readonly<Record<string, Grade>> = Object.freeze({
  '1': 'again',
  '2': 'hard',
  '3': 'good',
})

const drawCard = (taxa: readonly Taxon[], previousTaxonId: string | null): Card | null => {
  const taxon = pickNextFlashcard(taxa, getProgress(), Date.now(), previousTaxonId)

  return taxon && { taxon, photoIndex: pickPhotoIndex(taxon) }
}

export const FlashcardSession = ({ taxa }: FlashcardSessionProps) => {
  const [card, setCard] = useState(() => drawCard(taxa, null))
  const [isRevealed, setIsRevealed] = useState(false)

  const handleReveal = useCallback(() => setIsRevealed(true), [])
  const handleGrade = useCallback(
    (grade: Grade) => {
      if (!card) {
        return
      }
      recordGrade(card.taxon.id, grade)
      setCard(drawCard(taxa, card.taxon.id))
      setIsRevealed(false)
    },
    [card, taxa],
  )
  const handleAgain = useCallback(() => handleGrade('again'), [handleGrade])
  const handleHard = useCallback(() => handleGrade('hard'), [handleGrade])
  const handleGood = useCallback(() => handleGrade('good'), [handleGrade])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.ctrlKey || event.metaKey) {
        return
      }
      if (!isRevealed && (event.key === ' ' || event.key === 'Enter')) {
        event.preventDefault()
        setIsRevealed(true)

        return
      }
      const grade = GRADE_BY_KEY[event.key]
      if (isRevealed && grade) {
        handleGrade(grade)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleGrade, isRevealed])

  if (!card) {
    return <p>{TEXTS.flashcards.empty}</p>
  }

  return (
    <section className={styles.card} data-testid="flashcard">
      <div className={styles.prompt}>
        <strong>{TEXTS.rankPrompt[card.taxon.rank]}</strong>
        {card.taxon.note && <span className={styles.promptNote}>({card.taxon.note})</span>}
      </div>
      <TaxonPhoto
        key={card.taxon.id}
        photos={card.taxon.photos}
        initialIndex={card.photoIndex}
        alt={isRevealed ? card.taxon.czechName : ''}
        testId="flashcard--photo"
      />
      {isRevealed ? (
        <>
          <TaxonAnswer taxon={card.taxon} testId="flashcard--answer" />
          <div className={styles.grades}>
            <button
              type="button"
              className={styles.grade}
              data-grade="again"
              onClick={handleAgain}
              data-testid="flashcard--again"
            >
              <span className={styles.shortcut}>1</span> {TEXTS.flashcards.again}
            </button>
            <button
              type="button"
              className={styles.grade}
              data-grade="hard"
              onClick={handleHard}
              data-testid="flashcard--hard"
            >
              <span className={styles.shortcut}>2</span> {TEXTS.flashcards.hard}
            </button>
            <button
              type="button"
              className={styles.grade}
              data-grade="good"
              onClick={handleGood}
              data-testid="flashcard--good"
            >
              <span className={styles.shortcut}>3</span> {TEXTS.flashcards.good}
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          className={styles.reveal}
          onClick={handleReveal}
          data-testid="flashcard--reveal"
        >
          {TEXTS.flashcards.reveal}
        </button>
      )}
      <p className={styles.hint}>{TEXTS.flashcards.keyboardHint}</p>
    </section>
  )
}
