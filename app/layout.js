'use client';

import { useState } from 'react';
import './globals.css';

export default function RootLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Convert Images Instantly Online Free | MoonConverter</title>
        <meta name="description" content="Premium mobile-first framework for instant image mutations. Online conversion logic across WebP, AVIF, PNG, JPG without remote data pipeline transfers." />
        <link rel="canonical" href="https://moonconverter.com/" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        
        {/* Open Graph Metadata */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Convert Images Instantly Online Free | MoonConverter" />
        <meta property="og:description" content="Premium mobile-first framework for instant image conversions across WebP, AVIF, PNG, JPG." />
        <meta property="og:url" content="https://moonconverter.com/" />
        <meta property="og:image" content="https://moonconverter.com/images/og-main.jpg" />
      </head>
      <body>
        {/* --- GLOBAL WEBSITE HEADER --- */}
       {/* --- GLOBAL WEBSITE HEADER --- */}
<header className="header" style={{ position: 'relative' }}>
  <div className="container header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
    
    {/* BRAND LOGO & HAMBURGER GROUP */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {/* HAMBURGER BUTTON (Controlled by responsive classes) */}
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
      <a href="/about.html" className="nav-link mobile-hide">About</a>
      <a href="/feedback.html" className="nav-link nav-cta mobile-show-inline">Feedback</a>
    </nav>
  </div>

  {/* MOBILE DROPDOWN PANEL */}
  {mobileMenuOpen && (
    <div className="mobile-dropdown" style={{ display: 'block', position: 'absolute', top: '100%', left: 0, width: '100%', background: '#ffffff', boxShadow: '0 10px 15px rgba(0,0,0,0.05)', borderTop: '1px solid #e2e8f0', padding: '1rem 0', zIndex: 1000 }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0 1.5rem', textAlign: 'left' }}>
        <a href="/#popular-converters" style={{ color: '#334155', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }} onClick={toggleMobileMenu}>Image Converters</a>
        <a href="/#image-tools" style={{ color: '#334155', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }} onClick={toggleMobileMenu}>Tools</a>
        <a href="/about.html" style={{ color: '#334155', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }} onClick={toggleMobileMenu}>About</a>
      </div>
    </div>
  )}
</header>

        {/* --- DYNAMIC TARGET COMPONENT SLOTS --- */}
        <main>
          {children}
        </main>

        {/* --- GLOBAL WEBSITE FOOTER --- */}
        <footer className="footer" style={{ background: '#0f172a', color: '#ffffff', padding: '3rem 1.5rem 2rem 1.5rem' }}>
          <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
            
            <div className="forced-mobile-row" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div className="logo-link footer-logo forced-left-box" style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
                <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.03em', textAlign: 'left' }}>MoonConverter</span>
              </div>
              
              <ul className="footer-nav forced-right-list" style={{ display: 'flex', flexDirection: 'row', gap: '1.5rem', padding: 0, margin: 0, listStyle: 'none' }}>
                <li><a href="/about.html" className="footer-link" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>About</a></li>
                <li><a href="/feedback.html" className="footer-link" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>Feedback</a></li>
                <li><a href="/privacy-policy.html" className="footer-link" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>Privacy Policy</a></li>
              </ul>
            </div>

            <hr style={{ border: 0, borderTop: '1px solid rgba(225,225,225,0.1)', margin: '2rem 0 1.5rem 0', width: '100%' }} />

            <div className="footer-bottom" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', textAlign: 'left', gap: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 500, width: '100%' }}>
              <p style={{ margin: 0, textAlign: 'left' }}>MoonConverter &copy; 2026. All rights reserved.</p>
              <p style={{ margin: 0, color: '#475569', fontSize: '0.8rem', textAlign: 'left' }}>Built with love ❤️</p>
            </div>

          </div>
        </footer>
      </body>
    </html>
  );
}