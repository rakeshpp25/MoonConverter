'use client';

import { useState, useEffect, useRef } from 'react';

export default function ImageCompressor() {
  // --- LAYER STATE STEP MANAGER ---
  // Steps: 'setup' (Form Inputs), 'processing' (Loading view), 'success' (Download Page view)
  const [activeStep, setActiveStep] = useState('setup'); 

  // --- FILE STORAGE STATES ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDetails, setFileDetails] = useState({ name: '', sizeKb: 0, type: '' });
  
  // --- UI CONTROLLER STATES ---
  const [compressionMode, setCompressionMode] = useState('target'); // 'slider' or 'target'
  const [qualitySlider, setQualitySlider] = useState(75);
  const [manualTargetSize, setManualTargetSize] = useState('200'); // Default target 200 KB
  
  // --- PROCESSING ENGINE STATES ---
  const [processingPass, setProcessingPass] = useState(0);
  const [liveSizeEstimate, setLiveSizeEstimate] = useState('');
  const [clarityForecast, setClarityForecast] = useState({ text: 'High Clarity', color: '#10b981' });
  
  // --- DOWNLOAD OUTPUT STATES ---
  const [compressedDownloadUrl, setCompressedDownloadUrl] = useState('');
  const [outputDetails, setOutputDetails] = useState({ sizeKb: 0, qualityUsed: 0, formatShifted: false });
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);
  const workerRef = useRef(null);

  // --- 🔥 LOGIC: REAL-TIME CLARITY FORECAST Engine ---
  useEffect(() => {
    if (!selectedFile || compressionMode !== 'target') return;

    const originalSizeKb = fileDetails.sizeKb;
    const requestedSizeKb = parseFloat(manualTargetSize) || 0;

    if (requestedSizeKb <= 0) {
      setClarityForecast({ text: 'Invalid Target Size', color: '#ef4444' });
      return;
    }

    const reductionRatio = requestedSizeKb / originalSizeKb;

    if (reductionRatio >= 0.7) {
      setClarityForecast({ text: '💎 Razor Sharp (Text vectors fully preserved)', color: '#10b981' });
    } else if (reductionRatio >= 0.3) {
      setClarityForecast({ text: '⚡ Optimized Balance (Great for web/portals)', color: '#f59e0b' });
    } else {
      setClarityForecast({ text: '⚠️ Heavy Compression (Text layers might look slightly blurry)', color: '#ef4444' });
    }
  }, [manualTargetSize, selectedFile, compressionMode, fileDetails.sizeKb]);

  // --- HANDLE INCOMING FILE ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.size > 30 * 1024 * 1024) {
        setErrorMessage('To protect your laptop memory, images are capped at 30MB.');
        return;
      }

      setErrorMessage('');
      setSelectedFile(file);
      setFileDetails({
        name: file.name,
        sizeKb: file.size / 1024,
        type: file.type
      });
      setActiveStep('setup');
    }
  };

  // --- COMMUNICATE WITH BACKGROUND THREAD LOOP ---
  const triggerCompression = async () => {
    if (!selectedFile) return;

    // 🟢 CRITICAL CACHE BREAK: If a background thread is already alive, kill it instantly
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    // 1. MEMORY PURGE: Revoke old object links inside browser memory cache layers
    if (compressedDownloadUrl) {
      URL.revokeObjectURL(compressedDownloadUrl);
      setCompressedDownloadUrl('');
    }

    // 2. STATE HARD PURGE: Wipe calculation object state before entering the processing pass
    setOutputDetails({ sizeKb: 0, qualityUsed: 0, formatShifted: false });
    setLiveSizeEstimate('');

    setActiveStep('processing');
    setProcessingPass(1);
    setErrorMessage('');

    // Now spawn a 100% fresh, un-cached worker thread instance
    workerRef.current = new Worker('/image-worker.js');
    const fileArrayBuffer = await selectedFile.arrayBuffer();

    workerRef.current.postMessage({
      fileBuffer: fileArrayBuffer,
      fileType: selectedFile.type,
      fileName: selectedFile.name,
      mode: compressionMode,
      qualitySliderValue: qualitySlider,
      targetSizeKb: parseFloat(manualTargetSize) || 200
    }); 

    workerRef.current.onmessage = function (e) {
      const { status, pass, currentSizeEstimate, finalBuffer, finalSizeKb, qualityPercentageUsed, forcedFormatShift, message } = e.data;

      if (status === 'processing') {
        setProcessingPass(pass);
        setLiveSizeEstimate(`${currentSizeEstimate} KB`);
      } 
      else if (status === 'success') {
        const outputBlob = new Blob([finalBuffer], { type: forcedFormatShift ? 'image/jpeg' : selectedFile.type });
        const downloadLinkUrl = URL.createObjectURL(outputBlob);

        setOutputDetails({
          sizeKb: parseFloat(finalSizeKb),
          qualityUsed: qualityPercentageUsed,
          formatShifted: forcedFormatShift
        });
        setCompressedDownloadUrl(downloadLinkUrl);
        
        setTimeout(() => {
          setActiveStep('success');
        }, 40);

        workerRef.current.terminate(); 
        workerRef.current = null; // Clear the pointer reference
      } 
      else if (status === 'error') {
        setErrorMessage(message || 'An operational loop error occurred.');
        setActiveStep('setup');
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  };

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', textAlign: 'left' }}>
      
      {/* --- STEP 1: SETUP WORKSPACE --- */}
      {activeStep === 'setup' && (
        <>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.85rem' }}>🖼️</span>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em' }}>Advanced Local Image Compressor</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>
              🔒 100% Secure Client-Side Engine. Your image bytes never hit an online cloud platform server.
            </p>
          </div>

          {errorMessage && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600' }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {!selectedFile ? (
            <div>
              <input type="file" id="compImageFileField" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFileChange} ref={fileInputRef} />
              <label htmlFor="compImageFileField" style={{ display: 'block', background: '#f8fafc', border: '2px dashed #cbd5e1', padding: '2rem 1rem', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', fontWeight: '700', color: '#475569', transition: 'all 0.2s' }}>
                Click to drop image asset (JPG, PNG, WebP)
              </label>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ minWidth: 0, flex: 1, paddingRight: '1rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileDetails.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginTop: '0.15rem' }}>Original size: {fileDetails.sizeKb.toFixed(1)} KB</div>
              </div>
              <button onClick={handleFullReset} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f1f5f9', padding: '0.35rem', borderRadius: '12px' }}>
            <button onClick={() => setCompressionMode('target')} style={{ border: 'none', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', background: compressionMode === 'target' ? '#ffffff' : 'transparent', color: compressionMode === 'target' ? '#4f46e5' : '#64748b', boxShadow: compressionMode === 'target' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.15s' }}>
              🎯 Target Exact Size
            </button>
            <button onClick={() => setCompressionMode('slider')} style={{ border: 'none', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', background: compressionMode === 'slider' ? '#ffffff' : 'transparent', color: compressionMode === 'slider' ? '#4f46e5' : '#64748b', boxShadow: compressionMode === 'slider' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.15s' }}>
              🎚️ Quality Slider
            </button>
          </div>

          {compressionMode === 'slider' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>
                <label>Compression Level:</label>
                <span style={{ color: '#4f46e5' }}>{qualitySlider}% quality</span>
              </div>
              <input type="range" min="15" max="95" value={qualitySlider} onChange={(e) => setQualitySlider(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#4f46e5', cursor: 'pointer' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Enter target file size limit constraints:</label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <input type="number" value={manualTargetSize} onChange={(e) => setManualTargetSize(e.target.value)} style={{ width: '100%', padding: '0.75rem 3rem 0.75rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: '700', outline: 'none', color: '#0f172a' }} placeholder="e.g. 150" />
                  <span style={{ position: 'absolute', right: '1rem', fontWeight: '800', fontSize: '0.85rem', color: '#94a3b8', letterSpacing: '0.05em' }}>KB</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>Presets:</span>
                {[
                  { label: '🏛️ Govt Upload (50KB)', val: '50' },
                  { label: '💼 Job Forms (200KB)', val: '200' },
                  { label: '🖼️ Web Fast (500KB)', val: '500' }
                ].map((chip, idx) => (
                  <button key={idx} onClick={() => setManualTargetSize(chip.val)} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {chip.label}
                  </button>
                ))}
              </div>

              {selectedFile && (
                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>Expected Quality Forecast:</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: clarityForecast.color }}>{clarityForecast.text}</div>
                </div>
              )}
            </div>
          )}

          <button onClick={triggerCompression} disabled={!selectedFile} style={{ width: '100%', background: selectedFile ? 'linear-gradient(135deg, #4F46E5, #4338CA)' : '#cbd5e1', color: 'white', border: 'none', padding: '0.9rem', borderRadius: '12px', fontWeight: '700', cursor: selectedFile ? 'pointer' : 'not-allowed', boxShadow: selectedFile ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none', transition: 'all 0.2s', marginTop: 'auto' }}>
            Optimize File Capacity
          </button>
        </>
      )}

      {/* --- STEP 2: PROCESSING / LOADING RUN --- */}
      {activeStep === 'processing' && (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '800', color: '#0f172a', fontSize: '1.1rem' }}>Optimizing File Matrix Structure</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Running multi-pass binary crunch equations locally...</p>
          </div>
          {compressionMode === 'target' && liveSizeEstimate && (
            <div style={{ background: '#eff6ff', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.8rem', color: '#1e40af', fontWeight: '700', border: '1px solid #bfdbfe' }}>
              Current footprint weight: {liveSizeEstimate} (Pass {processingPass}/5)
            </div>
          )}
        </div>
      )}

      {/* --- STEP 3: DEDICATED DOWNLOAD SUCCESS PAGE --- */}
      {activeStep === 'success' && (
        <>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.85rem' }}>🎉</span>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em' }}>Optimization Complete!</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Your new compressed data asset is ready for download.</p>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
              <span>File Name:</span>
              <strong style={{ color: '#0f172a', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileDetails.name}</strong>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
              <span>Original Weight:</span>
              <span style={{ color: '#64748b' }}>{fileDetails.sizeKb.toFixed(1)} KB</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem' }}>
              <span>Optimized Weight:</span>
              <strong style={{ color: '#10b981', fontSize: '1rem' }}>{outputDetails.sizeKb.toFixed(1)} KB</strong>
            </div>
          </div>

          {outputDetails.formatShifted && (
            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '600', lineHeight: '1.4' }}>
              💡 PNG formatting was shifted to standard JPEG matrix values to respect your explicit low KB footprint limit constraint safely.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
            <a href={compressedDownloadUrl} download={`moon_optimized_${fileDetails.name}`} style={{ display: 'block', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', padding: '0.9rem', borderRadius: '12px', fontWeight: '700', textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', fontSize: '0.95rem' }}>
              📥 Download Optimized File
            </a>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0.5rem', marginTop: '0.25rem' }}>
              {/* Back Link to adjust configurations */}
              <button onClick={() => setActiveStep('setup')} style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                ⚙️ Modify Settings
              </button>

              {/* Reset link to switch to an entirely different image payload */}
              <button onClick={handleFullReset} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                📁 Choose Different File
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}