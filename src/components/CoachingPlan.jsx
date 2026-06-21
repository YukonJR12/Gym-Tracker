import { useState } from 'react'
import './CoachingPlan.css'

export default function CoachingPlan() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handlePayment = async () => {
    setError(null)
    setLoading(true)
    try {
      // Edge Function call goes here in the next step
      // const res = await fetch(PAYMENT_EDGE_FUNCTION_URL, { ... })
      throw new Error('Payment gateway not connected yet.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
              Processing…
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
