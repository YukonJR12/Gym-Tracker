import { useState } from 'react'
import { supabase } from '../supabase'
import './AuthForm.css'

export default function AuthForm() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage('Account created! Check your email to confirm, then log in.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // App.jsx auth listener handles the redirect
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-icon">🏋️</span>
          <h1 className="auth-title">Gym Tracker</h1>
          <p className="auth-sub">Track every rep. Own your progress.</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'auth-tab-active' : ''}`}
            onClick={() => { setMode('login'); setError(null); setMessage(null) }}
          >
            Log in
          </button>
          <button
            className={`auth-tab ${mode === 'signup' ? 'auth-tab-active' : ''}`}
            onClick={() => { setMode('signup'); setError(null); setMessage(null) }}
          >
            Sign up
          </button>
        </div>

        {error && <div className="auth-alert auth-alert-error">✕ {error}</div>}
        {message && <div className="auth-alert auth-alert-success">✓ {message}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-group">
            <label className="auth-label">Email</label>
            <input
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-group">
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            className="auth-switch-btn"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null) }}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}
