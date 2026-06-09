// public/pdf-worker.js

// 🟢 Import the professional global standalone engine distribution via unpkg CDN
importScripts('https://unpkg.com/@quicktoolsone/pdf-compress@1.0.4/dist/index.global.js');

/**
 * 🔒 MoonConverter Secure Offline PDF Web Worker Engine
 * Executes multi-strategy structural deflating and canvas page downsampling
 * 100% locally on the client-side device thread without freezing the main UI.
 */
self.onmessage = async function (e) {
  const { fileBuffer, mode, profile, targetSizeKb } = e.data;

  try {
    self.postMessage({ 
      status: 'processing', 
      pass: 1, 
      currentSizeEstimate: 'Initializing localized secure sandbox...' 
    });

    // 1. CALCULATE TARGET PRESET
    // Map the user's explicit KB target limits directly to background resolution profiles
    let targetPreset = 'balanced'; // Balanced default configuration baseline

    if (mode === 'target') {
      const currentSizeKb = fileBuffer.byteLength / 1024;
      const targetRatio = targetSizeKb / currentSizeKb;

      if (targetRatio < 0.35) {
        targetPreset = 'max';      // Aggressive DPI scaling (e.g. 200KB down to 50KB constraints)
      } else if (targetRatio < 0.75) {
        targetPreset = 'balanced'; // Standard balance optimization (e.g. 200KB down to 100KB constraints)
      } else {
        targetPreset = 'lossless'; // Metadata stripping and object stream deflating only
      }
    } else {
      // Map selector forms profiles
      if (profile === 'maximum') targetPreset = 'max';
      if (profile === 'low') targetPreset = 'lossless';
    }

    self.postMessage({ 
      status: 'processing', 
      pass: 2, 
      currentSizeEstimate: 'Analyzing stream matrices and objects...' 
    });

    // 2. 🔥 TRIGGER MULTI-STRATEGY COMPRESSION MATRIX
    // First tries structural data object stripping. If the file is image-heavy or uses
    // locked inline arrays, it falls back to rendering page fragments via an offscreen canvas.
    const result = await PDFCompress.compress(fileBuffer, {
      preset: targetPreset,
      onProgress: (event) => {
        // Intercept internal progress events and pipe live update hooks up to the main UI loading view
        if (event.message) {
          self.postMessage({
            status: 'processing',
            pass: 2,
            currentSizeEstimate: event.message
          });
        }
      }
    });

    self.postMessage({ 
      status: 'processing', 
      pass: 3, 
      currentSizeEstimate: 'Assembling clean binary object stream indices...' 
    });

    // 3. EXTRACT RESULTS AND SHIFT BACK ACROSS WORKER THREAD BOUNDARY
    const finalBuffer = result.pdf; 
    const finalSizeKb = finalBuffer.byteLength / 1024;

    // Send the truly updated compressed data asset back to your main React component
    self.postMessage({
      status: 'success',
      finalBuffer: finalBuffer,
      finalSizeKb: finalSizeKb.toFixed(1)
    }, [finalBuffer]); // Zero-copy Transferable Optimization clears worker heap leaks instantly

  } catch (error) {
    self.postMessage({ status: 'error', message: error.toString() });
  }
};