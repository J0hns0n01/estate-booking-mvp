import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import '../admin.css'   // shared: badges, table, spinner, header, filter-bar
import '../manager.css' // manager-specific layout

/* ── Constants ────────────────────────────────────────── */

const FACILITY_LIST = [
  { key: 'conference_hall', label: 'Conference Hall', icon: '🏛' },
  { key: 'swimming_pool',   label: 'Swimming Pool',   icon: '🏊' },
  { key: 'tennis_court',    label: 'Tennis Court',    icon: '🎾' }
]

// Configurable per-booking rates (NGN). Update to match actual pricing.
const FACILITY_RATES = {
  conference_hall: 50000,
  swimming_pool:   20000,
  tennis_court:    15000
}

const FACILITY_LABELS = {
  conference_hall: 'Conference Hall',
  swimming_pool:   'Swimming Pool',
  tennis_court:    'Tennis Court'
}

/* ── Helpers ──────────────────────────────────────────── */

function fmt(val, fallback = '—')  { return val || fallback }
function fmtTime(t)                { return t ? t.slice(0, 5) : '—' }
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}
function fmtCurrency(n) {
  return '₦' + Number(n).toLocaleString('en-NG')
}

/* ── Shared sub-components ────────────────────────────── */

function StatusBadge({ value, type }) {
  const paymentMap = { pending: 'badge-warning', paid: 'badge-success', failed: 'badge-error', refunded: 'badge-neutral' }
  const bookingMap = { pending_approval: 'badge-warning', approved: 'badge-success', cancelled: 'badge-error', completed: 'badge-info' }
  const map  = type === 'payment' ? paymentMap : bookingMap
  const cls  = map[value] || 'badge-neutral'
  const label = value ? value.replace(/_/g, ' ') : '—'
  return <span className={`badge ${cls}`}>{label}</span>
}

/* ── Manager-specific sub-components ─────────────────── */

function MetricCard({ label, value, accentClass, note }) {
  return (
    <div className={`mgr-metric-card ${accentClass}`}>
      <div className="mgr-metric-value">{value}</div>
      <div className="mgr-metric-label">{label}</div>
      {note && <div className="mgr-metric-note">{note}</div>}
    </div>
  )
}

function FacilityStat({ label, value }) {
  return (
    <div className="facility-stat-row">
      <span className="facility-stat-label">{label}</span>
      <span className="facility-stat-value">{value}</span>
    </div>
  )
}

function UtilBar({ pct }) {
  const display = Math.min(Math.round(pct), 100)
  const color = display >= 70 ? '#10b981' : display >= 40 ? '#f59e0b' : '#94a3b8'
  return (
    <div className="util-bar-wrap">
      <div className="util-bar-track">
        <div className="util-bar-fill" style={{ width: `${display}%`, background: color }} />
      </div>
      <span className="util-bar-label">{display}%</span>
    </div>
  )
}

function HorizBarChart({ items }) {
  const max = Math.max(...items.map(i => i.value), 1)
  return (
    <div className="horiz-bar-chart">
      {items.map(item => (
        <div key={item.label} className="horiz-bar-row">
          <span className="horiz-bar-label">{item.label}</span>
          <div className="horiz-bar-track">
            <div
              className="horiz-bar-fill"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <span className="horiz-bar-val">{item.displayVal ?? item.value}</span>
        </div>
      ))}
    </div>
  )
}

