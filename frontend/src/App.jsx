import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import loadingAnimation from './assests/Loading.lottie';

// ─── Eager imports (tiny files that must be available immediately) ─────────

// ─── Route-based Code Splitting ──────────────────────────────────────────────
// All heavy components are now lazy-loaded, dramatically reducing initial bundle.
// Each lazy() call creates a separate chunk, loaded only when the user navigates there.

const HackAdmin    = lazy(() => import('./Devstack/Admin/adminroutes'));
const HackStudent  = lazy(() => import('./Devstack/Student/Hackstudentroutes'));
const HackMentor   = lazy(() => import('./Devstack/Mentor/Hackmentorroutes'));
const Coordinator  = lazy(() => import('./Devstack/Coordinator/Coordinatorroutes'));

// Auth pages — lightweight but still split to reduce initial bundle
const Login        = lazy(() => import('./components/loginpage/LoginPage'));
const AdminLogin   = lazy(() => import('./components/adminlogin/adminlogin'));
const Reset        = lazy(() => import('./components/adminlogin/resetpassword'));
const Forgot       = lazy(() => import('./components/adminlogin/forgotpassword'));
const ForgotPassword = lazy(() => import('./components/loginpage/ForgotPassword'));
const ResetPassword  = lazy(() => import('./components/loginpage/ResetPassword'));
const SignupPage     = lazy(() => import('./components/signups/signup'));

// ─── App-level Error Boundary ────────────────────────────────────────────────
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production, send to error tracking service (Sentry, Datadog, etc.)
    if (process.env.NODE_ENV === 'production') {
      console.error('[AppErrorBoundary]', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'Inter, sans-serif',
          gap: '16px',
          background: '#f8fafc',
        }}>
          <h1 style={{ fontSize: '24px', color: '#1e293b' }}>Something went wrong</h1>
          <p style={{ color: '#64748b' }}>Please refresh the page or try again later.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Route-level Loading Fallback ─────────────────────────────────────────────
// Shown while lazy chunks are being downloaded — much faster than 2s fixed timeout
function RouteLoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#f8fafc',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #e2e8f0',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Initial App Loader (shown only on very first visit) ─────────────────────
function AppLoader({ children }) {
  const [ready, setReady] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Max 1.5s splash screen (reduced from 2s — improves LCP)
    const fadeTimer = setTimeout(() => setFadeOut(true), 1200);
    const hideTimer = setTimeout(() => setReady(true), 1500);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  if (!ready) {
    return (
      <div
        aria-label="Loading application"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#f8fafc',
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 0.3s ease-out',
          pointerEvents: 'none',
        }}
      >
        <DotLottieReact
          src={loadingAnimation}
          loop
          autoplay
          style={{ width: '220px', height: '220px' }}
        />
      </div>
    );
  }

  return children;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <AppErrorBoundary>
      <AppLoader>
        <Router>
          <div className="App">
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/signup"           element={<SignupPage />} />
                <Route path="/"                 element={<Navigate to="/login" replace />} />
                <Route path="/login"            element={<Login />} />
                <Route path="/adminlogin"       element={<AdminLogin />} />
                <Route path="/adminreset"       element={<Reset />} />
                <Route path="/adminforgot"      element={<Forgot />} />
                <Route path="/forgot-password"  element={<ForgotPassword />} />
                <Route path="/reset-password"   element={<ResetPassword />} />

                {/* Hackathon module routes */}
                <Route path="/hackadmin/*"   element={<HackAdmin />} />
                <Route path="/hackstudent/*" element={<HackStudent />} />
                <Route path="/hackmentor/*"  element={<HackMentor />} />
                <Route path="/coordinator/*" element={<Coordinator />} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </AppLoader>
    </AppErrorBoundary>
  );
}

export default App;