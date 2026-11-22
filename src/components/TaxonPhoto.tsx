import { useCallback, useState } from 'react'
import type { TaxonPhoto as TaxonPhotoData } from '../data/taxon'
import { TEXTS } from '../texts/csTexts'
import { PhotoLightbox } from './PhotoLightbox'
import styles from './TaxonPhoto.module.css'

type TaxonPhotoProps = {
  photos: readonly TaxonPhotoData[]
  initialIndex?: number
  /** Alt text; empty while the name is the answer to guess. */
  alt: string
  testId: string
}

/** Whole photo (never cropped) with Commons attribution, switching and a click-to-zoom lightbox. */
export const TaxonPhoto = ({ photos, initialIndex = 0, alt, testId }: TaxonPhotoProps) => {
  const [index, setIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)

  const photo = photos[index % photos.length]
  const hasMore = photos.length > 1
  const counter = hasMore ? TEXTS.photo.count((index % photos.length) + 1, photos.length) : null

  const handlePrevious = useCallback(
    () => setIndex((current) => (current - 1 + photos.length) % photos.length),
    [photos.length],
  )
  const handleNext = useCallback(
    () => setIndex((current) => (current + 1) % photos.length),
    [photos.length],
  )
  const handleZoom = useCallback(() => setIsZoomed(true), [])
  const handleZoomClose = useCallback(() => setIsZoomed(false), [])

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
        <button
          type="button"
          className={styles.zoomButton}
          onClick={handleZoom}
          aria-label={TEXTS.photo.zoom}
          data-testid={`${testId}--zoom`}
        >
          <img className={styles.image} src={photo.src} alt={alt} decoding="async" />
        </button>
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
            <span className={styles.counter}>{counter}</span>
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
      {isZoomed && (
        <PhotoLightbox
          photo={photo}
          alt={alt}
          counter={counter}
          onPrevious={hasMore ? handlePrevious : null}
          onNext={hasMore ? handleNext : null}
          onClose={handleZoomClose}
          testId={`${testId}--lightbox`}
        />
      )}
    </figure>
  )
}
