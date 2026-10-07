import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import '../staff-schedule.css'

/* ── Facility config ────────────────────────────────── */

const FACILITY_CONFIG = {
  tennis: {
    slug: 'tennis_court',
    label: 'Tennis Court',
    title: 'Tennis Court Schedule'
  },
  pool: {
    slug: 'swimming_pool',
    label: 'Swimming Pool',
    title: 'Swimming Pool Schedule'
  },
  conference: {
    slug: 'conference_hall',
    label: 'Conference Hall',
    title: 'Conference Hall Schedule'
  }
}

/* ── Helpers ────────────────────────────────────────── */

function fmtTime(t) {
  if (!t) return '—'
  return t.slice(0, 5)
}

function fmtDateDisplay(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

function shiftDate(iso, days) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function durationLabel(minutes) {
  if (!minutes) return null
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/* ── StaffSchedule ──────────────────────────────────── */

function StaffSchedule() {
  const { facilityKey } = useParams()
  const config = FACILITY_CONFIG[facilityKey]

  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState(todayISO())

  const today = todayISO()
  const isToday = selectedDate === today

  // Redirect unknown routes gracefully
  if (!config) {
    return (
      <div className="sched-page">
        <main className="sched-main">
          <div className="sched-error">
            <p>Unknown schedule page. Valid paths: /schedule/tennis, /schedule/pool, /schedule/conference</p>
          </div>
        </main>
      </div>
    )
  }

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true)
      setError('')

      // READ-ONLY: only SELECT, never update/insert/delete
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('id, customer_name, start_time, end_time, duration_minutes, booking_date, facility')
        .eq('facility', config.slug)
        .eq('payment_status', 'paid')
        .eq('booking_status', 'approved')
        .order('start_time', { ascending: true })

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setBookings(data || [])
      }
      setLoading(false)
    }

    fetchBookings()
  }, [config.slug])

  // Filter to selected date client-side (data is already facility/status-filtered)
  const dayBookings = bookings.filter(b => b.booking_date === selectedDate)

  /* ── Render ── */

  return (
    <div className="sched-page">

      {/* ── Header ── */}
      <header className="sched-header">
        <div className="sched-header-inner">
          <div>
            <h1 className="sched-brand-title">REGIMANUEL GRAY</h1>
            <p className="sched-brand-subtitle">Estate Facilities</p>
          </div>
          <span className="sched-role-tag">Staff Schedule</span>
        </div>
      </header>

      <main className="sched-main">

        {/* ── Page intro ── */}
        <div className="sched-intro">
          <h1>{config.title}</h1>
          <p>View confirmed facility reservations and today's activity schedule.</p>
        </div>

        {/* ── Date navigation ── */}
        <div className="sched-date-nav">
          <button
            className="sched-date-btn"
            onClick={() => setSelectedDate(d => shiftDate(d, -1))}
          >
            ← Previous Day
          </button>

          <button
            className={`sched-date-btn${isToday ? ' sched-date-btn--today' : ''}`}
            onClick={() => setSelectedDate(today)}
          >
            Today
          </button>

          <button
            className="sched-date-btn"
            onClick={() => setSelectedDate(d => shiftDate(d, 1))}
          >
            Next Day →
          </button>

          <input
            type="date"
            className="sched-date-input"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            aria-label="Select date"
          />
        </div>

        {/* ── Day heading ── */}
        <div className="sched-day-heading">
          <span className="sched-day-label">{fmtDateDisplay(selectedDate)}</span>
          {!loading && !error && (
            <span className="sched-day-count">
              {dayBookings.length} booking{dayBookings.length !== 1 ? 's' : ''}
            </span>
          )}
          {isToday && <span className="sched-today-pill">Today</span>}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="sched-loading">
            <div className="sched-spinner" />
            <p>Loading schedule…</p>
          </div>
        ) : error ? (
          <div className="sched-error">
            <p>Failed to load schedule: {error}</p>
          </div>
        ) : dayBookings.length === 0 ? (
          <div className="sched-empty">
            <div className="sched-empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <h3>No confirmed bookings for this date.</h3>
            <p>Only approved and paid reservations are shown.</p>
          </div>
        ) : (
          <div className="sched-list">
            {dayBookings.map(b => (
              <div key={b.id} className="sched-card">

                {/* Time column */}
                <div className="sched-card-time">
                  <div className="sched-time-start">{fmtTime(b.start_time)}</div>
                  {b.end_time && (
                    <>
                      <div className="sched-time-sep">to</div>
                      <div className="sched-time-end">{fmtTime(b.end_time)}</div>
                    </>
                  )}
                </div>

                {/* Customer / facility info */}
                <div className="sched-card-body">
                  <p className="sched-customer-name">{b.customer_name || 'Guest'}</p>
                  <p className="sched-facility-label">{config.label}</p>
                </div>

                {/* Duration */}
                <div className="sched-card-meta">
                  {durationLabel(b.duration_minutes) && (
                    <>
                      <div className="sched-duration">{durationLabel(b.duration_minutes)}</div>
                      <div className="sched-duration-label">Duration</div>
                    </>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  )
}

export default StaffSchedule
