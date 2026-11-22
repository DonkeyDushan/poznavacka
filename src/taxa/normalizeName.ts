/** Lower case without diacritics and punctuation, for tolerant name comparison and search. */
export const normalizeName = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\bagg\b\.?|\*/g, ' ')
    .replace(/[^a-z0-9-]+/g, ' ')
    .trim()
