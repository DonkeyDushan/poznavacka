import { Suspense } from 'react'
import { PageContent } from './PageContent'
import { buildHash, useHashRoute, type PageId } from './routing/useHashRoute'
import { GROUPS_PARAM } from './taxa/taxonSelection'
import { TEXTS } from './texts/csTexts'
import styles from './App.module.css'
import { ErrorBoundary } from './ErrorBoundary'

const NAV_PAGES: readonly PageId[] = Object.freeze(['quiz', 'flashcards', 'atlas'])

/** Keeps the group selection when switching between pages. */
const navHref = (pageId: PageId, params: URLSearchParams) => {
  const groups = params.get(GROUPS_PARAM)

  return buildHash(pageId, groups ? new URLSearchParams({ [GROUPS_PARAM]: groups }) : undefined)
}

export const App = () => {
  const route = useHashRoute()

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <a className={styles.brand} href={buildHash('quiz')}>
          <span className={styles.brandTitle}>🌿 {TEXTS.appTitle}</span>
          <span className={styles.brandSubtitle}>{TEXTS.appSubtitle}</span>
        </a>
        <nav className={styles.nav}>
          {NAV_PAGES.map((pageId) => (
            <a
              key={pageId}
              className={styles.navLink}
              href={navHref(pageId, route.params)}
              aria-current={route.pageId === pageId ? 'page' : undefined}
              data-testid={`app-nav--${pageId}`}
            >
              {TEXTS.nav[pageId]}
            </a>
          ))}
        </nav>
      </header>
      <main className={styles.main}>
        <ErrorBoundary fallback={<p className={styles.status}>{TEXTS.loadError}</p>}>
          <Suspense fallback={<p className={styles.status}>{TEXTS.loading}</p>}>
            <PageContent route={route} />
          </Suspense>
        </ErrorBoundary>
      </main>
      <footer className={styles.footer}>
        <p>{TEXTS.footer.source}</p>
        <p>{TEXTS.footer.progressNote}</p>
      </footer>
    </div>
  )
}
