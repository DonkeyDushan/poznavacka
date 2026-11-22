export type Rank = 'species' | 'genus' | 'family' | 'order' | 'class' | 'phylum' | 'group'

export type GroupId =
  | 'protists'
  | 'algae'
  | 'bryophytes'
  | 'ferns'
  | 'conifers'
  | 'monocots'
  | 'dicots'
  | 'fungi'
  | 'lichens'
  | 'invertebrates'
  | 'arthropods'
  | 'insects'
  | 'fish'
  | 'amphibians'
  | 'reptiles'
  | 'birds'
  | 'mammals'

export type TaxonPhoto = {
  src: string
  page: string
  author: string
  license: string
}

export type Taxon = {
  id: string
  rank: Rank
  czechName: string
  czechSynonyms: string[]
  latinName: string
  latinSynonyms: string[]
  note: string | null
  isIntroduced: boolean
  groupId: GroupId
  sectionName: string | null
  /** The taxon in the column left of this one: usually a family, an order for fungi. */
  higherTaxon: { rank: Rank; czechName: string; latinName: string } | null
  genus: { czechNames: string[]; latinNames: string[] } | null
  photos: TaxonPhoto[]
  wikipediaUrl: string | null
}

export type TaxonGroup = {
  id: GroupId
  label: string
}

export type TaxaData = {
  groups: TaxonGroup[]
  taxa: Taxon[]
}
