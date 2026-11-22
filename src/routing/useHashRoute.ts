import { useSyncExternalStore } from 'react'

export type PageId = 'quiz' | 'flashcards' | 'atlas'

export type HashRoute = {
  pageId: PageId
  params: URLSearchParams
}

const DEFAULT_PAGE: PageId = 'quiz'
const PAGE_IDS: readonly PageId[] = Object.freeze(['quiz', 'flashcards', 'atlas'])

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange)

  return () => window.removeEventListener('hashchange', onChange)
}

const getHash = () => window.location.hash

const isPageId = (value: string): value is PageId => PAGE_IDS.some((pageId) => pageId === value)

const parseHash = (hash: string): HashRoute => {
  const [path = '', query = ''] = hash.replace(/^#\/?/, '').split('?')
  const pageId = isPageId(path) ? path : DEFAULT_PAGE

  return { pageId, params: new URLSearchParams(query) }
}

export const buildHash = (pageId: PageId, params?: URLSearchParams) => {
  const query = params?.toString()

  return query ? `#/${pageId}?${query}` : `#/${pageId}`
}

/** Updates query params of the current page; empty values are dropped. */
export const updateHashParams = (changes: Record<string, string | null>, shouldReplace = true) => {
  const { pageId, params } = parseHash(getHash())
  Object.entries(changes).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)

      return
    }
    params.delete(key)
  })
  const nextHash = buildHash(pageId, params)
  if (shouldReplace) {
    window.history.replaceState(null, '', nextHash)
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    return
  }
  window.location.hash = nextHash
}

export const useHashRoute = (): HashRoute => {
  const hash = useSyncExternalStore(subscribe, getHash)

  return parseHash(hash)
}
