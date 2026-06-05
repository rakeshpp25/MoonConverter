'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // 🚀 Import Next.js client-side router

export default function FeedbackPage() {
  const router = useRouter(); // Initialize router instance

  // --- STATE FOR FORM ACTIONS & NOTIFICATIONS ---
  const [submitBtnText, setSubmitBtnText] = useState('Send Feedback');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // 🎉 Track success state
  const [countdown, setCountdown] = useState(3); // ⏱️ Countdown timer state

  // --- HOVER INTERACTION STATES ---
  const [isHovered, setIsHovered] = useState(false);
  const [focusField, setFocusField] = useState('');

  // --- TRIGGER HOMEPAGE REDIRECT TIMER ONLY ON SUCCESS ---
  useEffect(() => {
    if (!isSuccess) return;

    // Tick down every second
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    // Once countdown hits 0, safely push to home route
    const redirectTimeout = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimeout);
    };
  }, [isSuccess, router]);

  // --- SUBMIT COMPILER EVENT SEQUENCE ---
  const handleSubmitPipeline = async (event) => {
    event.preventDefault();
    
    setIsSubmitting(true);
    setSubmitBtnText('Sending Feedback...');
    setShowError(false);

    const formElement = event.target;
    const formData = new FormData(formElement);

    try {
      const response = await fetch('https://formspree.io/f/mykvapzo', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setIsSuccess(true); // Switch view to success state immediately
      } else {
        const data = await response.json();
        if (Object.hasOwn(data, 'errors')) {
          setErrorMessage(data.errors.map(err => err.message).join(", "));
        } else {
          setErrorMessage("Oops! There was a problem submitting your form.");
        }
        setShowError(true);
        resetStateOperator();
      }
    } catch (error) {
      setErrorMessage("Oops! There was a network connectivity error. Please try again.");
      setShowError(true);
      resetStateOperator();
    }
  };

  const resetStateOperator = () => {
    setIsSubmitting(false);
    setSubmitBtnText('Send Feedback');
  };

  // --- INLINE DESIGN RULES CONFIG ---
  const getInputStyle = (fieldName) => ({
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    border: '1px solid',
    borderColor: focusField === fieldName ? '#4f46e5' : '#cbd5e1',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  });

  return (
    <main style={{ padding: '5rem 0', textAlign: 'center' }}>
      <div className="container" style={{ maxWidth: '600px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* DYNAMIC VIEW CONDITION: SHOW SUCCESS INSTEAD OF FORM ONCE TRANSFERRED */}
        {isSuccess ? (
          <div style={{ 
            background: '#ffffff', 
            border: '1px solid #e2e8f0', 
            padding: '4rem 2rem', 
            borderRadius: '24px', 
            boxShadow: '0 15px 35px rgba(79, 70, 229, 0.04)',
            textAlign: 'center'
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              background: '#f0fdf4', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 1.5rem auto' 
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            
            <h1 style={{ color: '#0f172a', fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              Feedback Received!
            </h1>
            <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              Thank you for helping us make MoonConverter better. Your message has been directly channeled into our pipeline repository queue.
            </p>

            <div style={{ color: '#4f46e5', fontWeight: 600, fontSize: '0.9rem', background: '#eef2ff', padding: '0.5rem 1rem', borderRadius: '8px', display: 'inline-block' }}>
              🔄 Redirecting back to homepage in {countdown}s...
            </div>
          </div>
        ) : (
          /* STANDARD ENTRY VIEW CONTAINER */
          <>
            <span style={{ fontSize: '3.5rem' }} role="img" aria-label="Idea Bulb">💡</span>
            
            <h1 style={{ color: '#0f172a', fontSize: '2.4rem', fontWeight: 800, marginTop: '1rem', marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
              Help Us Improve MoonConverter
            </h1>
            <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2.5rem', fontWeight: 500 }}>
              Please share your feature suggestions, report layout bugs, or let us know what else you want added to the system template!
            </p>

            {showError && (
              <div 
                id="form-error-msg" 
                style={{ 
                  display: 'block', 
                  background: '#fce8e6', 
                  color: '#c5221f', 
                  border: '1px solid #dadce0', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  fontWeight: 700, 
                  marginBottom: '2rem', 
                  textAlign: 'center' 
                }}
              >
                {errorMessage}
              </div>
            )}
            
            <form 
              onSubmit={handleSubmitPipeline}
              style={{ 
                background: '#ffffff', 
                border: '1px solid #e2e8f0', 
                padding: '2.5rem', 
                borderRadius: '24px', 
                boxShadow: '0 15px 35px rgba(79, 70, 229, 0.04)', 
                textAlign: 'left' 
              }}
            >
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="name" style={{ display: 'block', fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Your Name (Optional)</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  placeholder="John Doe" 
                  style={getInputStyle('name')}
                  onFocus={() => setFocusField('name')}
                  onBlur={() => setFocusField('')}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="email" style={{ display: 'block', fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Email Address (Optional)</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  placeholder="you@example.com" 
                  style={getInputStyle('email')}
                  onFocus={() => setFocusField('email')}
                  onBlur={() => setFocusField('')}
                />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label htmlFor="message" style={{ display: 'block', fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Suggestions, Ideas, or Bugs <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea 
                  id="message" 
                  name="message" 
                  required 
                  rows={5} 
                  placeholder="Tell us what new tools you want or describe any platform bugs you encountered..." 
                  style={{ ...getInputStyle('message'), resize: 'vertical' }}
                  onFocus={() => setFocusField('message')}
                  onBlur={() => setFocusField('')}
                ></textarea>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{ 
                  display: 'block', 
                  width: '100%', 
                  background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', 
                  color: 'white', 
                  padding: '0.9rem', 
                  fontSize: '1.05rem', 
                  borderRadius: '12px', 
                  fontWeight: 700, 
                  border: 'none', 
                  cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                  textAlign: 'center', 
                  boxShadow: isHovered ? '0 6px 16px rgba(79, 70, 229, 0.3)' : '0 4px 12px rgba(79, 70, 229, 0.2)', 
                  transform: isHovered && !isSubmitting ? 'translateY(-1px)' : 'translateY(0)',
                  transition: 'all 0.2s',
                  opacity: isSubmitting ? 0.8 : 1
                }}
              >
                {submitBtnText}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}