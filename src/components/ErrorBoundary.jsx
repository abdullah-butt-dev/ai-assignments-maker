import { Component } from "react"

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error("Wizard step crashed:", error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-clay/40 bg-clay-soft p-6 text-center">
          <p className="font-display text-lg text-ink mb-2">Something went wrong on this step.</p>
          <p className="text-sm text-ink-soft mb-4">
            Your draft is safe -- it's saved automatically. Try reloading this step.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg bg-forest text-white text-sm font-medium hover:bg-forest-dark transition"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
