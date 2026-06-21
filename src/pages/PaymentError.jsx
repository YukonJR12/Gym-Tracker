import './PaymentResult.css'

export default function PaymentError() {
  return (
    <div className="result-page">
      <div className="result-card">
        <span className="result-icon result-icon-error">✕</span>
        <h1 className="result-title">Payment Cancelled</h1>
        <p className="result-desc">
          Your payment was not completed. No charge has been made.
          You can try again whenever you're ready.
        </p>
        <a href="/" className="result-btn result-btn-ghost">
          Back to Gym Tracker
        </a>
      </div>
    </div>
  )
}
