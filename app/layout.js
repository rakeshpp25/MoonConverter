// app/layout.js
// 🟢 FIXED: REMOVED 'use client' FROM THE ROOT TO PROTECT SEO METADATA

import './globals.css';
import Header from './components/Header'; // We will import the interactive bits here cleanly!

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

export const viewport = {
  themeColor: '#0f172a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* --- RENDER MODULAR CLIENT HEADER CONTAINER NATIVELY --- */}
        <Header />

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