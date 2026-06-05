'use client';

import { useState } from 'react';
import './globals.css';

// --- ADVANCED MASTERCLASS NEXT.JS SEO ENGINE MATRIX ---
export const metadata = {
  metadataBase: new URL('https://moonconverter.com'),

  title: {
    default: 'MoonConverter - Free Offline Image & PDF Converter',
    template: '%s | MoonConverter',
  },

  description:
    'Convert JPG, PNG, WebP, SVG, AVIF, HEIC, GIF, BMP, ICO, TIFF and PDF files instantly in your browser. No uploads, no file size limits, works offline, secure and free.',

  keywords: [
    'MoonConverter',
    'image converter',
    'pdf converter',
    'offline converter',
    'offline image converter',
    'offline pdf converter',
    'jpg to png',
    'png to jpg',
    'webp to png',
    'png to webp',
    'svg converter',
    'heic converter',
    'avif converter',
    'gif converter',
    'bmp converter',
    'tiff converter',
    'ico converter',
    'pdf to png',
    'pdf to jpg',
    'pdf to image',
    'image to pdf',
    'convert images online',
    'browser based converter',
    'client side converter',
    'free file converter',
    'secure image converter',
    'no upload converter',
    'local file conversion',
    'works offline',
    'privacy focused converter',
    'unlimited image conversion',
    'batch image converter',
    'fast image converter',
  ],

  authors: [
    {
      name: 'MoonConverter',
    },
  ],

  creator: 'MoonConverter',
  publisher: 'MoonConverter',

  category: 'Technology',

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: 'https://moonconverter.com',
  },

  openGraph: {
    title: 'MoonConverter - Free Offline Image & PDF Converter',
    description:
      'Convert JPG, PNG, WebP, SVG, HEIC, AVIF and PDF files securely in your browser. No uploads, no tracking, works offline.',
    url: 'https://moonconverter.com',
    siteName: 'MoonConverter',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MoonConverter',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'MoonConverter - Free Offline Image & PDF Converter',
    description:
      'Convert images and PDFs instantly without uploading files. Works offline and protects your privacy.',
    images: ['/og-image.png'],
  },

  applicationName: 'MoonConverter',

  other: {
    'apple-mobile-web-app-title': 'MoonConverter',
    'mobile-web-app-capable': 'yes',
  },
};

// Separate viewport declaration configuration to prevent Next.js deprecation log warnings
export const viewport = {
  themeColor: '#0f172a',
};

export default function RootLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <html lang="en">
      <body>
        {/* --- GLOBAL WEBSITE HEADER --- */}
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
                <a href="/about" style={{ color: '#334155', textDecoration: 'none', fontWeight: 600, fontSize: '1rem' }} onClick={toggleMenu}>About</a>
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
                <li><a href="/about" className="footer-link" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>About</a></li>
                <li><a href="/feedback" className="footer-link" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>Feedback</a></li>
                <li><a href="/privacy-policy" className="footer-link" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}>Privacy Policy</a></li>
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