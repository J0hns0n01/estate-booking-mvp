import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import '../admin.css'

/* ── Constants ─────────────────────────────────────── */

const FACILITY_LABELS = {
  conference_hall: 'Conference Hall',
  swimming_pool: 'Swimming Pool',
  tennis_court: 'Tennis Court'
}

const FACILITY_OPTIONS = [
  { value: '', label: 'All Facilities' },
  { value: 'conference_hall', label: 'Conference Hall' },
  { value: 'swimming_pool', label: 'Swimming Pool' },
  { value: 'tennis_court', label: 'Tennis Court' }
]

const PAYMENT_OPTIONS = [
  { value: '', label: 'All Payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' }
]

const BOOKING_STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' }
]

// Values allowed inside the edit modal
const MODAL_PAYMENT_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' }
]

const MODAL_STATUS_OPTIONS = [
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' }
]

/* ── Helpers ────────────────────────────────────────── */

function fmt(val, fallback = '—') {
  return val || fallback
}

function fmtTime(t) {
  if (!t) return '—'
  return t.slice(0, 5)
}

function fmtDate(d) {
  if (!d) return '—'
  const date = new Date(d + 'T00:00:00')
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

/* ── StatusBadge ────────────────────────────────────── */

function StatusBadge({ value, type }) {
  const paymentMap = {
    pending: 'badge-warning',
    paid: 'badge-success',
    failed: 'badge-error',
    refunded: 'badge-neutral'
  }
  const bookingMap = {
    pending_approval: 'badge-warning',
    approved: 'badge-success',
    cancelled: 'badge-error',
    completed: 'badge-info'
  }
  const map = type === 'payment' ? paymentMap : bookingMap
  const cls = map[value] || 'badge-neutral'
  const label = value ? value.replace(/_/g, ' ') : '—'
  return <span className={`badge ${cls}`}>{label}</span>
}

/* ── BookingModal ───────────────────────────────────── */

function BookingModal({ booking, onClose, onSaved }) {
  const [paymentStatus, setPaymentStatus] = useState(booking.payment_status || 'pending')
  const [bookingStatus, setBookingStatus] = useState(booking.booking_status || 'pending_approval')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  const dirty =
    paymentStatus !== booking.payment_status ||
    bookingStatus !== booking.booking_status

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    setSaved(false)

    const { error } = await supabase
      .from('bookings')
      .update({ payment_status: paymentStatus, booking_status: bookingStatus })
      .eq('id', booking.id)

    if (error) {
      setSaveError(error.message)
    } else {
      setSaved(true)
      onSaved({ ...booking, payment_status: paymentStatus, booking_status: bookingStatus })
    }
    setSaving(false)
  }

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleBackdrop}>
      <div className="modal-card" role="dialog" aria-modal="true">

        {/* Modal header */}
        <div className="modal-header">
          <h2>Booking Details</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Detail rows */}
        <div className="modal-body">
          <div className="modal-section">
            <h3>Customer</h3>
            <div className="detail-grid">
              <DetailRow label="Name"       value={fmt(booking.customer_name)} />
              <DetailRow label="Phone"      value={fmt(booking.phone)} />
              <DetailRow label="Email"      value={fmt(booking.email)} mono />
            </div>
          </div>

          <div className="modal-section">
            <h3>Booking</h3>
            <div className="detail-grid">
              <DetailRow label="Facility"   value={FACILITY_LABELS[booking.facility] || fmt(booking.facility)} />
              <DetailRow label="Date"       value={fmtDate(booking.booking_date)} />
              <DetailRow label="Start time" value={fmtTime(booking.start_time)} />
              <DetailRow label="End time"   value={fmtTime(booking.end_time)} />
              <DetailRow label="Duration"   value={booking.duration_minutes ? `${booking.duration_minutes} min` : '—'} />
              <DetailRow label="Koalendar ID" value={fmt(booking.koalendar_booking_id)} mono />
            </div>
          </div>

          {/* Status editors */}
          <div className="modal-section">
            <h3>Update Status</h3>
            <div className="status-editors">
              <div className="status-editor-group">
                <label htmlFor="modal-payment">Payment status</label>
                <select
                  id="modal-payment"
                  value={paymentStatus}
                  onChange={e => { setPaymentStatus(e.target.value); setSaved(false) }}
                >
                  {MODAL_PAYMENT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="status-editor-group">
                <label htmlFor="modal-booking-status">Booking status</label>
                <select
                  id="modal-booking-status"
                  value={bookingStatus}
                  onChange={e => { setBookingStatus(e.target.value); setSaved(false) }}
                >
                  {MODAL_STATUS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {saveError && <p className="modal-save-error">⚠ {saveError}</p>}
            {saved && !dirty && <p className="modal-save-ok">✓ Saved successfully</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="modal-btn-secondary" onClick={onClose}>Close</button>
          <button
            className="modal-btn-primary"
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

      </div>
    </div>
  )
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className={`detail-value${mono ? ' mono' : ''}`}>{value}</span>
    </div>
  )
}

