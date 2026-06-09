'use client';

export default function AboutPage() {
  return (
    <main style={{ padding: '5rem 0' }}>
      <section className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem', color: '#334155', lineHeight: '1.7' }}>
        
        <h1 style={{ color: '#0f172a', fontSize: '2.8rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem', textAlign: 'center' }}>
          Reimagining File Processing
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#64748b', textAlign: 'center', maxWidth: '600px', margin: '0 auto 3rem auto', fontWeight: 500 }}>
          A lightning-fast, serverless utility platform built to convert your media assets locally in milliseconds.
        </p>

        <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', marginBottom: '3rem' }} />

        <h2 style={{ color: '#0f172a', fontTheme: 'none', fontSize: '1.6rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem' }}>Who We Are</h2>
        <p>
          MoonConverter was founded to solve a simple yet frustrating web problem: online file conversion tools are usually slow, bloated with pop-up ads, or require you to upload your personal files to mysterious third-party servers.
        </p>
        <p>
          We wanted to build something cleaner. Our platform serves as a decentralized graphical processing runtime, giving creators, developers, and professionals an elite suite of optimization tools that require zero sign-ups, have zero limits, and cost absolutely nothing.
        </p>

        <h2 style={{ color: '#0f172a', fontSize: '1.6rem', fontWeight: 700, marginTop: '2.5rem', marginBottom: '0.75rem' }}>The Client-Side Difference</h2>
        <p>
          What makes MoonConverter unique is our underlying system mechanics. Traditional converters act as pipelines—taking your image or document, dragging it up to a remote server cloud, changing it there, and forcing you to download it back down. This risks your data privacy and eats up data bandwidth.
        </p>
        <p>
          <strong>MoonConverter never copies or uploads your files.</strong> By using modern browser scripting frameworks and local canvas contexts, your machine handles 100% of the mathematical rendering right on your screen. Your secure data sandbox stays completely isolated.
        </p>

        {/* Feature Highlights Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', margin: '3rem 0', paddingTop: '1rem' }}>
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '2rem' }} role="img" aria-label="Privacy Lock">🔒</span>
            <h3 style={{ color: '#0f172a', margin: '0.5rem 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 700 }}>Absolute Privacy</h3>
            <p style={{ fontSize: '0.9rem', margin: 0, color: '#64748b' }}>No server uploads means your data can never be breached or intercepted.</p>
          </div>
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '2rem' }} role="img" aria-label="Speed Lightning">⚡</span>
            <h3 style={{ color: '#0f172a', margin: '0.5rem 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 700 }}>Zero Queue Waiting</h3>
            <p style={{ fontSize: '0.9rem', margin: 0, color: '#64748b' }}>Bypass network upload queues entirely with localized hardware acceleration.</p>
          </div>
          <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '2rem' }} role="img" aria-label="Free Premium Diamond">💎</span>
            <h3 style={{ color: '#0f172a', margin: '0.5rem 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 700 }}>100% Free</h3>
            <p style={{ fontSize: '0.9rem', margin: 0, color: '#64748b' }}>No subscription tiers, hidden paywalls, or feature restrictions.</p>
          </div>
        </div>

        <h2 style={{ color: '#0f172a', fontSize: '1.6rem', fontWeight: 700, marginTop: '2rem', marginBottom: '0.75rem' }}>Continuous Evolution</h2>
        <p>
          Whether you are optimization-tuning image frames for advanced software web applications, compressing photography catalogs, or extracting specific document profiles like multi-layer PDFs, we are constantly tuning our local compiler codebases to bring you stable, studio-grade results.
        </p>
        <p>
          Thank you for choosing MoonConverter as your trusted micro-utility framework. If you have any suggestions, system optimization insights, or want to say hello, feel free to drop a line through our <a href="/feedback.html" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>Feedback Portal</a>.
        </p>

      </section>
    </main>
  );
}