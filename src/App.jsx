import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function App() {
  const [message, setMessage] = useState('Preparing your payment...')

  useEffect(() => {
    async function saveBooking() {
      const params = new URLSearchParams(window.location.search)

      const name = params.get('name')
      const email = params.get('email')
      const phone = params.get('phone')
      const bookingId = params.get('booking_id')
      const startAt = params.get('start_at')
      const endAt = params.get('end_at')

      if (!bookingId) {
        setMessage('Booking information is missing.')
        return
      }

      let bookingDate = null
      let startTime = null
      let durationMinutes = null

      if (startAt) {
        const start = new Date(startAt)

        bookingDate = start.toISOString().split('T')[0]
        startTime = start.toTimeString().slice(0, 8)

        if (endAt) {
          const end = new Date(endAt)

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
          booking_date: bookingDate,
          start_time: startTime,
          duration_minutes: durationMinutes,
          payment_status: 'pending',
          booking_status: 'pending_approval'
        })

      if (error) {
        console.error('SUPABASE ERROR:', error)
        setMessage(`Could not save booking: ${error.message}`)
        return
      }

      window.location.href =
        'https://paystack.shop/pay/yyou1kcot9'
    }

    saveBooking()
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2>{message}</h2>
        <p>Please do not close this page.</p>
      </div>
    </div>
  )
}

export default App