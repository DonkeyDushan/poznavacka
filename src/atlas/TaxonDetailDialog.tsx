import { useCallback, useEffect, useRef, type MouseEvent } from 'react'
import { TaxonAnswer } from '../components/TaxonAnswer'
import { TaxonPhoto } from '../components/TaxonPhoto'
import type { Taxon } from '../data/taxon'
import { TEXTS } from '../texts/csTexts'
import styles from './Atlas.module.css'

type TaxonDetailDialogProps = {
  taxon: Taxon
  onClose: () => void
}

export const TaxonDetailDialog = ({ taxon, onClose }: TaxonDetailDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) {
      throw new Error('Dialog element missing')
    }
    // No close() on cleanup: its async "close" event would clear the URL after a StrictMode remount.
    if (!dialog.open) {
      dialog.showModal()
    }
  }, [])

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDialogElement>) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    },
    [onClose],
  )

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClose={onClose}
      onClick={handleBackdropClick}
      data-testid="taxon-detail"
    >
      <div className={styles.dialogBody}>
        <button
          type="button"
          className={styles.dialogClose}
          onClick={onClose}
          aria-label={TEXTS.atlas.close}
          data-testid="taxon-detail--close"
        >
          ×
        </button>
        <TaxonPhoto
          key={taxon.id}
          photos={taxon.photos}
          alt={taxon.czechName}
          testId="taxon-detail--photo"
        />
        <TaxonAnswer taxon={taxon} testId="taxon-detail--answer" />
      </div>
    </dialog>
  )
}
