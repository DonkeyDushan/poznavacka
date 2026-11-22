import { Component, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  fallback: ReactNode
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

// React still offers error boundaries only as class components.
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError = (): ErrorBoundaryState => ({ hasError: true })

  render = () => (this.state.hasError ? this.props.fallback : this.props.children)
}
