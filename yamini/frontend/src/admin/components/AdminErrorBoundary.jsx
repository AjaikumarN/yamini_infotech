import React from 'react'

export default class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Log to console for now — could send to a backend monitoring endpoint
    console.error('AdminErrorBoundary caught an error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2>Something went wrong in the Admin UI</h2>
          <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left', display: 'inline-block', maxWidth: '80%', marginTop: 12 }}>
            {String(this.state.error && this.state.error.stack ? this.state.error.stack : this.state.error)}
          </pre>
        </div>
      )
    }

    return this.props.children
  }
}