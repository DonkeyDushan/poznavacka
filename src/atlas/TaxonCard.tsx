import { useCallback } from 'react'
import { EdibilityBadge } from '../components/EdibilityBadge'
import { toThumbnailUrl } from '../data/photoThumbnail'
import type { Taxon } from '../data/taxon'
import { LEARNED_BOX, useProgress } from '../progress/progressStore'
import { TEXTS } from '../texts/csTexts'
import styles from './Atlas.module.css'

type TaxonCardProps = {
  taxon: Taxon
  onOpen: (taxonId: string) => void
}

export const TaxonCard = ({ taxon, onOpen }: TaxonCardProps) => {
  const progress = useProgress()

  const photo = taxon.photos[0]
  const isLearned = (progress[taxon.id]?.box ?? 0) >= LEARNED_BOX

  const handleClick = useCallback(() => onOpen(taxon.id), [onOpen, taxon.id])

  return (
    <li>
      <button
        type="button"
        className={styles.card}
        onClick={handleClick}
        data-learned={isLearned}
        data-testid={`atlas-card--${taxon.id}`}
      >
        {photo ? (
          <img className={styles.cardImage} src={toThumbnailUrl(photo.src)} alt="" loading="lazy" />
        ) : (
          <span className={styles.cardImage} data-missing="true">
            {TEXTS.taxon.noPhoto}
          </span>
        )}
        <span className={styles.cardNames}>
          <span className={styles.cardCzech}>
            {taxon.czechName}{' '}
            {taxon.edibility && (
              <EdibilityBadge
                edibility={taxon.edibility}
                testId={`atlas-card--${taxon.id}--edibility`}
              />
            )}
          </span>
          <i className={styles.cardLatin}>{taxon.latinName}</i>
        </span>
      </button>
    </li>
  )
}
