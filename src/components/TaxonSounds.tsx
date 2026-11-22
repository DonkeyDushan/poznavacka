import type { CommonsMedia } from '../data/taxon'
import { TEXTS } from '../texts/csTexts'
import styles from './TaxonSounds.module.css'

type TaxonSoundsProps = {
  sounds: readonly CommonsMedia[]
  testId: string
}

/** Bird voice players with Commons attribution; the audio loads only when played. */
export const TaxonSounds = ({ sounds, testId }: TaxonSoundsProps) => (
  <div className={styles.sounds} data-testid={testId}>
    <span className={styles.label}>{TEXTS.taxon.sound}</span>
    {sounds.map((sound) => (
      <figure key={sound.page} className={styles.sound}>
        <audio className={styles.player} src={sound.src} controls preload="none" />
        <figcaption className={styles.credit}>
          {TEXTS.taxon.soundCredit}:{' '}
          <a href={sound.page} target="_blank" rel="noreferrer">
            {sound.author}
            {sound.license && `, ${sound.license}`}
          </a>
        </figcaption>
      </figure>
    ))}
  </div>
)
