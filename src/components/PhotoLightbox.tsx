import { useCallback, useEffect, useRef, type MouseEvent, type SyntheticEvent } from 'react'
import { toLargeUrl } from '../data/photoThumbnail'
import type { TaxonPhoto } from '../data/taxon'
import { TEXTS } from '../texts/csTexts'
import styles from './PhotoLightbox.module.css'

type PhotoLightboxProps = {
  photo: TaxonPhoto
  alt: string
  counter: string | null
  onPrevious: (() => void) | null
  onNext: (() => void) | null
  onClose: () => void
  testId: string
}

/** Falls back to the regular size when Commons has no larger thumbnail of a small original. */
const handleLargeImageError = (event: SyntheticEvent<HTMLImageElement>) => {
  const image = event.currentTarget
  const fallback = image.dataset.fallback
  if (fallback && image.src !== fallback) {
    image.src = fallback
  }
}

export const PhotoLightbox = ({
  photo,
  alt,
  counter,
  onPrevious,
  onNext,
  onClose,
  testId,
}: PhotoLightboxProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      throw new Error('Lightbox dialog element missing')
    }
    // No close() on cleanup: its async "close" event would fire onClose after a StrictMode remount.
    if (!dialog.open) {
      dialog.showModal()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && onPrevious) {
        onPrevious()
      }
      if (event.key === 'ArrowRight' && onNext) {
        onNext()
      }
      // Keep quiz and flashcard shortcuts from acting behind the lightbox.
      event.stopPropagation()
    }
    window.addEventListener('keydown', handleKeyDown, { capture: true })

    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [onNext, onPrevious])

  const handleClose = useCallback(
    (event: SyntheticEvent<HTMLDialogElement>) => {
      // A lightbox inside the atlas detail must not close the detail too.
      event.stopPropagation()
      onClose()
    },
    [onClose],
  )
  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDialogElement>) => {
      event.stopPropagation()
      if (event.target === event.currentTarget || event.target instanceof HTMLImageElement) {
        onClose()
      }
    },
    [onClose],
  )

  return (
    <dialog
      ref={dialogRef}
      className={styles.lightbox}
      onClose={handleClose}
      onClick={handleBackdropClick}
      data-testid={testId}
    >
      <img
        key={photo.src}
        className={styles.image}
        src={toLargeUrl(photo.src)}
        data-fallback={photo.src}
        onError={handleLargeImageError}
        alt={alt}
      />
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label={TEXTS.photo.close}
        data-testid={`${testId}--close`}
      >
        ×
      </button>
      {onPrevious && (
        <button
          type="button"
          className={styles.arrow}
          data-side="left"
          onClick={onPrevious}
          aria-label={TEXTS.photo.previous}
          data-testid={`${testId}--previous`}
        >
          ‹
        </button>
      )}
      {onNext && (
        <button
          type="button"
          className={styles.arrow}
          data-side="right"
          onClick={onNext}
          aria-label={TEXTS.photo.next}
          data-testid={`${testId}--next`}
        >
          ›
        </button>
      )}
      <p className={styles.caption}>
        {counter && <span>{counter} · </span>}
        {TEXTS.photo.credit}:{' '}
        <a href={photo.page} target="_blank" rel="noreferrer">
          {photo.author}
          {photo.license && `, ${photo.license}`}
        </a>
      </p>
    </dialog>
  )
}
