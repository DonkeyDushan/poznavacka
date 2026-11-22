import { use } from 'react'
import type { TaxaData } from './taxon'

const DATA_URL = `${import.meta.env.BASE_URL}data/taxa.json`

const loadTaxaData = async (): Promise<TaxaData> => {
  const response = await fetch(DATA_URL)
  if (!response.ok) {
    throw new Error(`Loading ${DATA_URL} failed with ${response.status}`)
  }

  return (await response.json()) as TaxaData
}

let taxaDataPromise: Promise<TaxaData> | null = null

/** Suspends until the taxa list is loaded; the request runs once per page load. */
export const useTaxaData = (): TaxaData => {
  taxaDataPromise ??= loadTaxaData()

  return use(taxaDataPromise)
}
