import { AtlasPage } from './atlas/AtlasPage'
import { useTaxaData } from './data/useTaxaData'
import { FlashcardsPage } from './flashcards/FlashcardsPage'
import { QuizPage } from './quiz/QuizPage'
import type { HashRoute } from './routing/useHashRoute'

type PageContentProps = {
  route: HashRoute
}

export const PageContent = ({ route }: PageContentProps) => {
  const data = useTaxaData()

  if (route.pageId === 'flashcards') {
    return <FlashcardsPage data={data} params={route.params} />
  }
  if (route.pageId === 'atlas') {
    return <AtlasPage data={data} params={route.params} />
  }

  return <QuizPage data={data} params={route.params} />
}
