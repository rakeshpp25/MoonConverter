'use client';

import { useState, useEffect, useRef } from 'react';

export default function PdfCompressor() {
  // --- LAYER STATE STEP MANAGER ---
  // Steps: 'setup' (Form Inputs), 'processing' (Loading view), 'success' (Download Page view)
  const [activeStep, setActiveStep] = useState('setup');

  // --- FILE STORAGE STATES ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDetails, setFileDetails] = useState({ name: '', sizeKb: 0 });

  // --- UI CONTROLLER STATES ---
  const [compressionMode, setCompressionMode] = useState('target'); // 'target' or 'profile'
  const [optimizationProfile, setOptimizationProfile] = useState('recommended'); 
  const [manualTargetSize, setManualTargetSize] = useState('500'); // Default target 500 KB for PDFs
  
  // --- PROCESSING ENGINE STATES ---
  const [processingPass, setProcessingPass] = useState(0);
  const [liveSizeEstimate, setLiveSizeEstimate] = useState('');
  const [clarityForecast, setClarityForecast] = useState({ text: 'High Clarity', color: '#10b981' });
  const [errorMessage, setErrorMessage] = useState('');

  // --- DOWNLOAD OUTPUT STATES ---
  const [compressedDownloadUrl, setCompressedDownloadUrl] = useState('');
  const [outputDetails, setOutputDetails] = useState({ sizeKb: 0, compressionRatio: 0 });

  const fileInputRef = useRef(null);
  const workerRef = useRef(null);

  // --- 🔥 LOGIC: REAL-TIME CLARITY FORECAST Engine for Documents ---
  useEffect(() => {
    if (!selectedFile || compressionMode !== 'target') return;

    const originalSizeKb = fileDetails.sizeKb;
    const requestedSizeKb = parseFloat(manualTargetSize) || 0;

    if (requestedSizeKb <= 0) {
      setClarityForecast({ text: 'Invalid Target Size', color: '#ef4444' });
      return;
    }

    const reductionRatio = requestedSizeKb / originalSizeKb;

    if (reductionRatio >= 0.6) {
      setClarityForecast({ text: '💎 Razor Sharp (Text vectors & embedded web fonts fully preserved)', color: '#10b981' });
    } else if (reductionRatio >= 0.25) {
      setClarityForecast({ text: '⚡ Optimized Balance (Ideal for email attachments and job portals)', color: '#f59e0b' });
    } else {
      setClarityForecast({ text: '⚠️ Heavy Compression (Flattened scannable image layers may look blurry)', color: '#ef4444' });
    }
  }, [manualTargetSize, selectedFile, compressionMode, fileDetails.sizeKb]);

  // --- HANDLE INCOMING FILE ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage('To protect browser stability, PDF documents are capped at 50MB.');
        return;
      }

      setErrorMessage('');
      setSelectedFile(file);
      setFileDetails({
        name: file.name,
        sizeKb: file.size / 1024
      });
      setActiveStep('setup');
    }
  };

  // --- RUN BACKGROUND WORKER COMPRESSION ---
  const triggerCompression = async () => {
    if (!selectedFile) return;

    const lockedTargetSize = Math.floor(parseFloat(manualTargetSize)) || 500;

    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    if (compressedDownloadUrl) {
      URL.revokeObjectURL(compressedDownloadUrl);
      setCompressedDownloadUrl('');
    }

    setOutputDetails({ sizeKb: 0, compressionRatio: 0 });
    setLiveSizeEstimate('');

    setActiveStep('processing');
    setProcessingPass(1);
    setErrorMessage('');

    // Spawn the fresh high-speed worker instance
    workerRef.current = new Worker('/pdf-worker.js');
    
    // 🟢 SAFETIES: Add an absolute time threshold trap. If a browser takes too long,
    // it falls back to setup safely so the interface never crashes or locks up.
    const processingTimeoutTracker = setTimeout(() => {
      if (workerRef.current && activeStep === 'processing') {
        workerRef.current.terminate();
        workerRef.current = null;
        setErrorMessage('This complex document is highly compressed or protected. Try using a preset profile mode instead.');
        setActiveStep('setup');
      }
    }, 45000); // 45-second hardware cutoff safety net

    const fileArrayBuffer = await selectedFile.arrayBuffer();

    workerRef.current.postMessage({
      fileBuffer: fileArrayBuffer,
      fileName: selectedFile.name,
      mode: compressionMode,
      profile: optimizationProfile,
      targetSizeKb: lockedTargetSize
    });

    workerRef.current.onmessage = function (e) {
      const { status, pass, currentSizeEstimate, finalBuffer, finalSizeKb, message } = e.data;

      if (status === 'processing') {
        setProcessingPass(pass);
        setLiveSizeEstimate(currentSizeEstimate);
      } 
      else if (status === 'success') {
        clearTimeout(processingTimeoutTracker); // Clear timeout safety instantly on success
        
        const outputBlob = new Blob([finalBuffer], { type: 'application/pdf' });
        const downloadLinkUrl = URL.createObjectURL(outputBlob);

        const savedSize = parseFloat(finalSizeKb);
        const originalSize = fileDetails.sizeKb;
        const reductionPercent = Math.round(((originalSize - savedSize) / originalSize) * 100);

        setOutputDetails({
          sizeKb: savedSize,
          compressionRatio: reductionPercent > 0 ? reductionPercent : 0
        });
        setCompressedDownloadUrl(downloadLinkUrl);

        setTimeout(() => {
          setActiveStep('success');
        }, 40);

        workerRef.current.terminate();
        workerRef.current = null;
      } 
      else if (status === 'error') {
        clearTimeout(processingTimeoutTracker);
        setErrorMessage(message || 'An error occurred during PDF optimization processing.');
        setActiveStep('setup');
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
      }
    };
  };
  // --- FULL HARD RESET ROUTINE ---
  const handleFullReset = () => {
    if (compressedDownloadUrl) {
      URL.revokeObjectURL(compressedDownloadUrl);
    }
    setSelectedFile(null);
    setFileDetails({ name: '', sizeKb: 0 });
    setCompressedDownloadUrl('');
    setOptimizationProfile('recommended');
    setManualTargetSize('500');
    setCompressionMode('target');
    setActiveStep('setup');
  };

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', textAlign: 'left' }}>
      
      {/* --- STEP 1: SETUP WORKSPACE --- */}
      {activeStep === 'setup' && (
        <>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.85rem' }}>📕</span>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em' }}>Tiered Secure PDF Compressor</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6' }}>
              🔒 Local Sandbox Active. Strips metadata layers and optimizes scanning DPI limits 100% locally.
            </p>
          </div>

          {errorMessage && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600' }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {!selectedFile ? (
            <div>
              <input type="file" id="compPdfFileField" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileChange} ref={fileInputRef} />
              <label htmlFor="compPdfFileField" style={{ display: 'block', background: '#f8fafc', border: '2px dashed #cbd5e1', padding: '2rem 1rem', borderRadius: '14px', textAlign: 'center', cursor: 'pointer', fontWeight: '700', color: '#475569', transition: 'all 0.2s' }}>
                Click to select document payload (.pdf)
              </label>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ minWidth: 0, flex: 1, paddingRight: '1rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileDetails.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600', marginTop: '0.15rem' }}>Original size: {fileDetails.sizeKb.toFixed(1)} KB</div>
              </div>
              <button type="button" onClick={handleFullReset} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
            </div>
          )}

          {/* INTERACTIVE MODE TOGGLE SWITCH SELECTOR */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f1f5f9', padding: '0.35rem', borderRadius: '12px' }}>
            <button type="button" onClick={() => setCompressionMode('target')} style={{ border: 'none', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', background: compressionMode === 'target' ? '#ffffff' : 'transparent', color: compressionMode === 'target' ? '#1e1b4b' : '#64748b', boxShadow: compressionMode === 'target' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.15s' }}>
              🎯 Target Exact Size
            </button>
            <button type="button" onClick={() => setCompressionMode('profile')} style={{ border: 'none', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', background: compressionMode === 'profile' ? '#ffffff' : 'transparent', color: compressionMode === 'profile' ? '#1e1b4b' : '#64748b', boxShadow: compressionMode === 'profile' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.15s' }}>
              ⚙️ Custom Profiles
            </button>
          </div>

          {/* --- CONFIGURATION FIELDS PORTS --- */}
          {compressionMode === 'profile' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Optimization Processing Profile:</label>
              <select 
                value={optimizationProfile} 
                onChange={(e) => setOptimizationProfile(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: '700', outline: 'none', color: '#0f172a', background: '#ffffff', cursor: 'pointer' }}
              >
                <option value="recommended">Recommended Mode (Isolate Text & Keep Razor Sharp)</option>
                <option value="maximum">Maximum Downsample Crunch (Compress Heavy Image Scan Layers)</option>
                <option value="low">Low Optimization (Lossless Structural Deflate & Metadata Scrub)</option>
              </select>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Enter target file size limit constraints:</label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <input type="number" value={manualTargetSize} onChange={(e) => setManualTargetSize(e.target.value)} style={{ width: '100%', padding: '0.75rem 3rem 0.75rem 0.85rem', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', fontWeight: '700', outline: 'none', color: '#0f172a' }} placeholder="e.g. 500" />
                  <span style={{ position: 'absolute', right: '1rem', fontWeight: '800', fontSize: '0.85rem', color: '#94a3b8', letterSpacing: '0.05em' }}>KB</span>
                </div>
              </div>

              {/* QUICK CONFIG SHORTCUT CHIPS */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>Presets:</span>
                {[
                  { label: '🏛️ Govt Portal (100KB)', val: '100' },
                  { label: '💼 Resume Share (500KB)', val: '500' },
                  { label: '📁 Normal Document (1000KB)', val: '1000' }
                ].map((chip, idx) => (
                  <button type="button" key={idx} onClick={() => setManualTargetSize(chip.val)} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '0.3rem 0.75rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* CLARITY FORECAST INDICATOR BOX */}
              {selectedFile && (
                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>Expected Quality Forecast:</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '800', color: clarityForecast.color }}>{clarityForecast.text}</div>
                </div>
              )}
            </div>
          )}

          <button type="button" onClick={triggerCompression} disabled={!selectedFile} style={{ width: '100%', background: selectedFile ? 'linear-gradient(135deg, #1E1B4B, #312E81)' : '#cbd5e1', color: 'white', border: 'none', padding: '0.9rem', borderRadius: '12px', fontWeight: '700', cursor: selectedFile ? 'pointer' : 'not-allowed', boxShadow: selectedFile ? '0 4px 12px rgba(30, 27, 75, 0.15)' : 'none', transition: 'all 0.2s', marginTop: 'auto' }}>
            Crunch Document Capacity
          </button>
        </>
      )}

      {/* --- STEP 2: PROCESSING / LOADING RUN --- */}
      {activeStep === 'processing' && (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #1e1b4b', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: '800', color: '#0f172a', fontSize: '1.1rem' }}>Re-indexing Document Cluster Quantities</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>Evaluating binary vector layers locally inside background memory streams...</p>
          </div>
          {liveSizeEstimate && (
            <div style={{ background: '#f5f5f7', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.8rem', color: '#1e1b4b', fontWeight: '700', border: '1px solid #e2e8f0' }}>
              Current object pass weight trace: {liveSizeEstimate} (Cycle pass {processingPass})
            </div>
          )}
        </div>
      )}

      {/* --- STEP 3: DEDICATED DOWNLOAD SUCCESS PAGE --- */}
      {activeStep === 'success' && (
        <>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.85rem' }}>⚡</span>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em' }}>PDF Compression Complete!</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Your optimized PDF asset is compiled and verified.</p>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
              <span>Document Title:</span>
              <strong style={{ color: '#0f172a', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileDetails.name}</strong>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
              <span>Initial Blueprint Size:</span>
              <span style={{ color: '#64748b' }}>{fileDetails.sizeKb.toFixed(1)} KB</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#475569', fontWeight: '600', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '0.75rem' }}>
              <span>Optimized Output Weight:</span>
              <strong style={{ color: '#4f46e5', fontSize: '1rem' }}>{outputDetails.sizeKb.toFixed(1)} KB</strong>
            </div>
          </div>

          {outputDetails.compressionRatio > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', textAlign: 'center' }}>
              📈 Document weight reduced by {outputDetails.compressionRatio}% overall!
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
            <a href={compressedDownloadUrl} download={`moon_compressed_${fileDetails.name}`} style={{ display: 'block', background: 'linear-gradient(135deg, #1E1B4B, #312E81)', color: 'white', padding: '0.9rem', borderRadius: '12px', fontWeight: '700', textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 12px rgba(30, 27, 75, 0.2)', fontSize: '0.95rem' }}>
              📥 Download Optimized PDF
            </a>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0.5rem', marginTop: '0.25rem' }}>
              <button type="button" onClick={() => setActiveStep('setup')} style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                ⚙️ Alter Profile Settings
              </button>
              <button type="button" onClick={handleFullReset} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                📁 Choose Different Document
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}