/* ── FacilityPricingRow ─────────────────────────────── */

function FacilityPricingRow({ facility }) {
  const [rate, setRate] = useState(facility.rate_per_30_minutes)
  const [minDuration, setMinDuration] = useState(facility.minimum_duration_minutes)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  const isDirty = rate !== facility.rate_per_30_minutes || minDuration !== facility.minimum_duration_minutes

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    setSaved(false)
    const { error } = await supabase
      .from('facilities')
      .update({ rate_per_30_minutes: rate, minimum_duration_minutes: minDuration })
      .eq('slug', facility.slug)

    if (error) {
      setSaveError(error.message)
    } else {
      setSaved(true)
      facility.rate_per_30_minutes = rate
      facility.minimum_duration_minutes = minDuration
    }
    setSaving(false)
  }

  return (
    <div className="fp-row">
      <div className="fp-name">{facility.name}</div>
      <div className="fp-input-group">
        <label>Rate / 30m (GH₵)</label>
        <input type="number" value={rate} onChange={e => { setRate(Number(e.target.value)); setSaved(false) }} />
      </div>
      <div className="fp-input-group">
        <label>Min Duration (min)</label>
        <input type="number" value={minDuration} onChange={e => { setMinDuration(Number(e.target.value)); setSaved(false) }} />
      </div>
      <div className="fp-actions">
        <button className="fp-btn-save" onClick={handleSave} disabled={saving || !isDirty}>
          {saving ? 'Saving...' : 'Save'}
        </button>
        {saved && !isDirty && <span className="fp-success">✓ Saved</span>}
        {saveError && <span className="fp-error">⚠ {saveError}</span>}
      </div>
    </div>
  )
}

/* ── AdminDashboard ─────────────────────────────────── */

