import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './App.css'

function App() {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadBooking() {
      const params = new URLSearchParams(window.location.search)

      const name = params.get('name')
      const email = params.get('email')
      const phone = params.get('phone')
      const bookingId = params.get('booking_id')
      const startAt = params.get('start_at')
      const endAt = params.get('end_at')

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
          duration_minutes: durationMinutes,
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
        durationMinutes
      })

      setLoading(false)
    }

    loadBooking()
  }, [])

  function handlePayment() {
    window.location.href = 'https://paystack.shop/pay/p9ijb0e40n'
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
            <p>Booking & Payment</p>
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
            <span>Booking ID</span>
            <strong>{booking.bookingId}</strong>
          </div>
        </div>

        <button className="payButton" onClick={handlePayment}>
          Proceed to Payment
        </button>

        <p className="note">
          Your booking will be confirmed after payment is verified and approved.
        </p>
      </div>
    </div>
  )
}

export default App