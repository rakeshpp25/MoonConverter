'use client';

import { useState, useEffect, useRef } from 'react';

export default function ImageCompressor() {
  // --- FILE STORAGE STATES ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDetails, setFileDetails] = useState({ name: '', sizeKb: 0, type: '' });
  
  // --- UI CONTROLLER STATES ---
  const [compressionMode, setCompressionMode] = useState('target'); // 'slider' or 'target'
  const [qualitySlider, setQualitySlider] = useState(75);
  const [manualTargetSize, setManualTargetSize] = useState('200'); // Default target 200 KB
  
  // --- PROCESSING ENGINE STATES ---
  const [engineStatus, setEngineStatus] = useState('idle'); // 'idle', 'processing', 'success', 'error'
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
  // Solves the blind guessing game pain point by calculating quality loss expectations instantly
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

  // --- INITIALIZE WEB WORKER THREAD ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Safety guardrail to protect laptop memory footprint bounds
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
      setEngineStatus('idle');
      setCompressedDownloadUrl('');
    }
  };

  // --- COMMUNICATE WITH BACKGROUND THREAD LOOP ---
  const triggerCompression = async () => {
    if (!selectedFile) return;

    setEngineStatus('processing');
    setProcessingPass(1);
    setErrorMessage('');

    // Setup an isolated web worker background script pointer
    workerRef.current = new Worker('/image-worker.js');

    const fileArrayBuffer = await selectedFile.arrayBuffer();

    // Transport payloads directly across the worker thread wall lines
    workerRef.current.postMessage({
      fileBuffer: fileArrayBuffer,
      fileType: selectedFile.type,
      fileName: selectedFile.name,
      mode: compressionMode,
      qualitySliderValue: qualitySlider,
      targetSizeKb: parseFloat(manualTargetSize) || 200
    }, [fileArrayBuffer]); // Ownership transfer prevents duplicate memory copies

    // Handle incoming evaluation returns from public/image-worker.js
    workerRef.current.onmessage = function (e) {
      const { status, pass, currentSizeEstimate, finalBuffer, finalSizeKb, qualityPercentageUsed, forcedFormatShift, message } = e.data;

      if (status === 'processing') {
        setProcessingPass(pass);
        setLiveSizeEstimate(`${currentSizeEstimate} KB`);
      } 
      else if (status === 'success') {
        const outputBlob = new Blob([finalBuffer], { type: forcedFormatShift ? 'image/jpeg' : selectedFile.type });
        const downloadLinkUrl = URL.createObjectURL(outputBlob);

        setCompressedDownloadUrl(downloadLinkUrl);
        setOutputDetails({
          sizeKb: parseFloat(finalSizeKb),
          qualityUsed: qualityPercentageUsed,
          formatShifted: forcedFormatShift
        });
        setEngineStatus('success');
        workerRef.current.terminate(); // Safely kill background worker thread to free computer memory
      } 
      else if (status === 'error') {
        setErrorMessage(message || 'An operational loop error occurred.');
        setEngineStatus('error');
        workerRef.current.terminate();
      }
    };
  };

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', textAlign: 'left' }}>
      
      {/* CARD HEADERS */}
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

      {/* FILE SELECTION SLOT */}
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
          <button onClick={() => { setSelectedFile(null); setEngineStatus('idle'); }} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
        </div>
      )}

      {/* INTERACTIVE MODE TOGGLE SWITCH SELECTOR */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f1f5f9', padding: '0.35rem', borderRadius: '12px' }}>
        <button onClick={() => setCompressionMode('target')} style={{ border: 'none', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', background: compressionMode === 'target' ? '#ffffff' : 'transparent', color: compressionMode === 'target' ? '#4f46e5' : '#64748b', boxShadow: compressionMode === 'target' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.15s' }}>
          🎯 Target Exact Size
        </button>
        <button onClick={() => setCompressionMode('slider')} style={{ border: 'none', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', background: compressionMode === 'slider' ? '#ffffff' : 'transparent', color: compressionMode === 'slider' ? '#4f46e5' : '#64748b', boxShadow: compressionMode === 'slider' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.15s' }}>
          🎚️ Quality Slider
        </button>
      </div>

      {/* --- RENDER CONFIGURATION PORTS DEPENDING ON SELECTION MODE --- */}
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

          {/* ONE-CLICK SHORTCUT QUICK CHIPS SPLIT PORTS ARRAY */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>Presets:</span>
            {[
              { label: '🏛️ Govt Upload (50KB)', val: '50' },
              { label: '💼 Job Forms (200KB)', val: '200' },
              { label: '🖼️ Web Fast (500KB)', val: '500' }
            ].map((chip, idx) => (
              <button key={idx} onClick={() => setManualTargetSize(chip.val)} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={(e) => e.target.style.borderColor = '#4f46e5'} onMouseLeave={(e) => e.target.style.borderColor = '#e2e8f0'}>
                {chip.label}
              </button>
            ))}
          </div>

          {/* REAL TIME FEEDBACK CLARITY STATUS BOX */}
          {selectedFile && (
            <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>Expected Quality Forecast:</div>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: clarityForecast.color }}>{clarityForecast.text}</div>
            </div>
          )}
        </div>
      )}

      {/* LIVE ENGINE PROCESS EXECUTION MONITOR STRIPS */}
      {engineStatus === 'processing' && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '700', color: '#1e40af' }}>
            <span>🔄 Running binary check iterations...</span>
            <span>Pass {processingPass}/5</span>
          </div>
          {compressionMode === 'target' && liveSizeEstimate && (
            <div style={{ fontSize: '0.75rem', color: '#1e3a8a', fontWeight: '600' }}>
              Current optimization pass weight footprint: <strong style={{color: '#4f46e5'}}>{liveSizeEstimate}</strong>
            </div>
          )}
        </div>
      )}

      {/* --- RUN ACTION MATRIX CLICK LOGIC TRIGGERS --- */}
      <div style={{ marginTop: 'auto' }}>
        {engineStatus !== 'success' ? (
          <button onClick={triggerCompression} disabled={!selectedFile || engineStatus === 'processing'} style={{ width: '100%', background: selectedFile && engineStatus !== 'processing' ? 'linear-gradient(135deg, #4F46E5, #4338CA)' : '#cbd5e1', color: 'white', border: 'none', padding: '0.9rem', borderRadius: '12px', fontWeight: '700', cursor: selectedFile && engineStatus !== 'processing' ? 'pointer' : 'not-allowed', boxShadow: selectedFile && engineStatus !== 'processing' ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none', transition: 'all 0.2s' }}>
            {engineStatus === 'processing' ? 'Calculating Target Footprint...' : 'Optimize File Capacity'}
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', color: '#065f46', lineHeight: '1.5', fontWeight: '600' }}>
              🎉 Success! File shrank to <strong>{outputDetails.sizeKb.toFixed(1)} KB</strong> (Using safety optimization limit matching {outputDetails.qualityUsed}% bounds).
              {outputDetails.formatShifted && <div style={{ marginTop: '0.25rem', color: '#047857', fontSize: '0.8rem' }}>⚠️ Note: PNG format shifted to JPEG to fit your explicit low limit target size safely.</div>}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <a href={compressedDownloadUrl} download={`moon_optimized_${fileDetails.name}`} style={{ display: 'block', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', padding: '0.9rem', borderRadius: '12px', fontWeight: '700', textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                Download
              </a>
              <button onClick={() => { setSelectedFile(null); setEngineStatus('idle'); setCompressedDownloadUrl(''); }} style={{ background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>
                Compress New
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}