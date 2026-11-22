import type { Taxon } from '../data/taxon'
import { TEXTS } from '../texts/csTexts'
import { EdibilityBadge } from './EdibilityBadge'
import styles from './TaxonAnswer.module.css'
import { TaxonSounds } from './TaxonSounds'

type TaxonAnswerProps = {
  taxon: Taxon
  testId: string
}

export const TaxonAnswer = ({ taxon, testId }: TaxonAnswerProps) => {
  const synonyms = [...taxon.czechSynonyms, ...taxon.latinSynonyms]
  const genusName = taxon.genus?.czechNames[0]
  const genusLatinName = taxon.genus?.latinNames[0]
  const { higherTaxon } = taxon

  return (
    <div className={styles.answer} data-testid={testId}>
      <div className={styles.names}>
        <span className={styles.czechName}>{taxon.czechName}</span>
        {taxon.latinName && <span className={styles.latinName}>{taxon.latinName}</span>}
        {taxon.isIntroduced && <span className={styles.badge}>{TEXTS.taxon.introduced}</span>}
        {taxon.edibility && (
          <EdibilityBadge edibility={taxon.edibility} testId={`${testId}--edibility`} />
        )}
      </div>
      {taxon.note && <p className={styles.note}>{taxon.note}</p>}
      <dl className={styles.details}>
        {synonyms.length > 0 && (
          <>
            <dt>{TEXTS.taxon.synonyms}</dt>
            <dd>{synonyms.join(', ')}</dd>
          </>
        )}
        {taxon.rank === 'species' && genusName && (
          <>
            <dt>{TEXTS.rankTitle.genus}</dt>
            <dd>
              {genusName} {genusLatinName && <i>({genusLatinName})</i>}
            </dd>
          </>
        )}
        {higherTaxon && (
          <>
            <dt>{TEXTS.rankTitle[higherTaxon.rank]}</dt>
            <dd>
              {higherTaxon.czechName}{' '}
              {higherTaxon.latinName !== higherTaxon.czechName && <i>({higherTaxon.latinName})</i>}
            </dd>
          </>
        )}
        {taxon.sectionName && (
          <>
            <dt>{TEXTS.taxon.section}</dt>
            <dd>{taxon.sectionName}</dd>
          </>
        )}
      </dl>
      {taxon.sounds.length > 0 && (
        <TaxonSounds sounds={taxon.sounds} testId={`${testId}--sounds`} />
      )}
      {taxon.wikipediaUrl && (
        <a
          className={styles.wikipedia}
          href={taxon.wikipediaUrl}
          target="_blank"
          rel="noreferrer"
          data-testid={`${testId}--wikipedia`}
        >
          {TEXTS.taxon.wikipedia} ↗
        </a>
      )}
    </div>
  )
}
