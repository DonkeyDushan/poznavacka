import { useCallback, useState } from 'react'
import type { TaxonPhoto as TaxonPhotoData } from '../data/taxon'
import { TEXTS } from '../texts/csTexts'
import styles from './TaxonPhoto.module.css'

type TaxonPhotoProps = {
  photos: readonly TaxonPhotoData[]
  initialIndex?: number
  /** Alt text; empty while the name is the answer to guess. */
  alt: string
  testId: string
}

/** Photo with Commons attribution and switching between the taxon's photos. */
export const TaxonPhoto = ({ photos, initialIndex = 0, alt, testId }: TaxonPhotoProps) => {
  const [index, setIndex] = useState(initialIndex)

  const photo = photos[index % photos.length]
  const hasMore = photos.length > 1

  const handlePrevious = useCallback(
    () => setIndex((current) => (current - 1 + photos.length) % photos.length),
    [photos.length],
  )
  const handleNext = useCallback(
    () => setIndex((current) => (current + 1) % photos.length),
    [photos.length],
  )

  if (!photo) {
    return (
      <div className={styles.frame} data-testid={testId}>
        <span className={styles.missing}>{TEXTS.taxon.noPhoto}</span>
      </div>
    )
  }

  return (
    <figure className={styles.figure} data-testid={testId}>
      <div className={styles.frame}>
        <img className={styles.image} src={photo.src} alt={alt} decoding="async" />
        {hasMore && (
          <>
            <button
              type="button"
              className={styles.arrow}
              data-side="left"
              onClick={handlePrevious}
              aria-label={TEXTS.photo.previous}
              data-testid={`${testId}--previous`}
            >
              ‹
            </button>
            <button
              type="button"
              className={styles.arrow}
              data-side="right"
              onClick={handleNext}
              aria-label={TEXTS.photo.next}
              data-testid={`${testId}--next`}
            >
              ›
            </button>
            <span className={styles.counter}>
              {TEXTS.photo.count((index % photos.length) + 1, photos.length)}
            </span>
          </>
        )}
      </div>
      <figcaption className={styles.credit}>
        {TEXTS.photo.credit}:{' '}
        <a href={photo.page} target="_blank" rel="noreferrer">
          {photo.author}
          {photo.license && `, ${photo.license}`}
        </a>
      </figcaption>
    </figure>
  )
}
