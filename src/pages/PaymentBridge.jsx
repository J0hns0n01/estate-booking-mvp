import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import '../App.css'

function PaymentBridge() {
  const { facilityParam } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [paymentInitializing, setPaymentInitializing] = useState(false)

  useEffect(() => {
    async function loadBooking() {
      const params = new URLSearchParams(window.location.search)

      const name = params.get('name')
      const email = params.get('email')
      const phone = params.get('answer_1')
      const answer2 = params.get('answer_2') // Number of persons
      const bookingId = params.get('booking_id')
      const startAt = params.get('start_at')
      const endAt = params.get('end_at')
      const facility = facilityParam || params.get('facility')

      const FACILITY_LABELS = {
        conference_hall: 'Conference Hall',
        swimming_pool: 'Swimming Pool',
        tennis_court: 'Tennis Court'
      }
      const facilityLabel = FACILITY_LABELS[facility] || facility || 'Not specified'

      if (!bookingId) {
        setErrorMessage('Booking information is missing.')
        setLoading(false)
        return
      }

      let bookingDate = ''
      let startTime = ''
      let endTime = ''
      let durationMinutes = null

      if (startAt) {
        const start = new Date(startAt)

        bookingDate = start.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })

        startTime = start.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        })

        if (endAt) {
          const end = new Date(endAt)

          endTime = end.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          })

          durationMinutes = Math.round(
            (end.getTime() - start.getTime()) / 60000
          )
        }
      }

      if (!durationMinutes) {
        setErrorMessage('Invalid booking duration.')
        setLoading(false)
        return
      }

      const { data: facilityData, error: facilityError } = await supabase
        .from('facilities')
        .select('*')
        .eq('slug', facility)
        .single()

      if (facilityError || !facilityData) {
        setErrorMessage('Invalid facility or pricing not found.')
        setLoading(false)
        return
      }

      let amount = 0
      let participantCount = 1

      if (facilityData.pricing_model === 'per_person') {
        const rawAnswer2 = (answer2 || '').trim()
        const isWholeInteger = /^\d+$/.test(rawAnswer2)
        const parsedPersons = isWholeInteger ? parseInt(rawAnswer2, 10) : NaN
        const maxAllowed = facilityData.max_people_per_booking || 4

        if (!isWholeInteger || isNaN(parsedPersons) || parsedPersons < 1) {
          setErrorMessage('Invalid number of persons.')
          setLoading(false)
          return
        }
        if (parsedPersons > maxAllowed) {
          setErrorMessage(`Maximum number of persons is ${maxAllowed}.`)
          setLoading(false)
          return
        }
        participantCount = parsedPersons
        amount = participantCount * facilityData.price_per_person
      } else {
        if (durationMinutes < facilityData.minimum_duration_minutes) {
          setErrorMessage(`Minimum booking duration for this facility is ${facilityData.minimum_duration_minutes} minutes.`)
          setLoading(false)
          return
        }
        amount = (durationMinutes / 30) * facilityData.rate_per_30_minutes
      }

      const { error } = await supabase
        .from('bookings')
        .insert({
          koalendar_booking_id: bookingId,
          customer_name: name,
          email: email,
          phone: phone,
          booking_date: startAt
            ? new Date(startAt).toISOString().split('T')[0]
            : null,
          start_time: startAt
            ? new Date(startAt).toTimeString().slice(0, 8)
            : null,
          end_time: endAt
            ? new Date(endAt).toTimeString().slice(0, 8)
            : null,
          duration_minutes: durationMinutes,
          facility: facility || null,
          participant_count: participantCount,
          amount: amount,
          payment_status: 'pending',
          booking_status: 'pending_approval'
        })

      if (error && error.code !== '23505') {
        console.error('SUPABASE ERROR:', error)
        setErrorMessage(error.message)
        setLoading(false)
        return
      }

      setBooking({
        name,
        email,
        phone,
        bookingId,
        bookingDate,
        startTime,
        endTime,
        durationMinutes,
        facilitySlug: facility || null,
        facilityLabel,
        pricingModel: facilityData.pricing_model,
        pricePerPerson: facilityData.price_per_person,
        participantCount,
        amount
      })

      setLoading(false)
    }

    loadBooking()
  }, [])

  async function handlePayment() {
    if (!booking) return
    setPaymentInitializing(true)
    setPaymentError('')

    try {
      const res = await fetch('/api/initialize-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: booking.email,
          amount: booking.amount,
          booking_id: booking.bookingId,
          facility: booking.facilitySlug
        })
      })

      let data = null
      try {
        const text = await res.text()
        data = text ? JSON.parse(text) : null
      } catch {
        data = null
      }

      if (!res.ok) {
        throw new Error(
          data?.message ||
          (res.status === 404
            ? 'Payment endpoint (/api/initialize-payment) not found on local dev server. Run `vercel dev` to test Paystack.'
            : `Payment initialization failed (${res.status}).`)
        )
      }

      if (!data?.authorization_url) {
        throw new Error('Payment authorization URL missing.')
      }

      window.location.href = data.authorization_url
    } catch (err) {
      console.error(err)
      setPaymentError(err.message)
      setPaymentInitializing(false)
    }
  }

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-card payment-card--loading">
          <div className="payment-spinner"></div>
          <h2>Preparing your booking...</h2>
          <p>Please wait a moment while we retrieve your details.</p>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="payment-page">
        <div className="payment-card payment-card--error">
          <div className="payment-status-icon error">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
          <h2>Unable to load booking</h2>
          <p>{errorMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="payment-page">
      <div className="payment-card">
        
        <header className="payment-header">
          <h1 className="payment-brand-title">REGIMANUEL GRAY</h1>
          <p className="payment-brand-subtitle">Estate Facilities</p>
        </header>

        <div className="payment-status-panel">
          <div className="payment-status-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="payment-status-text">
            <h2>Booking received</h2>
            <p>Review your reservation details and proceed to payment.</p>
          </div>
        </div>

        <div className="payment-summary">
          <div className="payment-row">
            <span className="payment-label">Name</span>
            <strong className="payment-value">{booking.name || 'Not provided'}</strong>
          </div>
          <div className="payment-row">
            <span className="payment-label">Email</span>
            <strong className="payment-value">{booking.email || 'Not provided'}</strong>
          </div>
          <div className="payment-row">
            <span className="payment-label">Facility</span>
            <strong className="payment-value">{booking.facilityLabel}</strong>
          </div>
          <div className="payment-row">
            <span className="payment-label">Date</span>
            <strong className="payment-value">{booking.bookingDate}</strong>
          </div>
          <div className="payment-row">
            <span className="payment-label">Time</span>
            <strong className="payment-value">
              {booking.startTime}
              {booking.endTime ? ` - ${booking.endTime}` : ''}
            </strong>
          </div>
          {booking.pricingModel === 'per_person' ? (
            <>
              <div className="payment-row">
                <span className="payment-label">Number of Persons</span>
                <strong className="payment-value">{booking.participantCount}</strong>
              </div>
              <div className="payment-row">
                <span className="payment-label">Price per Person</span>
                <strong className="payment-value">GH₵ {booking.pricePerPerson?.toLocaleString('en-GH')}</strong>
              </div>
            </>
          ) : (
            <div className="payment-row">
              <span className="payment-label">Duration</span>
              <strong className="payment-value">
                {booking.durationMinutes
                  ? `${booking.durationMinutes} minutes`
                  : 'Not available'}
              </strong>
            </div>
          )}
          <div className="payment-row">
            <span className="payment-label">Booking ID</span>
            <strong className="payment-value">{booking.bookingId}</strong>
          </div>
          <div className="payment-row payment-row--amount">
            <span className="payment-label">Total Amount</span>
            <strong className="payment-value">GH₵ {booking.amount?.toLocaleString('en-GH')}</strong>
          </div>
        </div>

        <div className="payment-action">
          <button className="payment-btn" onClick={handlePayment} disabled={paymentInitializing}>
            {paymentInitializing ? 'Preparing Payment...' : 'Proceed to Payment'}
          </button>
          
          {paymentError && (
            <p className="payment-error-note" style={{ color: '#dc2626', fontSize: '13px', margin: '12px 0 0' }}>
              {paymentError}
            </p>
          )}

          <div className="payment-trust">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Secure payment processing
          </div>

          <p className="payment-note">
            Your booking will be confirmed after payment is verified and approved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentBridge
