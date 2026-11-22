import styles from './Atlas.module.css'
import type { AtlasSectionData } from './AtlasPage'
import { TaxonCard } from './TaxonCard'

type AtlasSectionProps = {
  section: AtlasSectionData
  onOpen: (taxonId: string) => void
}

export const AtlasSection = ({ section, onOpen }: AtlasSectionProps) => (
  <section className={styles.section}>
    {section.title && <h2 className={styles.sectionTitle}>{section.title}</h2>}
    <ul className={styles.grid}>
      {section.taxa.map((taxon) => (
        <TaxonCard key={taxon.id} taxon={taxon} onOpen={onOpen} />
      ))}
    </ul>
  </section>
)
