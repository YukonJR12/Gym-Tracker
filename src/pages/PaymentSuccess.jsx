import './PaymentResult.css'

export default function PaymentSuccess() {
  return (
    <div className="result-page">
      <div className="result-card">
        <span className="result-icon result-icon-success">✓</span>
        <h1 className="result-title">Payment Successful!</h1>
        <p className="result-desc">
          Your 4-week personalised coaching plan has been confirmed.
          Check your email for the details.
        </p>
        <a href="/" className="result-btn result-btn-primary">
          Back to Gym Tracker
        </a>
      </div>
    </div>
  )
}