function StatusBreakdown({ items, total }) {
  const colorMap = {
    'status-bar-warning': '#f59e0b',
    'status-bar-success': '#10b981',
    'status-bar-error':   '#ef4444',
    'status-bar-info':    '#3b82f6'
  }
  return (
    <div className="status-breakdown">
      {items.map(item => (
        <div key={item.label} className="status-break-row">
          <div className="status-break-top">
            <span className="status-break-label">{item.label}</span>
            <span className="status-break-count">{item.value}</span>
          </div>
          <div className="status-break-track">
            <div
              className="status-break-fill"
              style={{
                width: total > 0 ? `${(item.value / total) * 100}%` : '0%',
                background: colorMap[item.colorCls] || '#94a3b8'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── ManagerDashboard ─────────────────────────────────── */

function ManagerDashboard() {
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    async function fetchBookings() {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: false })

      if (error) setError(error.message)
      else       setBookings(data || [])
      setLoading(false)
    }
    fetchBookings()
  }, [])

  const todayISO      = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  /* Top-level metrics */
  const total          = bookings.length
  const upcoming       = bookings.filter(b => b.booking_date >= todayISO && b.booking_status !== 'cancelled').length
  const confirmed      = bookings.filter(b => b.booking_status === 'approved' && b.payment_status === 'paid').length
  const cancelled      = bookings.filter(b => b.booking_status === 'cancelled').length
  const paid           = bookings.filter(b => b.payment_status === 'paid').length
  const pendingPayment = bookings.filter(b => b.payment_status === 'pending').length
  const totalRevenue   = bookings
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + (FACILITY_RATES[b.facility] || 0), 0)

  /* Per-facility metrics */
  function facilityMetrics(key) {
    const fb = bookings.filter(b => b.facility === key)
    const paidCount = fb.filter(b => b.payment_status === 'paid').length
    // Utilisation: unique dates booked (non-cancelled) in last 30 days / 30
    const recentDates = new Set(
      fb
        .filter(b => b.booking_date >= thirtyDaysAgo && b.booking_status !== 'cancelled')
        .map(b => b.booking_date)
    )
    return {
      total:     fb.length,
      upcoming:  fb.filter(b => b.booking_date >= todayISO && b.booking_status !== 'cancelled').length,
      confirmed: fb.filter(b => b.booking_status === 'approved' && b.payment_status === 'paid').length,
      cancelled: fb.filter(b => b.booking_status === 'cancelled').length,
      revenue:   paidCount * (FACILITY_RATES[key] || 0),
      utilPct:   (recentDates.size / 30) * 100
    }
  }

  /* Recent / upcoming table — upcoming first (asc), then past (already desc from query) */
  const tableBookings = [
    ...bookings
      .filter(b => b.booking_date >= todayISO && b.booking_status !== 'cancelled')
      .slice()
      .sort((a, b) => a.booking_date.localeCompare(b.booking_date))
      .slice(0, 10),
    ...bookings
      .filter(b => b.booking_date < todayISO)
      .slice(0, 5)
  ].slice(0, 15)

  /* Chart data */
  const bookingsByFacility = FACILITY_LIST.map(f => ({
    label: f.label,
    value: bookings.filter(b => b.facility === f.key).length
  }))

  const revenueByFacility = FACILITY_LIST.map(f => {
    const count = bookings.filter(b => b.facility === f.key && b.payment_status === 'paid').length
    const rev   = count * (FACILITY_RATES[f.key] || 0)
    return { label: f.label, value: rev, displayVal: fmtCurrency(rev) }
  })

  const statusItems = [
    { label: 'Pending Approval', value: bookings.filter(b => b.booking_status === 'pending_approval').length, colorCls: 'status-bar-warning' },
    { label: 'Approved',         value: bookings.filter(b => b.booking_status === 'approved').length,         colorCls: 'status-bar-success' },
    { label: 'Cancelled',        value: bookings.filter(b => b.booking_status === 'cancelled').length,        colorCls: 'status-bar-error'   },
    { label: 'Completed',        value: bookings.filter(b => b.booking_status === 'completed').length,        colorCls: 'status-bar-info'    }
  ]

  /* ── Render ── */

  if (loading) return (
    <div className="mgr-page">
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Loading dashboard…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="mgr-page">
      <div className="admin-error"><p>⚠ {error}</p></div>
    </div>
  )

  return (
    <div className="mgr-page">

      {/* Header — reuses admin-header classes, tinted purple */}
      <header className="admin-header mgr-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <div className="admin-logo mgr-logo">M</div>
            <div>
              <h1>Estate Facilities</h1>
              <p>Manager Dashboard</p>
            </div>
          </div>
          <span className="admin-tag mgr-tag">Manager View</span>
        </div>
      </header>

      <main className="admin-main">

        {/* ── Top metrics ── */}
        <section className="mgr-metrics-grid">
          <MetricCard label="Total Bookings"   value={total}                   accentClass="mgr-accent-blue"    />
          <MetricCard label="Upcoming"          value={upcoming}                accentClass="mgr-accent-indigo"  />
          <MetricCard label="Confirmed"         value={confirmed}               accentClass="mgr-accent-green"   />
          <MetricCard label="Cancelled"         value={cancelled}               accentClass="mgr-accent-red"     />
          <MetricCard label="Paid Bookings"     value={paid}                    accentClass="mgr-accent-teal"    />
          <MetricCard label="Pending Payment"   value={pendingPayment}          accentClass="mgr-accent-amber"   />
          <MetricCard
            label="Total Revenue"
            value={fmtCurrency(totalRevenue)}
            accentClass="mgr-accent-emerald mgr-metric-wide"
            note="paid bookings · estimated rates"
          />
        </section>

        {/* ── Facility summaries ── */}
        <h2 className="mgr-section-title">Facility Summaries</h2>
        <section className="mgr-facility-grid">
          {FACILITY_LIST.map(f => {
            const m = facilityMetrics(f.key)
            return (
              <div key={f.key} className="facility-card">
                <div className="facility-card-header">
                  <span className="facility-icon">{f.icon}</span>
                  <h3>{f.label}</h3>
                </div>
                <div className="facility-stats">
                  <FacilityStat label="Total bookings" value={m.total}                />
                  <FacilityStat label="Upcoming"        value={m.upcoming}             />
                  <FacilityStat label="Confirmed"       value={m.confirmed}            />
                  <FacilityStat label="Cancelled"       value={m.cancelled}            />
                  <FacilityStat label="Revenue"         value={fmtCurrency(m.revenue)} />
                </div>
                <div className="facility-util">
                  <span className="facility-util-label">30-day utilisation</span>
                  <UtilBar pct={m.utilPct} />
                </div>
              </div>
            )
          })}
        </section>

        {/* ── Visual summaries ── */}
        <h2 className="mgr-section-title">Summaries</h2>
        <section className="mgr-charts-grid">
          <div className="chart-card">
            <h3>Bookings by Facility</h3>
            <HorizBarChart items={bookingsByFacility} />
          </div>
          <div className="chart-card">
            <h3>Revenue by Facility</h3>
            <HorizBarChart items={revenueByFacility} />
          </div>
          <div className="chart-card">
            <h3>Booking Status Breakdown</h3>
            <StatusBreakdown items={statusItems} total={total} />
          </div>
        </section>

        {/* ── Recent / upcoming bookings ── */}
        <h2 className="mgr-section-title">Recent &amp; Upcoming Bookings</h2>
        <section className="table-section">
          {tableBookings.length === 0 ? (
            <div className="admin-empty"><p>No bookings to display.</p></div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Facility</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Payment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tableBookings.map(b => (
                    <tr key={b.id}>
                      <td data-label="Customer">{fmt(b.customer_name)}</td>
                      <td data-label="Facility">{FACILITY_LABELS[b.facility] || fmt(b.facility)}</td>
                      <td data-label="Date">{fmtDate(b.booking_date)}</td>
                      <td data-label="Time">
                        {fmtTime(b.start_time)}
                        {b.end_time ? ` – ${fmtTime(b.end_time)}` : ''}
                      </td>
                      <td data-label="Payment"><StatusBadge value={b.payment_status} type="payment" /></td>
                      <td data-label="Status"><StatusBadge value={b.booking_status}  type="booking" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>
    </div>
  )
}

export default ManagerDashboard
