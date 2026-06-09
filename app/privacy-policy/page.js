'use client';

export default function PrivacyPolicy() {
  return (
    <main className="container" style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 1.5rem', color: '#334155', lineHeight: '1.7', textAlign: 'left' }}>
      
      <h1 style={{ color: '#0f172a', fontSize: '2.5rem', marginBottom: '0.5rem', letterSpacing: '-0.03em', fontWeight: '800' }}>
        Privacy Policy
      </h1>
      <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem', fontWeight: '500' }}>
        Last updated: May 2026
      </p>
      
      <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', marginBottom: '2.5rem' }} />

      <h2 style={{ color: '#0f172a', fontSize: '1.4rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>
        1. Zero Server-Side Storage Commitment
      </h2>
      <p style={{ marginBottom: '1rem' }}>At MoonConverter, we protect your data integrity above all else. Unlike traditional conversion tools, <strong>we do not upload, copy, transfer, or store your files on any remote data infrastructure servers</strong>.</p>
      <p style={{ marginBottom: '1.5rem' }}>All photo mutations, file array conversions, and document structures are processed entirely client-side within your browser's runtime thread using HTML5 local canvas layers and client-side JavaScript engine assets. Your file payloads never cross internet networks or leave your physical machine environment.</p>

      <h2 style={{ color: '#0f172a', fontSize: '1.4rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>
        2. Log Files and Basic Server Analytics
      </h2>
      <p style={{ marginBottom: '1rem' }}>To ensure system health, our cloud deployment infrastructure host (Vercel) automatically logs generic request streams. This standard network transaction info cannot be linked back to you and contains:</p>
      <ul style={{ paddingLeft: '1.25rem', marginBottom: '1.5rem' }}>
        <li style={{ marginBottom: '0.35rem' }}>Internet Protocol (IP) locations</li>
        <li style={{ marginBottom: '0.35rem' }}>Browser client agents and operating platform structures</li>
        <li style={{ marginBottom: '0.35rem' }}>Time allocations and referencing exit pages</li>
      </ul>

      <h2 style={{ color: '#0f172a', fontSize: '1.4rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>
        3. Cookie Files and Ad Network Policies
      </h2>
      <p style={{ marginBottom: '1rem' }}>MoonConverter does not set proprietary tracking cookie modules. However, third-party integrations (such as network analysis script engines or Google AdSense deployment tracking tags) may inject small text cookie files inside your browser profile to compile targeted ad preferences or check system operations maps.</p>
      <p style={{ marginBottom: '1.5rem' }}>You can instantly wipe out or turn off these tracking elements by updating your security configurations panel directly inside your native web browser settings window.</p>

      <h2 style={{ color: '#0f172a', fontSize: '1.4rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>
        4. International Regulations & Compliance Rights
      </h2>
      
      <h3 style={{ color: '#1e293b', fontSize: '1.1rem', fontWeight: '600', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
        GDPR Framework (European Users)
      </h3>
      <p style={{ marginBottom: '1rem' }}>If you are a resident within the European Economic Area, your absolute data sovereignty under the General Data Protection Regulation is fully maintained by our site setup. Since we operate completely serverless, we hold zero data signatures on file. Your right to be forgotten is executed automatically the instant you leave our site and close the active tab browser memory thread.</p>

      <h3 style={{ color: '#1e293b', fontSize: '1.1rem', fontWeight: '600', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
        CCPA Framework (California Users)
      </h3>
      <p style={{ marginBottom: '1.5rem' }}>Under the California Consumer Privacy Act requirements, we officially verify that MoonConverter does not collect any personal identifier consumer information metrics, and <strong>we do not sell your personal information or file histories to external advertising groups or brokers</strong>.</p>

      <h2 style={{ color: '#0f172a', fontSize: '1.4rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>
        5. COPPA Safety (Children's Online Protection)
      </h2>
      <p style={{ marginBottom: '1.5rem' }}>We do not collect or monitor information from any persons under the age of 13. MoonConverter is a safe, free graphical format conversion tool engine accessible only for general business utility and creative design layouts works.</p>

      <h2 style={{ color: '#0f172a', fontSize: '1.4rem', fontWeight: '700', marginTop: '2rem', marginBottom: '0.75rem' }}>
        6. Contacting Legal Infrastructure
      </h2>
      <p>If you have any detailed inquiries regarding our local browser sandbox processing parameters or need support infrastructure assistance, contact our core operators by sending an email query to: <strong>legal@moonconverter.com</strong>.</p>

    </main>
  );
}