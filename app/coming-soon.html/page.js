'use client';
import Link from 'next/link';

export default function ComingSoon() {
  return (
    <div style={{ 
      minHeight: '85vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '2rem',
      background: 'radial-gradient(circle at top, #f8fafc 0%, #ffffff 100%)' 
    }}>
      <div style={{ 
        maxWidth: '520px', 
        width: '100%',
        textAlign: 'center', 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '24px', 
        padding: '3.5rem 2rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.02), 0 10px 10px -5px rgba(0, 0, 0, 0.01)'
      }}>
        
        {/* Animated Feature Icon Badge */}
        <div style={{ 
          width: '72px', 
          height: '72px', 
          background: '#EEF2FF', 
          borderRadius: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 1.75rem auto' 
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
        </div>

        {/* Main Typography */}
        <h1 style={{ color: '#0f172a', fontSize: '2rem', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
          Crafting Something Powerful
        </h1>
        
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
          We are currently fine-tuning our advanced image processing pipeline to run <span style={{ color: '#16a34a', fontWeight: '600' }}>100% offline</span> inside your browser. No server uploads, zero quality loss, and complete privacy.
        </p>

        {/* Live Status Tracker Micro-Card */}
        <div style={{ 
          background: '#f8fafc', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px', 
          padding: '0.85rem 1rem', 
          fontSize: '0.9rem', 
          color: '#475569',
          fontWeight: '500',
          marginBottom: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          ⚡ Status: Coding local pixel manipulation matrices...
        </div>

        {/* Return Button */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Link href="/" style={{ 
            background: '#4f46e5', 
            color: '#ffffff', 
            padding: '0.85rem 1.5rem', 
            borderRadius: '12px', 
            fontWeight: '600', 
            textDecoration: 'none',
            fontSize: '0.95rem',
            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
            transition: 'transform 0.1s ease'
          }}>
            Back to Converter Homepage
          </Link>
        </div>

      </div>
    </div>
  );
}