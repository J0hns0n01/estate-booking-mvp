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
          <div className="landing-logo">E</div>
          <h1>Estate Facilities</h1>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <h2>Welcome to Estate Facilities</h2>
          <p>Book our premium amenities for your events, fitness, and recreation.</p>
        </section>

        <section className="facility-cards">
          <div className="facility-card">
            <div className="facility-card-icon">🏛</div>
            <h3>Conference Hall</h3>
            <p>A spacious and well-equipped hall suitable for meetings, events, and gatherings.</p>
            <a href={KOALENDAR_URLS.conference_hall} className="book-now-btn" target="_blank" rel="noopener noreferrer">Book Now</a>
          </div>

          <div className="facility-card">
            <div className="facility-card-icon">🏊</div>
            <h3>Swimming Pool</h3>
            <p>A clean and relaxing pool area perfect for recreation and fitness swimming.</p>
            <a href={KOALENDAR_URLS.swimming_pool} className="book-now-btn" target="_blank" rel="noopener noreferrer">Book Now</a>
          </div>

          <div className="facility-card">
            <div className="facility-card-icon">🎾</div>
            <h3>Tennis Court</h3>
            <p>A well-maintained outdoor court for tennis enthusiasts of all skill levels.</p>
            <a href={KOALENDAR_URLS.tennis_court} className="book-now-btn" target="_blank" rel="noopener noreferrer">Book Now</a>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} Estate Facilities. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
