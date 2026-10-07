import React from 'react';
import '../landing.css';

// Configurable Koalendar URLs
export const KOALENDAR_URLS = {
  conference_hall: 'https://koalendar.com/e/conference-hall',
  swimming_pool: 'https://koalendar.com/e/swimming-pool-9',
  tennis_court: 'https://koalendar.com/e/tennis-booking-9',
}

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-brand">
          <h1 className="landing-brand-title">REGIMANUEL GRAY</h1>
          <p className="landing-brand-subtitle">Estate Facilities</p>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <span className="hero-eyebrow">ESTATE FACILITY RESERVATIONS</span>
          <h2>Your Estate. Your Amenities.</h2>
          <p>Reserve access to selected estate facilities quickly and conveniently.</p>
        </section>

        <section className="section-header">
          <h3>Available Facilities</h3>
          <p>Choose a facility below to view available times and make a reservation.</p>
        </section>

        <section className="facility-cards">
          <div className="facility-card">
            <div className="facility-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h4>Conference Hall</h4>
            <p>A refined venue for meetings, private functions and community gatherings.</p>
            <a href={KOALENDAR_URLS.conference_hall} className="book-now-btn" target="_blank" rel="noopener noreferrer">Book Facility</a>
          </div>

          <div className="facility-card">
            <div className="facility-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4>Swimming Pool</h4>
            <p>A refreshing recreational space for residents and approved guests.</p>
            <a href={KOALENDAR_URLS.swimming_pool} className="book-now-btn" target="_blank" rel="noopener noreferrer">Book Facility</a>
          </div>

          <div className="facility-card">
            <div className="facility-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4>Tennis Court</h4>
            <p>A professionally maintained court for recreational and scheduled play.</p>
            <a href={KOALENDAR_URLS.tennis_court} className="book-now-btn" target="_blank" rel="noopener noreferrer">Book Facility</a>
          </div>
        </section>

        <section className="trust-strip">
          <div className="trust-item">
            <div className="trust-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="trust-content">
              <h5>Simple Reservations</h5>
              <p>Book amenities in seconds.</p>
            </div>
          </div>
          
          <div className="trust-item">
            <div className="trust-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="trust-content">
              <h5>Secure Payments</h5>
              <p>Safe and transparent transactions.</p>
            </div>
          </div>
          
          <div className="trust-item">
            <div className="trust-icon">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="trust-content">
              <h5>Managed Facilities</h5>
              <p>Professionally maintained spaces.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <h6>Regimanuel Gray Estate Facilities</h6>
        <p>Facility reservations and estate amenity management.</p>
        <p className="footer-copy">&copy; {new Date().getFullYear()} Regimanuel Gray. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