function AdminDashboard() {
  const [bookings, setBookings] = useState([])
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filterFacility, setFilterFacility] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const [selectedBooking, setSelectedBooking] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const { data: bData, error: bError } = await supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: false })

      const { data: fData, error: fError } = await supabase
        .from('facilities')
        .select('*')
        .order('name', { ascending: true })

      if (bError) {
        setError(bError.message)
      } else {
        setBookings(bData || [])
      }

      if (fError && !bError) {
        setError(fError.message)
      } else if (fData) {
        setFacilities(fData)
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  // Called by modal after a successful save — updates local state
  function handleSaved(updated) {
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b))
    setSelectedBooking(updated)
  }

  const todayISO = new Date().toISOString().split('T')[0]

  const todayCount      = bookings.filter(b => b.booking_date === todayISO).length
  const pendingPayments = bookings.filter(b => b.payment_status === 'pending').length
  const pendingApprovals = bookings.filter(b => b.booking_status === 'pending_approval').length
  const confirmed       = bookings.filter(
    b => b.payment_status === 'paid' && b.booking_status === 'approved'
  ).length

  const anyFilter = filterFacility || filterPayment || filterStatus || filterDate

  const filtered = bookings.filter(b => {
    if (filterFacility && b.facility !== filterFacility) return false
    if (filterPayment  && b.payment_status !== filterPayment) return false
    if (filterStatus   && b.booking_status !== filterStatus) return false
    if (filterDate     && b.booking_date !== filterDate) return false
    return true
  })

  function clearFilters() {
    setFilterFacility('')
    setFilterPayment('')
    setFilterStatus('')
    setFilterDate('')
  }

  return (
    <div className="admin-page">

      {/* ── Header ── */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <div className="admin-logo">E</div>
            <div>
              <h1>Estate Facilities</h1>
              <p>Employee Dashboard</p>
            </div>
          </div>
          <span className="admin-tag">Staff View</span>
        </div>
      </header>

      <main className="admin-main">

        {/* ── Stat cards ── */}
        <section className="stat-grid">
          <div className="stat-card">
            <div className="stat-value">{todayCount}</div>
            <div className="stat-label">Today's Bookings</div>
          </div>
          <div className="stat-card stat-card--warning">
            <div className="stat-value">{pendingPayments}</div>
            <div className="stat-label">Pending Payments</div>
          </div>
          <div className="stat-card stat-card--orange">
            <div className="stat-value">{pendingApprovals}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
          <div className="stat-card stat-card--success">
            <div className="stat-value">{confirmed}</div>
            <div className="stat-label">Confirmed</div>
          </div>
        </section>

        {/* ── Facility Pricing ── */}
        <section className="admin-section">
          <h2>Facility Pricing</h2>
          {loading ? (
            <p>Loading facilities...</p>
          ) : facilities.length === 0 ? (
            <p className="admin-empty">No facilities configured.</p>
          ) : (
            <div className="fp-container">
              {facilities.map(f => (
                <FacilityPricingRow key={f.slug} facility={f} />
              ))}
            </div>
          )}
        </section>

        {/* ── Filters ── */}
        <section className="filter-bar">
          <div className="filter-group">
            <label htmlFor="filter-facility">Facility</label>
            <select
              id="filter-facility"
              value={filterFacility}
              onChange={e => setFilterFacility(e.target.value)}
            >
              {FACILITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-payment">Payment</label>
            <select
              id="filter-payment"
              value={filterPayment}
              onChange={e => setFilterPayment(e.target.value)}
            >
              {PAYMENT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-status">Booking Status</label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              {BOOKING_STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="filter-date">Date</label>
            <input
              id="filter-date"
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="date-input"
            />
          </div>

          {anyFilter && (
            <button className="clear-btn" onClick={clearFilters}>
              Clear filters
            </button>
          )}

          <span className="results-count">
            {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
          </span>
        </section>

        {/* ── Table ── */}
        <section className="table-section">
          {loading ? (
            <div className="admin-loading">
              <div className="admin-spinner"></div>
              <p>Loading bookings…</p>
            </div>
          ) : error ? (
            <div className="admin-error">
              <p>⚠ Failed to load bookings: {error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="admin-empty">
              <p>No bookings match the current filters.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Facility</th>
                    <th>Date</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Duration</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id} className="table-row-clickable" onClick={() => setSelectedBooking(b)}>
                      <td data-label="Name">{fmt(b.customer_name)}</td>
                      <td data-label="Phone">{fmt(b.phone)}</td>
                      <td data-label="Email">
                        <span className="email-cell">{fmt(b.email)}</span>
                      </td>
                      <td data-label="Facility">
                        {FACILITY_LABELS[b.facility] || fmt(b.facility)}
                      </td>
                      <td data-label="Date">{fmtDate(b.booking_date)}</td>
                      <td data-label="Start">{fmtTime(b.start_time)}</td>
                      <td data-label="End">{fmtTime(b.end_time)}</td>
                      <td data-label="Duration">
                        {b.duration_minutes ? `${b.duration_minutes} min` : '—'}
                      </td>
                      <td data-label="Payment">
                        <StatusBadge value={b.payment_status} type="payment" />
                      </td>
                      <td data-label="Status">
                        <StatusBadge value={b.booking_status} type="booking" />
                      </td>
                      <td data-label="">
                        <button
                          className="view-btn"
                          onClick={e => { e.stopPropagation(); setSelectedBooking(b) }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>

      {/* ── Booking detail modal ── */}
      {selectedBooking && (
        <BookingModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onSaved={handleSaved}
        />
      )}

    </div>
  )
}

export default AdminDashboard
