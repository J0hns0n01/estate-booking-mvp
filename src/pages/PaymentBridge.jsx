import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import '../App.css'

function PaymentBridge() {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [paymentInitializing, setPaymentInitializing] = useState(false)

  useEffect(() => {
    async function loadBooking() {
      const params = new URLSearchParams(window.location.search)

      const name = params.get('name')
      const email = params.get('email')
      const phone = params.get('answer_1')
      const bookingId = params.get('booking_id')
      const startAt = params.get('start_at')
      const endAt = params.get('end_at')
      const facility = params.get('facility')

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

      if (durationMinutes < facilityData.minimum_duration_minutes) {
        setErrorMessage(`Minimum booking duration for this facility is ${facilityData.minimum_duration_minutes} minutes.`)
        setLoading(false)
        return
      }

      const amount = (durationMinutes / 30) * facilityData.rate_per_30_minutes;

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
        amount
      })

      setLoading(false)
    }

    loadBooking()
  }, [])

  async function handlePayment() {
    if (!booking) return
    setPaymentInitializing(true)
    setErrorMessage('')

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

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to initialize payment')
      }

      window.location.href = data.authorization_url
    } catch (err) {
      console.error(err)
      setErrorMessage(err.message)
      setPaymentInitializing(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <div className="spinner"></div>
          <h2>Preparing your booking...</h2>
          <p>Please wait a moment.</p>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="page">
        <div className="card">
          <div className="statusIcon error">!</div>
          <h2>Unable to load booking</h2>
          <p>{errorMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="card">
        <div className="brand">
          <div className="logoMark">E</div>
          <div>
            <h1>Estate Facilities</h1>
            <p>Booking &amp; Payment</p>
          </div>
        </div>

        <div className="successBox">
          <div className="statusIcon">✓</div>
          <div>
            <h2>Booking received</h2>
            <p>Your booking is pending payment and approval.</p>
          </div>
        </div>

        <div className="section">
          <h3>Booking Summary</h3>

          <div className="row">
            <span>Name</span>
            <strong>{booking.name || 'Not provided'}</strong>
          </div>

          <div className="row">
            <span>Email</span>
            <strong>{booking.email || 'Not provided'}</strong>
          </div>

          <div className="row">
            <span>Facility</span>
            <strong>{booking.facilityLabel}</strong>
          </div>

          <div className="row">
            <span>Date</span>
            <strong>{booking.bookingDate}</strong>
          </div>

          <div className="row">
            <span>Time</span>
            <strong>
              {booking.startTime}
              {booking.endTime ? ` - ${booking.endTime}` : ''}
            </strong>
          </div>

          <div className="row">
            <span>Duration</span>
            <strong>
              {booking.durationMinutes
                ? `${booking.durationMinutes} minutes`
                : 'Not available'}
            </strong>
          </div>

          <div className="row">
            <span>Amount</span>
            <strong>GH₵ {booking.amount?.toLocaleString('en-GH')}</strong>
          </div>

          <div className="row">
            <span>Booking ID</span>
            <strong>{booking.bookingId}</strong>
          </div>
        </div>

        <button className="payButton" onClick={handlePayment} disabled={paymentInitializing}>
          {paymentInitializing ? 'Preparing Payment...' : 'Proceed to Payment'}
        </button>

        <p className="note">
          Your booking will be confirmed after payment is verified and approved.
        </p>
      </div>
    </div>
  )
}

export default PaymentBridge
