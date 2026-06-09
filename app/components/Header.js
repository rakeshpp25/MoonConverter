'use client';

import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="header" style={{ position: 'relative' }}>
      <div className="container header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        
        {/* BRAND LOGO & HAMBURGER GROUP */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* HAMBURGER BUTTON */}
          <button 
            className="burger-btn mobile-show" 
            onClick={toggleMobileMenu}
            aria-label="Toggle Navigation Container" 
            aria-expanded={mobileMenuOpen}
            style={{ background: 'none', border: 'none', color: 'currentColor', cursor: 'pointer', padding: '0.5rem' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>

          {/* BRAND LOGO */}
          <a href="/" className="logo-link" aria-label="MoonConverter Home">
            <span>MoonConverter</span>
          </a>
        </div>
        
        {/* DESKTOP NAVIGATION MENU */}
        <nav className="nav-menu">
          <a href="/#popular-converters" className="nav-link mobile-hide">Image Converters</a>
          <a href="/#image-tools" className="nav-link mobile-hide">Tools</a>
          <a href="/about" className="nav-link mobile-hide">About</a>
          <a href="/feedback" className="nav-link nav-cta mobile-show-inline">Feedback</a>
        </nav>
      </div>

      {/* MOBILE DROPDOWN PANEL */}
      {mobileMenuOpen && (
        <div className="mobile-dropdown" style={{ display: 'block', position: 'absolute', top: '100%', left: 0, width: '100%', background: '#ffffff', boxShadow: '0 10px 15px rgba(0,0,0,0.05)', borderTop: '1px solid #e2e8f0', padding: '1rem 0', zIndex: 1000 }}>
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0 1.5rem', textAlign: 'left' }}>
            <a href="/#popular-converters" style={{ color: '#334155', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }} onClick={toggleMobileMenu}>Image Converters</a>
            <a href="/#image-tools" style={{ color: '#334155', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }} onClick={toggleMobileMenu}>Tools</a>
            <a href="/about" style={{ color: '#334155', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }} onClick={toggleMobileMenu}>About</a>
          </div>
        </div>
      )}
    </header>
  );
}