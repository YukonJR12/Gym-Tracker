import { useState } from 'react'
import { supabase, PAYMENT_EDGE_URL } from '../supabase'
import './CoachingPlan.css'

export default function CoachingPlan({ session }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handlePayment = async () => {
    setError(null)
    setLoading(true)

    try {
      // Get the current auth token so the Edge Function can verify the request
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      const token = currentSession?.access_token

      const res = await fetch(PAYMENT_EDGE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount: 1.000,
          customerName: session.user.email,
          customerEmail: session.user.email,
          itemName: 'Coaching Plan',
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.paymentUrl) {
        throw new Error(data.error || 'Failed to start payment. Please try again.')
      }

      // Redirect the browser to MyFatoorah hosted checkout
      window.location.href = data.paymentUrl

    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
    // Note: setLoading(false) intentionally omitted on success —
    // the page is navigating away so we keep the spinner until redirect.
  }

  return (
    <div className="coaching-banner">
      <div className="coaching-left">
        <span className="coaching-badge">Coaching</span>
        <h2 className="coaching-title">Get My Coaching Plan</h2>
        <p className="coaching-desc">
          A personalised 4-week workout plan built around your goals,
          your split, and your current progress — delivered straight to your tracker.
        </p>
        <ul className="coaching-perks">
          <li>✓ Custom 4-week program</li>
          <li>✓ Week-by-week progression</li>
          <li>✓ Tailored to your Push/Pull/Legs split</li>
          <li>✓ One-time payment, yours to keep</li>
        </ul>
        {error && (
          <p className="coaching-error">⚠ {error}</p>
        )}
      </div>

      <div className="coaching-right">
        <div className="coaching-price">
          <span className="price-amount">1.000</span>
          <span className="price-currency">KD</span>
        </div>
        <button
          className="coaching-btn"
          onClick={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="coaching-spinner" />
              Redirecting…
            </>
          ) : (
            'Get My Coaching Plan'
          )}
        </button>
        <p className="coaching-secure">🔒 Secure payment via MyFatoorah</p>
      </div>
    </div>
  )
}
