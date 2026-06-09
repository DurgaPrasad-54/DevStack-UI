/**
 * Reusable React Error Boundary Component
 * 
 * Wraps sections of the app to catch rendering errors without crashing everything.
 * Provides contextual fallback UI instead of a blank screen.
 * 
 * Usage:
 *   <ErrorBoundary fallback={<div>Failed to load section</div>}>
 *     <MyComponent />
 *   </ErrorBoundary>
 * 
 *   // With context label
 *   <ErrorBoundary label="User Dashboard">
 *     <Dashboard />
 *   </ErrorBoundary>
 */

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Send to error tracking in production
    if (process.env.NODE_ENV === 'production') {
      // Replace with your error tracking service (Sentry, Datadog, etc.)
      console.error(`[ErrorBoundary:${this.props.label || 'Unknown'}]`, error, errorInfo);
    } else {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack);
    }
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { label = 'This section' } = this.props;

      return (
        <div
          role="alert"
          style={{
            padding: '32px',
            textAlign: 'center',
            background: '#fff5f5',
            border: '1px solid #fed7d7',
            borderRadius: '12px',
            margin: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div style={{ fontSize: '40px' }}>⚠️</div>
          <h3 style={{ color: '#c53030', fontSize: '18px', margin: 0 }}>
            {label} encountered an error
          </h3>
          <p style={{ color: '#718096', fontSize: '14px', maxWidth: '400px', margin: 0 }}>
            {process.env.NODE_ENV === 'development'
              ? this.state.error?.message
              : 'Something went wrong. Please try refreshing or contact support.'}
          </p>

          {/* Development: show component stack */}
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details style={{ textAlign: 'left', width: '100%', maxWidth: '600px' }}>
              <summary style={{ cursor: 'pointer', color: '#3182ce', fontSize: '13px' }}>
                Component Stack
              </summary>
              <pre style={{
                fontSize: '11px',
                overflow: 'auto',
                background: '#f7fafc',
                padding: '12px',
                borderRadius: '6px',
                marginTop: '8px',
                whiteSpace: 'pre-wrap',
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '8px 20px',
                background: '#3182ce',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 20px',
                background: 'transparent',
                color: '#3182ce',
                border: '1px solid #3182ce',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
